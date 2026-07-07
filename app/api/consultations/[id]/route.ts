import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { withSupabaseAuth } from '@/lib/auth/server-auth';
import { createSupabaseAdminClient } from '@/supabase/admin';

/**
 * 결제잠금 검사: 결제완료(paid_at 존재 && canceled_at 없음) 상담글은 수정/삭제 금지.
 * 잠금이면 403 응답을 반환하고, 조회 에러면 500, 잠금이 아니면 null을 반환한다.
 * RLS 우회를 위해 admin 클라이언트로 user_payment_stages를 확인한다.
 */
async function assertNotPaidLocked(
  consultationId: string
): Promise<NextResponse | null> {
  const admin = createSupabaseAdminClient();

  const { count, error } = await admin
    .from('user_payment_stages')
    .select('id', { count: 'exact', head: true })
    .eq('consultation_id', consultationId)
    .not('paid_at', 'is', null)
    .is('canceled_at', null);

  if (error) {
    console.error('Payment lock check error:', error);
    return NextResponse.json(
      { error: '결제 상태 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }

  if ((count ?? 0) > 0) {
    return NextResponse.json(
      {
        error:
          '결제가 완료된 상담은 수정/삭제할 수 없습니다. 결제 취소 후 다시 시도해주세요.'
      },
      { status: 403 }
    );
  }

  return null;
}

/**
 * 상담 메시지 입력 필터링 (서버 측) - SQL injection 및 XSS 방지
 */
function sanitizeMessage(value: string): string {
  return value.replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9\s.,!?()[\]:;%㎡·→~\-]/g, '');
}

interface UpdateConsultationRequest {
  name?: string;
  phone?: string;
  email?: string;
  message?: string;
  attachments?: {
    name: string;
    size: number;
    type: string;
    storagePath: string;
  }[];
}
// PATCH method to update consultation
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withSupabaseAuth(request, async ({ supabase, userId }) => {
      const consultationId = params.id;
      const body: UpdateConsultationRequest = await request.json();

      const paidLockResponse = await assertNotPaidLocked(consultationId);
      if (paidLockResponse) return paidLockResponse;

      if (body.message !== undefined) {
        if (!body.message || typeof body.message !== 'string' || body.message.trim().length === 0) {
          return NextResponse.json(
            { error: '상담 요청사항을 입력해주세요.' },
            { status: 400 }
          );
        }
        if (body.message.length > 1000) {
          return NextResponse.json(
            { error: '상담 내용은 1000글자 이하로 입력해주세요.' },
            { status: 400 }
          );
        }
      }

      const updateData: Record<string, unknown> = {};

      if (body.name !== undefined) updateData.name = body.name.trim();
      if (body.phone !== undefined) updateData.phone = body.phone;
      if (body.email !== undefined) updateData.email = body.email?.trim() || null;
      if (body.message !== undefined) {
        updateData.message = sanitizeMessage(body.message.trim());
      }
      if (body.attachments !== undefined) updateData.attachments = body.attachments;

      const { data: consultation, error: updateError } = await supabase
        .from('consultations')
        .update(updateData)
        .eq('id', consultationId)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (updateError) {
        console.error('Database update error:', updateError);
        return NextResponse.json(
          { error: '상담 요청 수정 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      if (!consultation) {
        return NextResponse.json(
          { error: '수정 권한이 없거나 존재하지 않는 상담 요청입니다.' },
          { status: 404 }
        );
      }

      revalidatePath('/mypage');
      revalidatePath('/mypage/consultations');
      revalidatePath('/mypage/payments');
      revalidatePath('/request/history');

      return NextResponse.json({
        success: true,
        message: '상담 요청이 수정되었습니다.',
        id: consultation.id
      });
    });
  } catch (error) {
    console.error('Consultation update error:', error);

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: '요청 데이터 형식이 올바르지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '상담 요청 수정 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// DELETE method to soft delete consultation
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    return await withSupabaseAuth(request, async ({ supabase, userId }) => {
      const consultationId = params.id;

      const paidLockResponse = await assertNotPaidLocked(consultationId);
      if (paidLockResponse) return paidLockResponse;

      const { data: consultation, error: deleteError } = await supabase
        .from('consultations')
        .update({
          is_del: 'Y',
          deleted_at: new Date().toISOString()
        })
        .eq('id', consultationId)
        .eq('user_id', userId)
        .select('id')
        .single();

      if (deleteError) {
        console.error('Database delete error:', deleteError);
        return NextResponse.json(
          { error: '상담 요청 삭제 중 오류가 발생했습니다.' },
          { status: 500 }
        );
      }

      if (!consultation) {
        return NextResponse.json(
          { error: '삭제 권한이 없거나 존재하지 않는 상담 요청입니다.' },
          { status: 404 }
        );
      }

      revalidatePath('/mypage');
      revalidatePath('/mypage/consultations');
      revalidatePath('/mypage/payments');
      revalidatePath('/request/history');

      return NextResponse.json({
        success: true,
        message: '상담 요청이 삭제되었습니다.',
        id: consultation.id
      });
    });
  } catch (error) {
    console.error('Consultation delete error:', error);
    return NextResponse.json(
      { error: '상담 요청 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
