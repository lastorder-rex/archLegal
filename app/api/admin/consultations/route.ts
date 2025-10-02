import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('admin_session');

    if (!adminCookie) {
      return NextResponse.json(
        { error: '관리자 인증이 필요합니다.' },
        { status: 401 }
      );
    }

    // Parse admin session
    let adminId;
    try {
      const sessionData = JSON.parse(adminCookie.value);
      adminId = sessionData.adminId;
    } catch (e) {
      // Fallback for old format (just ID string)
      adminId = adminCookie.value;
    }

    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '15');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const address = searchParams.get('address');

    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('consultations')
      .select(`
        id,
        user_id,
        nickname,
        name,
        phone,
        email,
        address,
        address_detail,
        address_code,
        building_info,
        main_purps,
        tot_area,
        plat_area,
        ground_floor_cnt,
        message,
        attachments,
        is_del,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('is_del', 'N');

    // Apply filters
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00`);
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59`);
    }
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    if (phone) {
      query = query.ilike('phone', `%${phone}%`);
    }
    if (address) {
      query = query.ilike('address', `%${address}%`);
    }

    // Apply pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: consultations, error: fetchError, count } = await query;

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: '상담 내역 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      consultations: consultations || [],
      total: count || 0,
      page,
      limit
    });

  } catch (error) {
    console.error('Admin consultations fetch error:', error);
    return NextResponse.json(
      { error: '상담 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
