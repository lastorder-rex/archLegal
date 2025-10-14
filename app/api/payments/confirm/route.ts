import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

type ConfirmRequestBody = {
  paymentKey?: string;
  orderId?: string;
  amount?: number;
};

export async function POST(request: Request) {
  const { paymentKey, orderId, amount }: ConfirmRequestBody = await request.json().catch(() => ({}));

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

    const response = await fetch('https://api.tosspayments.com/v2/payments/confirm', {
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

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data?.message ?? '토스 결제 승인 요청이 실패했습니다.';
      return NextResponse.json(
        { error: errorMessage, code: data?.code ?? 'CONFIRM_FAILED', details: data },
        { status: response.status }
      );
    }

    // TODO: orders / payments / receipts 테이블 업데이트 로직을 추가하세요.
    return NextResponse.json({ success: true, payment: data });
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
