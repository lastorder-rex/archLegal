import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Check admin authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    const { userId } = await params;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');

    const offset = (page - 1) * limit;

    const supabase = getSupabaseAdminClient();

    // Get payments for this user with stage template and consultation info
    const { data: payments, error: paymentsError, count } = await supabase
      .from('user_payment_stages')
      .select(`
        id,
        user_id,
        consultation_id,
        stage_template_id,
        status,
        request_amount,
        requested_at,
        requested_by,
        paid_amount,
        paid_at,
        payment_key,
        created_at,
        updated_at,
        stage_template:payment_stage_templates(
          id,
          code,
          title,
          description,
          stage_order
        ),
        consultation:consultations(
          id,
          name,
          phone,
          address,
          address_detail
        )
      `, { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (paymentsError) {
      console.error('Payments error:', paymentsError);
      return NextResponse.json({ error: '결제 내역 조회 실패' }, { status: 500 });
    }

    return NextResponse.json({
      payments: payments || [],
      total: count || 0,
      page,
      limit
    });

  } catch (error) {
    console.error('User payments API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
