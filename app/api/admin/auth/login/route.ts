import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';

interface LoginRequest {
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json();

    if (!body.username || !body.password) {
      return NextResponse.json(
        { error: '아이디와 비밀번호를 입력해주세요.' },
        { status: 400 }
      );
    }

    // Initialize Supabase client
    const supabase = createRouteHandlerClient({ cookies });

    // Get admin user from database
    const { data: adminUser, error: fetchError } = await supabase
      .from('admin_users')
      .select('id, username, password_hash, is_active')
      .eq('username', body.username)
      .single();

    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    if (!adminUser.is_active) {
      return NextResponse.json(
        { error: '비활성화된 계정입니다.' },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, adminUser.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
      );
    }

    // Update last login time
    await supabase
      .from('admin_users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', adminUser.id);

    // Create session (store in cookie)
    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        username: adminUser.username
      }
    });

    // Set secure HTTP-only cookie for admin session
    response.cookies.set('admin_session', adminUser.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/'
    });

    return response;

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
