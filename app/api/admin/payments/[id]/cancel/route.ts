import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('admin_session');

    if (!adminCookie) {
      return NextResponse.json(
        { error: '관리자 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    let adminId;
    try {
      const sessionData = JSON.parse(adminCookie.value);
      adminId = sessionData.adminId;
    } catch (e) {
      adminId = adminCookie.value;
    }

    const supabase = getSupabaseAdminClient();

    // Verify admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('id', adminId)
      .single();

    if (adminError || !adminUser) {
      return NextResponse.json(
        { error: '관리자 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const paymentId = params.id;

    // Get payment stage info
    const { data: paymentStage, error: fetchError } = await supabase
      .from('user_payment_stages')
      .select('id, status, payment_key, paid_amount')
      .eq('id', paymentId)
      .single();

    if (fetchError || !paymentStage) {
      return NextResponse.json(
        { error: '결제 정보를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (paymentStage.status !== 'paid') {
      return NextResponse.json(
        { error: '결제 완료 상태만 취소할 수 있습니다.' },
        { status: 400 }
      );
    }

    if (!paymentStage.payment_key) {
      return NextResponse.json(
        { error: 'paymentKey가 없어 취소할 수 없습니다.' },
        { status: 400 }
      );
    }

    const { cancelReason } = await request.json();

    if (!cancelReason || typeof cancelReason !== 'string') {
      return NextResponse.json(
        { error: '취소 사유를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Call Toss Payments Cancel API
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: 'Toss Payments 설정이 올바르지 않습니다.' },
        { status: 500 }
      );
    }

    const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;

    const tossResponse = await fetch(
      `https://api.tosspayments.com/v1/payments/${paymentStage.payment_key}/cancel`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cancelReason
        })
      }
    );

    if (!tossResponse.ok) {
      const errorData = await tossResponse.json().catch(() => ({}));
      console.error('[admin/payments/cancel] Toss API error:', errorData);
      return NextResponse.json(
        { error: errorData.message || '결제 취소 요청이 실패했습니다.' },
        { status: tossResponse.status }
      );
    }

    const tossData = await tossResponse.json();

    // Update payment stage status to canceled
    const { error: updateError } = await supabase
      .from('user_payment_stages')
      .update({
        status: 'canceled',
        paid_amount: null,
        paid_at: null,
        payment_key: null,
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', paymentId);

    if (updateError) {
      console.error('[admin/payments/cancel] DB update error:', updateError);
      return NextResponse.json(
        { error: 'DB 업데이트 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    console.log('[admin/payments/cancel] Payment canceled successfully', {
      paymentId,
      paymentKey: paymentStage.payment_key,
      adminUsername: adminUser.username
    });

    return NextResponse.json({
      success: true,
      message: '결제가 취소되었습니다.',
      tossData
    });

  } catch (error) {
    console.error('[admin/payments/cancel] Unexpected error:', error);
    return NextResponse.json(
      { error: '결제 취소 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
