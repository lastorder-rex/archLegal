import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyAdminSession } from '@/lib/admin/auth';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const authResult = await verifyAdminSession();
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const name = searchParams.get('name') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const offset = (page - 1) * limit;

    // Use service role key to access public.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Build query for public.users
    let query = supabaseAdmin
      .from('users')
      .select('auth_id, legal_name, full_name, email, contact_phone, phone, birth_date, created_at, updated_at', { count: 'exact' });

    // Apply filters
    if (name) {
      query = query.or(`legal_name.ilike.%${name}%,full_name.ilike.%${name}%`);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      query = query.lte('created_at', toDate.toISOString());
    }

    // Get paginated users
    const { data: usersData, error: usersError, count: totalCount } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (usersError) {
      console.error('Users query error:', usersError);
      return NextResponse.json({ error: '회원 조회 실패' }, { status: 500 });
    }

    const publicUsers = usersData || [];

    // Get auth.users data for last_sign_in_at
    const authIds = publicUsers.map(u => u.auth_id);
    const authUsersMap: Record<string, { last_sign_in_at: string | null }> = {};

    if (authIds.length > 0) {
      // Get auth users info (batch)
      for (const authId of authIds) {
        try {
          const { data } = await supabaseAdmin.auth.admin.getUserById(authId);
          if (data?.user) {
            authUsersMap[authId] = {
              last_sign_in_at: data.user.last_sign_in_at || null
            };
          }
        } catch (err) {
          console.error(`Failed to get auth user ${authId}:`, err);
        }
      }
    }

    // Get consultation counts for each user
    const { data: consultationCounts, error: countError } = await supabaseAdmin
      .from('consultations')
      .select('user_id')
      .in('user_id', authIds)
      .eq('is_del', 'N'); // 상담 soft-delete 판정은 코드베이스 표준인 is_del 사용 (타 12곳과 통일)

    if (countError) {
      console.error('Consultation count error:', countError);
    }

    // Count consultations per user
    const consultationCountMap: Record<string, number> = {};
    consultationCounts?.forEach(consultation => {
      const userId = consultation.user_id;
      consultationCountMap[userId] = (consultationCountMap[userId] || 0) + 1;
    });

    // Get payment counts for each user (paid only)
    const { data: paymentCounts, error: paymentCountError } = await supabaseAdmin
      .from('user_payment_stages')
      .select('user_id')
      .in('user_id', authIds)
      .not('paid_at', 'is', null);

    if (paymentCountError) {
      console.error('Payment count error:', paymentCountError);
    }

    // Count payments per user
    const paymentCountMap: Record<string, number> = {};
    paymentCounts?.forEach(payment => {
      const userId = payment.user_id;
      paymentCountMap[userId] = (paymentCountMap[userId] || 0) + 1;
    });

    // Format user data
    const users = publicUsers.map(user => ({
      id: user.auth_id,
      legal_name: user.legal_name || user.full_name || '',
      email: user.email || '',
      phone: user.contact_phone || user.phone || '',
      birth_date: user.birth_date || null,
      created_at: user.created_at,
      last_sign_in_at: authUsersMap[user.auth_id]?.last_sign_in_at || null,
      consultation_count: consultationCountMap[user.auth_id] || 0,
      payment_count: paymentCountMap[user.auth_id] || 0
    }));

    return NextResponse.json({
      users,
      total: totalCount,
      page,
      limit
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
