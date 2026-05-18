import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type TossWebhookBody = {
  eventType?: string;
  status?: string;
  data?: {
    paymentKey?: string;
    orderId?: string;
    status?: string;
    totalAmount?: number;
    balanceAmount?: number;
    cancels?: Array<{
      cancelAmount?: number;
      canceledAt?: string;
      cancelReason?: string;
    }>;
  };
};

function safeCompare(value: string, expected: string) {
  const valueBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);

  if (valueBuffer.length !== expectedBuffer.length) {
    return false;
  }

  return timingSafeEqual(valueBuffer, expectedBuffer);
}

function isAuthorizedWebhook(request: Request, webhookSecret: string) {
  const url = new URL(request.url);
  const querySecret = url.searchParams.get('secret');
  const headerSecret = request.headers.get('x-webhook-secret');
  const authHeader = request.headers.get('authorization');
  const expectedBasicAuth = `Basic ${Buffer.from(`${webhookSecret}:`).toString('base64')}`;

  return (
    (querySecret !== null && safeCompare(querySecret, webhookSecret)) ||
    (headerSecret !== null && safeCompare(headerSecret, webhookSecret)) ||
    (authHeader !== null && safeCompare(authHeader, expectedBasicAuth))
  );
}

async function fetchPaymentDetail(paymentKey: string, secretKey: string) {
  const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
  const response = await fetch(`https://api.tosspayments.com/v1/payments/${paymentKey}`, {
    method: 'GET',
    headers: {
      Authorization: authHeader
    }
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('[payments/webhook] fetch payment detail failed', response.status, text);
    throw new Error(`payment detail fetch failed: ${response.status}`);
  }

  return response.json();
}

function isCancelEvent(body: TossWebhookBody) {
  const eventType = (body.eventType ?? '').toUpperCase();
  const status = (body.data?.status ?? body.status ?? '').toUpperCase();

  // Toss 문서 기준:
  // - eventType=PAYMENT_CANCELED 또는 eventType=PAYMENT_PARTIAL_CANCELED
  // - 또는 PAYMENT_STATUS_CHANGED + status가 명시적으로 CANCELED/PARTIAL_CANCELED인 경우만
  const isCanceledStatus = status === 'CANCELED' || status === 'PARTIAL_CANCELED';

  return (
    eventType === 'PAYMENT_CANCELED' ||
    eventType === 'PAYMENT_PARTIAL_CANCELED' ||
    (eventType === 'PAYMENT_STATUS_CHANGED' && isCanceledStatus)
  );
}

export async function POST(request: Request) {
  const webhookSecret = process.env.TOSS_WEBHOOK_SECRET;
  const tossSecretKey = process.env.TOSS_SECRET_KEY;

  if (!webhookSecret) {
    console.error('[payments/webhook] missing webhook secret');
    return NextResponse.json({ error: 'webhook secret not configured' }, { status: 500 });
  }

  if (!tossSecretKey) {
    console.error('[payments/webhook] missing Toss secret key');
    return NextResponse.json({ error: 'Toss secret key not configured' }, { status: 500 });
  }

  if (!isAuthorizedWebhook(request, webhookSecret)) {
    console.warn('[payments/webhook] unauthorized request');
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const rawBody = await request.text();

  let body: TossWebhookBody;
  try {
    body = JSON.parse(rawBody);
  } catch (error) {
    console.error('[payments/webhook] invalid json');
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  const paymentKey =
    body.data?.paymentKey ??
    // fallback: 일부 이벤트는 상위 필드로 전달될 수 있음
    (body as any)?.paymentKey;

  console.log('[payments/webhook] received event', {
    eventType: body.eventType ?? null,
    status: body.data?.status ?? body.status ?? null,
    paymentKey: paymentKey?.slice(0, 12) ?? null
  });

  if (!isCancelEvent(body)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!paymentKey) {
    console.error('[payments/webhook] missing paymentKey', body);
    return NextResponse.json({ ok: true, ignored: true });
  }

  const supabase = getSupabaseAdminClient();

  const { data: stage, error: fetchError } = await supabase
    .from('user_payment_stages')
    .select('id, status, payment_key, paid_amount, paid_at, consultation_id, stage_template_id')
    .eq('payment_key', paymentKey)
    .maybeSingle();

  if (fetchError) {
    console.error('[payments/webhook] stage fetch error', fetchError);
    return NextResponse.json({ error: 'failed to load stage' }, { status: 500 });
  }

  console.log('[payments/webhook] stage lookup by paymentKey', {
    paymentKey: paymentKey.slice(0, 12),
    found: !!stage
  });

  let targetStage = stage;

  // 추가 매핑: paymentKey로 못 찾으면 payment detail의 metadata로 탐색
  if (!targetStage) {
    try {
      const paymentDetail = await fetchPaymentDetail(paymentKey, tossSecretKey);
      const metadata = (paymentDetail?.metadata ?? {}) as Record<string, unknown>;
      const consultationId =
        typeof metadata.consultationId === 'string' ? metadata.consultationId : null;
      const stageTemplateId =
        typeof metadata.stageTemplateId === 'string' ? metadata.stageTemplateId : null;

      if (consultationId && stageTemplateId) {
        const { data: fallbackStage, error: fallbackError } = await supabase
          .from('user_payment_stages')
          .select('id, status, payment_key, paid_amount, paid_at, consultation_id, stage_template_id')
          .eq('consultation_id', consultationId)
          .eq('stage_template_id', stageTemplateId)
          .maybeSingle();

        if (fallbackError) {
          console.error('[payments/webhook] fallback stage fetch error', fallbackError);
          return NextResponse.json({ error: 'failed to load stage' }, { status: 500 });
        }

        console.log('[payments/webhook] fallback lookup by metadata', {
          consultationId,
          stageTemplateId,
          found: !!fallbackStage
        });

        targetStage = fallbackStage ?? null;
      }
    } catch (detailError) {
      console.error('[payments/webhook] payment detail lookup failed', detailError);
    }
  }

  if (!targetStage) {
    console.warn('[payments/webhook] no stage found for paymentKey', paymentKey);
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (targetStage.status !== 'paid') {
    // 이미 취소/대기 상태라면 멱등 처리
    console.log('[payments/webhook] stage already not-paid', {
      stageId: targetStage.id,
      status: targetStage.status
    });
    return NextResponse.json({ ok: true, stageId: targetStage.id, skipped: true });
  }

  const statusUpper = (body.data?.status ?? body.status ?? '').toUpperCase();
  const isPartialCancel = statusUpper === 'PARTIAL_CANCELED';
  const isFullCancel = statusUpper === 'CANCELED' || !isPartialCancel;

  const cancelInfo = (body.data?.cancels && body.data.cancels[0]) || null;
  const canceledAt =
    cancelInfo?.canceledAt ??
    (body.data?.status === 'CANCELED' ? new Date().toISOString() : null) ??
    new Date().toISOString();
  const cancelReason = cancelInfo?.cancelReason ?? null;
  const canceledAmount = typeof cancelInfo?.cancelAmount === 'number' ? cancelInfo.cancelAmount : null;
  const balanceAmount =
    typeof body.data?.balanceAmount === 'number' ? body.data.balanceAmount : null;

  const nowIso = new Date().toISOString();

  const updatePayload: Record<string, unknown> = {
    updated_at: nowIso
  };

  if (isFullCancel || balanceAmount === 0) {
    // 전액 취소 시 'canceled' 상태로 변경하여 재결제 차단
    updatePayload.status = 'canceled';
    updatePayload.paid_amount = null;
    updatePayload.paid_at = null;
    updatePayload.payment_key = null;
    updatePayload.canceled_at = canceledAt;
  } else if (isPartialCancel && balanceAmount !== null) {
    // 부분 취소 시 남은 결제 금액을 반영
    updatePayload.status = 'paid';
    updatePayload.paid_amount = balanceAmount;
    // payment_key는 유지하여 추후 취소 이벤트 매칭 가능
  }

  console.log('[payments/webhook] updating stage', {
    stageId: targetStage.id,
    isPartialCancel,
    isFullCancel,
    canceledAmount,
    balanceAmount
  });

  const { error: updateError } = await supabase
    .from('user_payment_stages')
    .update(updatePayload)
    .eq('id', targetStage.id);

  if (updateError) {
    console.error('[payments/webhook] stage update error', updateError);
    return NextResponse.json({ error: 'failed to update stage' }, { status: 500 });
  }

  try {
    await supabase.from('payment_notifications').insert({
      user_payment_stage_id: targetStage.id,
      notification_type: 'payment_canceled',
      payload: {
        paymentKey,
        cancelReason,
        canceledAmount,
        canceledAt,
        isPartialCancel,
        balanceAmount,
        recordedAt: nowIso
      }
    });
  } catch (notificationError) {
    console.error('[payments/webhook] notification insert error', notificationError);
  }

  const nextStatus = (updatePayload.status as string | undefined) ?? targetStage.status;

  console.log('[payments/webhook] stage updated', {
    stageId: targetStage.id,
    nextStatus,
    paymentKey: paymentKey.slice(0, 12)
  });

  return NextResponse.json({
    ok: true,
    stageId: targetStage.id,
    status: nextStatus
  });
}
