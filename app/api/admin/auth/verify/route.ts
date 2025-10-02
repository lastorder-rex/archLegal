import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const adminCookie = cookieStore.get('admin_session');

    if (!adminCookie) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
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

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Verify admin user exists
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, username')
      .eq('id', adminId)
      .single();

    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: '인증되지 않았습니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        username: adminUser.username
      }
    });

  } catch (error) {
    console.error('Admin verify error:', error);
    return NextResponse.json(
      { error: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
