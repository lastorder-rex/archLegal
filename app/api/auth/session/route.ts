import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { setUserSessionCookie, isUserSessionExpired } from '@/lib/auth/user-session';

export async function POST() {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  if (!isUserSessionExpired(cookieStore)) {
    return NextResponse.json({ success: true, message: '세션이 이미 활성화되어 있습니다.' });
  }

  const response = NextResponse.json({ success: true });
  setUserSessionCookie(response);
  return response;
}
