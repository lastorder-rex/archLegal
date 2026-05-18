import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export const runtime = 'nodejs';

type ConfirmRequestBody = {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
};

export async function POST(request: Request) {
  const { paymentKey, orderId, amount }: ConfirmRequestBody = await request.json().catch(() => ({}));

  const supabase = createRouteHandlerClient({ cookies });
  const {
    data: { session },
    error: sessionError
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return NextResponse.json(
      { error: '세션이 만료되었습니다. 다시 로그인해주세요.' },
      { status: 401 }
    );
  }

  if (!paymentKey || !orderId || typeof amount !== 'number') {
    return NextResponse.json(
      { error: 'paymentKey, orderId, amount는 필수입니다.' },
      { status: 400 }
    );
  }

  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    return NextResponse.json(
      { error: 'TOSS_SECRET_KEY 환경 변수가 설정되지 않았습니다.' },
      { status: 500 }
    );
  }

  try {
    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    console.log('[payments/confirm] 토스페이먼츠 API 호출 시작', {
      orderId,
      amount,
      paymentKeyPrefix: paymentKey.substring(0, 10) + '...'
    });

    const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount
      })
    });

    console.log('[payments/confirm] 토스페이먼츠 응답 상태:', response.status);

    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[payments/confirm] JSON 파싱 실패:', parseError);
      data = {};
    }

    if (!response.ok) {
      const errorMessage = data?.message ?? '토스 결제 승인 요청이 실패했습니다.';
      console.error('[payments/confirm] 토스페이먼츠 에러:', {
        status: response.status,
        code: data?.code,
        message: errorMessage
      });
      return NextResponse.json(
        { error: errorMessage, code: data?.code ?? 'CONFIRM_FAILED', details: data },
        { status: response.status }
      );
    }

    console.log('[payments/confirm] 결제 승인 성공:', {
      orderId,
      amount,
      paymentKeyPrefix: typeof data?.paymentKey === 'string' ? `${data.paymentKey.substring(0, 10)}...` : null
    });

    const metadata = (data?.metadata ?? {}) as Record<string, unknown>;
    const stageTemplateId =
      typeof metadata?.stageTemplateId === 'string' ? metadata.stageTemplateId : null;
    const consultationId =
      typeof metadata?.consultationId === 'string' ? metadata.consultationId : null;

    if (!stageTemplateId || !consultationId) {
      console.error('[payments/confirm] 결제 단계 메타데이터 누락', metadata);
      return NextResponse.json(
        { error: '결제 단계 정보가 유실되었습니다. 고객센터로 문의해주세요.' },
        { status: 500 }
      );
    }

    const supabaseAdmin = getSupabaseAdminClient();

    const {
      data: stageRow,
      error: stageError
    } = await supabaseAdmin
      .from('user_payment_stages')
      .select('id, user_id, status, request_amount, paid_amount, paid_at, payment_key')
      .eq('consultation_id', consultationId)
      .eq('stage_template_id', stageTemplateId)
      .maybeSingle();

    if (stageError) {
      console.error('[payments/confirm] stage fetch error', stageError);
      return NextResponse.json(
        { error: '결제 단계 정보를 불러오는 중 문제가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!stageRow) {
      return NextResponse.json(
        { error: '결제 단계 정보를 찾을 수 없습니다. 관리자에게 문의해주세요.' },
        { status: 404 }
      );
    }

    if (stageRow.user_id !== session.user.id) {
      return NextResponse.json(
        { error: '본인 결제 건만 확인할 수 있습니다.' },
        { status: 403 }
      );
    }

    const expectedAmount =
      stageRow.request_amount !== null ? Number(stageRow.request_amount) : null;
    const confirmedAmount =
      typeof data?.totalAmount === 'number' ? data.totalAmount : amount;

    if (expectedAmount !== null && expectedAmount !== confirmedAmount) {
      return NextResponse.json(
        {
          error: '요청한 금액과 승인된 금액이 일치하지 않습니다.',
          expectedAmount,
          confirmedAmount
        },
        { status: 400 }
      );
    }

    if (stageRow.status === 'paid') {
      if (stageRow.payment_key === paymentKey) {
        return NextResponse.json({ success: true, payment: data, stageId: stageRow.id });
      }
      return NextResponse.json(
        { error: '이미 결제가 완료된 단계입니다. 다른 결제 건은 담당자에게 문의해주세요.' },
        { status: 400 }
      );
    }

    const paidAt =
      typeof data?.approvedAt === 'string' && data.approvedAt.length > 0
        ? data.approvedAt
        : new Date().toISOString();
    const nowIso = new Date().toISOString();

    const { error: updateError } = await supabaseAdmin
      .from('user_payment_stages')
      .update({
        status: 'paid',
        paid_amount: confirmedAmount,
        paid_at: paidAt,
        payment_key: paymentKey,
        updated_at: nowIso
      })
      .eq('id', stageRow.id);

    if (updateError) {
      console.error('[payments/confirm] stage update error', updateError);
      return NextResponse.json(
        { error: '결제 상태를 반영하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    try {
      await supabaseAdmin.from('payment_notifications').insert({
        user_payment_stage_id: stageRow.id,
        notification_type: 'payment_confirmed',
        payload: {
          paymentKey,
          orderId,
          confirmedAmount,
          paidAt,
          confirmedAt: nowIso
        }
      });
    } catch (notificationError) {
      console.error('[payments/confirm] notification insert error', notificationError);
    }

    return NextResponse.json({ success: true, payment: data, stageId: stageRow.id });
  } catch (error) {
    console.error('[payments/confirm] unexpected error', error);
    return NextResponse.json(
      {
        error: '결제 승인 처리 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'unknown_error'
      },
      { status: 500 }
    );
  }
}
