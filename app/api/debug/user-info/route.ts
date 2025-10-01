import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 개발용: 현재 로그인한 사용자 정보 확인
export async function GET(request: NextRequest) {
  try {
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