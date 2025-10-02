import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Verify admin authentication
async function verifyAdmin(supabase: any, adminSessionId: string | undefined) {
  if (!adminSessionId) {
    return null;
  }

  const { data: adminUser, error } = await supabase
    .from('admin_users')
    .select('id, username, is_active')
    .eq('id', adminSessionId)
    .single();

  if (error || !adminUser || !adminUser.is_active) {
    return null;
  }

  return adminUser;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const consultationId = params.id;
    const cookieStore = cookies();
    const adminSessionId = cookieStore.get('admin_session')?.value;

    const supabase = createRouteHandlerClient({ cookies });

    // Verify admin authentication
    const admin = await verifyAdmin(supabase, adminSessionId);
    if (!admin) {
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
