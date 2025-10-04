import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
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

    // Get consultation by ID
    const { data: consultation, error: fetchError } = await supabase
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
      `)
      .eq('id', consultationId)
      .eq('is_del', 'N')
      .single();

    if (fetchError) {
      console.error('Database fetch error:', fetchError);
      return NextResponse.json(
        { error: '상담 내역을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      consultation
    });

  } catch (error) {
    console.error('Admin consultation fetch error:', error);
    return NextResponse.json(
      { error: '상담 내역 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
