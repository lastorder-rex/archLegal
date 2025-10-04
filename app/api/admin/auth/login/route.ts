import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';

interface LoginRequest {
  username: string;
  password: string;
  twoFactorCode?: string;
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
      .select('id, username, password_hash, two_factor_enabled, two_factor_secret')
      .eq('username', body.username)
      .single();

    if (fetchError || !adminUser) {
      return NextResponse.json(
        { error: '아이디 또는 비밀번호가 올바르지 않습니다.' },
        { status: 401 }
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

    // Check 2FA (skip for rex master account, required for all others)
    if (adminUser.username !== 'rex') {
      // 2FA is mandatory for non-rex accounts
      if (!adminUser.two_factor_enabled || !adminUser.two_factor_secret) {
        return NextResponse.json(
          { error: '2단계 인증이 설정되지 않았습니다. 관리자에게 문의하세요.' },
          { status: 403 }
        );
      }

      // If 2FA code not provided, ask for it
      if (!body.twoFactorCode) {
        return NextResponse.json(
          {
            requires2FA: true,
            message: '2단계 인증 코드를 입력해주세요.'
          },
          { status: 200 }
        );
      }

      // Verify 2FA code
      const verified = speakeasy.totp.verify({
        secret: adminUser.two_factor_secret,
        encoding: 'base32',
        token: body.twoFactorCode,
        window: 2
      });

      if (!verified) {
        return NextResponse.json(
          { error: '인증이 실패되었습니다. 코드를 다시 확인해주세요.' },
          { status: 401 }
        );
      }
    }

    // Create session (store in cookie)
    const sessionData = {
      adminId: adminUser.id,
      username: adminUser.username
    };

    const response = NextResponse.json({
      success: true,
      admin: {
        id: adminUser.id,
        username: adminUser.username
      }
    });

    // Set secure HTTP-only cookie for admin session
    response.cookies.set('admin_session', JSON.stringify(sessionData), {
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
