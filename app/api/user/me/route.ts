import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createExpiredSessionResponse, isUserSessionExpired } from '@/lib/auth/user-session';

export const dynamic = 'force-dynamic';

// 현재 로그인한 사용자 세션 정보 조회 (클라이언트에서 user id 확보용)
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies();

    if (isUserSessionExpired(cookieStore)) {
      return createExpiredSessionResponse();
    }

    const supabase = createRouteHandlerClient({ cookies });

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      user_id: session.user.id,
      email: session.user.email,
      user_metadata: session.user.user_metadata,
      full_user: session.user
    });

  } catch (error) {
    console.error('User info fetch error:', error);
    return NextResponse.json(
      { error: '사용자 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
