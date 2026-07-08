import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/admin/auth';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { createSupabaseAdminClient } from '@/supabase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;

    // 관리자 인증 확인 (admin_session 쿠키 기반)
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    let storagePath: unknown;
    try {
      const body = await request.json();
      storagePath = body?.storagePath;
    } catch {
      return NextResponse.json({ error: '잘못된 요청 형식입니다.' }, { status: 400 });
    }

    if (typeof storagePath !== 'string' || storagePath.length === 0) {
      return NextResponse.json({ error: 'storagePath가 필요합니다.' }, { status: 400 });
    }

    // 보안 검증: 요청된 storagePath가 해당 상담의 attachments 목록에 실제로 존재하는지 확인.
    // 서비스롤은 임의 경로도 서명 가능하므로 반드시 소유 상담 첨부인지 확인해야 함.
    const supabase = getSupabaseAdminClient();
    const { data: consultation, error: fetchError } = await supabase
      .from('consultations')
      .select('id, attachments')
      .eq('id', consultationId)
      .eq('is_del', 'N')
      .single();

    if (fetchError || !consultation) {
      return NextResponse.json(
        { error: '상담 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    const attachments = Array.isArray(consultation.attachments) ? consultation.attachments : [];
    const isOwnedAttachment = attachments.some(
      (attachment: any) => attachment?.storagePath === storagePath
    );

    if (!isOwnedAttachment) {
      return NextResponse.json(
        { error: '해당 상담의 첨부파일이 아닙니다.' },
        { status: 403 }
      );
    }

    // 서비스롤로 비공개 버킷 서명 URL 생성
    const adminClient = createSupabaseAdminClient();
    const { data: signed, error: signError } = await adminClient.storage
      .from('consultation-attachments')
      .createSignedUrl(storagePath, 3600); // 1시간 만료

    if (signError || !signed?.signedUrl) {
      console.error('Attachment signed URL error:', signError);
      return NextResponse.json(
        { error: '첨부파일 URL 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: signed.signedUrl });
  } catch (error) {
    console.error('Admin attachment URL error:', error);
    return NextResponse.json(
      { error: '첨부파일 URL 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
