import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import type { UserProfile } from '@/types/profile';
import { isUserSessionExpired } from '@/lib/auth/user-session';
import { USER_PROFILE_COLUMNS } from '@/lib/auth/user-profile';

type RequireUserSessionOptions = {
  /**
   * getSession() 의 error 도 인증 실패로 간주할지 여부.
   * request/page, mypage/layout 는 authError/sessionError 를 검사하므로 true,
   * signup/page, request/history/layout 는 세션만 검사하므로 false(기본값).
   */
  checkAuthError?: boolean;
};

/**
 * 서버 컴포넌트/레이아웃 공통 사용자 세션 가드.
 *
 * 1) 사용자 세션 쿠키 만료 → `/login?redirect=${redirectTo}`
 * 2) Supabase getSession → 세션(옵션에 따라 error 포함) 없으면 동일 리다이렉트
 *
 * redirect() 는 next/navigation 의 것을 그대로 throw 하므로 반환 이후 session 은 항상 유효하다.
 */
export async function requireUserSession(
  redirectTo: string,
  options: RequireUserSessionOptions = {}
): Promise<{ supabase: SupabaseClient; session: Session }> {
  const cookieStore = cookies();

  if (isUserSessionExpired(cookieStore)) {
    redirect(`/login?redirect=${redirectTo}`);
  }

  const supabase = createServerComponentClient({ cookies });

  const {
    data: { session },
    error
  } = await supabase.auth.getSession();

  if ((options.checkAuthError && error) || !session?.user) {
    redirect(`/login?redirect=${redirectTo}`);
  }

  return { supabase, session };
}

type RequireCompletedProfileOptions = {
  /** 프로필 미완료 시 이동할 경로. `/signup?next=${encodeURIComponent(nextTo)}` 로 리다이렉트한다. */
  nextTo: string;
  /** users 테이블에서 select 할 컬럼(기본: 공통 프로필 컬럼). */
  columns?: string;
  /** 프로필 조회 error 를 console.error 로 남길지 여부(기본 false). */
  logError?: boolean;
};

/**
 * users 프로필을 조회하고 profile_completed 가 아니면 회원정보 등록으로 리다이렉트한다.
 * request/page, request/history/layout 의 공통 가드.
 */
export async function requireCompletedProfile(
  supabase: SupabaseClient,
  session: Session,
  options: RequireCompletedProfileOptions
): Promise<UserProfile> {
  const { nextTo, columns = USER_PROFILE_COLUMNS, logError = false } = options;

  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select(columns)
    .eq('auth_id', session.user.id)
    .maybeSingle<UserProfile>();

  if (profileError && logError) {
    console.error('Failed to load user profile', profileError);
  }

  if (!profile || !profile.profile_completed) {
    redirect(`/signup?next=${encodeURIComponent(nextTo)}`);
  }

  return profile;
}
