import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';
import { verifyAdminSession } from '@/lib/utils/admin-auth';
import {
  normalizeAudience,
  resolveAllowedTemplates,
  resolveMaxFilesPerFolder
} from '@/lib/services/upload-context';

function buildUploadUrl(token: string) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'http://localhost:3002';
  return `${base.replace(/\/$/, '')}/upload?token=${token}`;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; tokenId: string } }
) {
  try {
    const auth = await verifyAdminSession();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const paymentId = params.id;
    const tokenId = params.tokenId;

    if (!paymentId || !tokenId) {
      return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 });
    }

    const payload = await request.json().catch(() => ({}));
    const requestedStatus = typeof payload.status === 'string' ? payload.status : '';

    if (requestedStatus !== 'revoked') {
      return NextResponse.json({ error: '지원하지 않는 상태 변경입니다.' }, { status: 400 });
    }

    const supabase = getSupabaseAdminClient();

    const { data: existingToken, error: fetchError } = await supabase
      .from('upload_tokens')
      .select('*')
      .eq('id', tokenId)
      .eq('payment_id', paymentId)
      .maybeSingle();

    if (fetchError) {
      console.error('[admin/payments/upload-token/revoke] fetch error', fetchError);
      return NextResponse.json({ error: '업로드 링크 정보를 확인하지 못했습니다.' }, { status: 500 });
    }

    if (!existingToken) {
      return NextResponse.json({ error: '업로드 링크를 찾을 수 없습니다.' }, { status: 404 });
    }

    if (existingToken.status === 'revoked') {
      const audience = normalizeAudience(existingToken.audience);
      const allowedTemplates = resolveAllowedTemplates(existingToken.scope, audience);
      return NextResponse.json({
        token: {
          id: existingToken.id,
          token: existingToken.token,
          status: existingToken.status,
          expiresAt: existingToken.expires_at,
          createdAt: existingToken.created_at,
          sentTo: existingToken.sent_to,
          sentMethod: existingToken.sent_method,
          sentAt: existingToken.sent_at,
          driveFolderId: existingToken.drive_folder_id,
          uploadUrl: buildUploadUrl(existingToken.token),
          audience,
          allowedTemplates,
          maxFilesPerFolder: resolveMaxFilesPerFolder(existingToken.max_files_per_folder, audience)
        }
      });
    }

    const nowIso = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('upload_tokens')
      .update({ status: 'revoked', updated_at: nowIso })
      .eq('id', tokenId)
      .eq('payment_id', paymentId);

    if (updateError) {
      console.error('[admin/payments/upload-token/revoke] update error', updateError);
      return NextResponse.json({ error: '업로드 링크를 종료하지 못했습니다.' }, { status: 500 });
    }

    const updated = { ...existingToken, status: 'revoked', updated_at: nowIso };
    const audience = normalizeAudience(updated.audience);
    const allowedTemplates = resolveAllowedTemplates(updated.scope, audience);

    return NextResponse.json({
      token: {
        id: updated.id,
        token: updated.token,
        status: updated.status,
        expiresAt: updated.expires_at,
        createdAt: updated.created_at,
        sentTo: updated.sent_to,
        sentMethod: updated.sent_method,
        sentAt: updated.sent_at,
        driveFolderId: updated.drive_folder_id,
        uploadUrl: buildUploadUrl(updated.token),
        audience,
        allowedTemplates,
        maxFilesPerFolder: resolveMaxFilesPerFolder(updated.max_files_per_folder, audience)
      }
    });
  } catch (error) {
    console.error('[admin/payments/upload-token/revoke] unexpected error', error);
    return NextResponse.json({ error: '업로드 링크를 종료하지 못했습니다.' }, { status: 500 });
  }
}
