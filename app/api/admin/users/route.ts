import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: '인증되지 않았습니다.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const email = searchParams.get('email') || '';
    const dateFrom = searchParams.get('dateFrom') || '';
    const dateTo = searchParams.get('dateTo') || '';

    const offset = (page - 1) * limit;

    // Use service role key to access auth.users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get users from auth.users
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: limit
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: '회원 조회 실패' }, { status: 500 });
    }

    // Filter users by email if provided
    let filteredUsers = authData.users || [];

    if (email) {
      filteredUsers = filteredUsers.filter(user =>
        user.email?.toLowerCase().includes(email.toLowerCase())
      );
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filteredUsers = filteredUsers.filter(user =>
        new Date(user.created_at) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filteredUsers = filteredUsers.filter(user =>
        new Date(user.created_at) <= toDate
      );
    }

    // Get consultation counts for each user
    const userIds = filteredUsers.map(user => user.id);

    const { data: consultationCounts, error: countError } = await supabaseAdmin
      .from('consultations')
      .select('user_id')
      .in('user_id', userIds)
      .is('deleted_at', null);

    if (countError) {
      console.error('Consultation count error:', countError);
    }

    // Count consultations per user
    const consultationCountMap: Record<string, number> = {};
    consultationCounts?.forEach(consultation => {
      const userId = consultation.user_id;
      consultationCountMap[userId] = (consultationCountMap[userId] || 0) + 1;
    });

    // Format user data
    const users = filteredUsers.map(user => ({
      id: user.id,
      email: user.email || '',
      phone: user.phone || '',
      created_at: user.created_at,
      last_sign_in_at: user.last_sign_in_at,
      consultation_count: consultationCountMap[user.id] || 0,
      payment_count: 0 // TODO: Implement payment counting when payment feature is ready
    }));

    // Get total count
    const { count: totalCount, error: totalError } = await supabaseAdmin.auth.admin.listUsers();

    return NextResponse.json({
      users,
      total: totalCount?.users.length || users.length,
      page,
      limit
    });

  } catch (error) {
    console.error('Users API error:', error);
    return NextResponse.json({ error: '서버 오류' }, { status: 500 });
  }
}
