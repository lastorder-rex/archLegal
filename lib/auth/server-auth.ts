import { cookies } from 'next/headers';
import { NextResponse, type NextRequest } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createExpiredSessionResponse, isUserSessionExpired } from '@/lib/auth/user-session';

interface AuthContext {
  supabase: SupabaseClient;
  request: NextRequest;
  responseHeaders?: HeadersInit;
}

type AuthenticatedHandler<T = unknown> = (args: AuthContext & { userId: string }) => Promise<T>;

export async function withSupabaseAuth<T>(
  request: NextRequest,
  handler: AuthenticatedHandler<T>
): Promise<T | NextResponse> {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    return createExpiredSessionResponse();
  }

  const supabase = createRouteHandlerClient({ cookies });

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session?.user) {
    return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
  }

  return handler({ supabase, request, userId: session.user.id });
}

