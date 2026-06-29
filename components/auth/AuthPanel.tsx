'use client';

import type { User } from '@supabase/auth-helpers-nextjs';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import type { UserProfile } from '../../types/profile';
import { getUserDisplayName } from '@/lib/auth/user-utils';
import { handleUserLogout } from '@/lib/auth/logout';
import { Input } from '@/components/ui/input';
import { sanitizeRedirectPath } from '@/lib/utils/navigation';
import { usePasswordLogin } from '@/components/auth/hooks/usePasswordLogin';
import { getKakaoOAuthOptions } from '@/lib/auth/oauth';
import { getAuthErrorMessage } from '@/lib/auth/errors';

type Props = {
  sessionUser: User | null;
  profile: UserProfile | null;
  authError?: string | null;
};

export default function AuthPanel({ sessionUser, profile, authError }: Props) {
  const supabase = useSupabaseClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const enableTestLogin = useMemo(
    () => (process.env.NEXT_PUBLIC_ENABLE_TEST_LOGIN || '').toString() === 'true',
    []
  );
  const redirectParam = searchParams.get('redirect');
  const authErrorMessage = getAuthErrorMessage(
    authError ?? searchParams.get('auth_error') ?? searchParams.get('error')
  );
  const redirectPath = useMemo(
    () => sanitizeRedirectPath(redirectParam, '/mypage'),
    [redirectParam]
  );
  const {
    email,
    password,
    loading: pwdLoading,
    error: pwdError,
    setEmail,
    setPassword,
    signIn: handlePasswordSignIn,
    canSubmit,
  } = usePasswordLogin({ redirectPath });
  const handleSignIn = useCallback(async () => {
    setLoading(true);

    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: getKakaoOAuthOptions(redirectPath)
    });
  }, [redirectPath, supabase]);

  const handleSignOut = useCallback(async () => {
    setLoading(true);
    await handleUserLogout(router);
    setLoading(false);
  }, [router]);

  const handleGoToMyPage = useCallback(() => {
    router.push('/mypage');
  }, [router]);

  if (sessionUser) {
    const displayName = getUserDisplayName(sessionUser, profile);
    const profileCompleted = profile?.profile_completed ?? false;

    const signupTarget = redirectParam
      ? `/signup?next=${encodeURIComponent(redirectPath)}`
      : '/signup';

    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-2xl font-semibold">환영합니다. {displayName}님</p>
          {profile?.email || sessionUser.email ? (
            <p className="text-sm text-muted-foreground">{profile?.email ?? sessionUser.email}</p>
          ) : null}
          {profile?.contact_phone || profile?.phone ? (
            <p className="text-sm text-muted-foreground">
              연락처: {profile?.contact_phone ?? profile?.phone}
            </p>
          ) : null}
          {!profileCompleted ? (
            <p className="text-sm text-amber-600">
              상담 신청을 위해 회원정보를 먼저 완료해주세요.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-3">
          {!profileCompleted ? (
            <Button
              onClick={() => router.push(signupTarget)}
              disabled={loading}
              className="w-full"
            >
              회원정보 입력하러 가기
            </Button>
          ) : null}
          <Button onClick={handleGoToMyPage} disabled={loading}>
            마이페이지로 이동
          </Button>
          <Button onClick={handleSignOut} disabled={loading} variant="outline">
            카카오 로그아웃
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 text-center">
        <h1 className="text-2xl font-bold tracking-tight">로그인 / 회원가입</h1>
        <p className="text-sm text-muted-foreground">카카오로 3초 만에 — 로그인과 회원가입이 한 번에 진행됩니다.</p>
      </header>
      <Button
        onClick={handleSignIn}
        disabled={loading}
        className="h-12 w-full gap-2.5 bg-[#FEE500] text-[15px] font-bold text-[#181600] shadow-sm hover:bg-[#f4dc00]"
      >
        <span className="grid h-5 w-7 flex-none place-items-center rounded-md bg-[#181600] text-[9px] font-black tracking-tight text-[#FEE500]">
          TALK
        </span>
        {loading ? '카카오 로그인 준비중...' : '카카오로 시작하기'}
      </Button>
      {authErrorMessage ? (
        <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {authErrorMessage}
        </p>
      ) : null}
      <ul className="space-y-2 text-xs text-muted-foreground">
        <li>• 최초 로그인 시 회원정보가 자동으로 저장됩니다.</li>
        <li>• 로그인 후 로그아웃을 통해 세션을 종료할 수 있습니다.</li>
      </ul>

      {enableTestLogin ? (
        <div className="mt-6 space-y-3 border-t border-border pt-6">
          <h2 className="text-center text-sm font-semibold text-foreground">테스트 전용 로그인</h2>
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
            <Input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          {pwdError ? <p className="text-xs text-destructive">{pwdError}</p> : null}
          <Button onClick={handlePasswordSignIn} disabled={!canSubmit} variant="outline">
            {pwdLoading ? '로그인 중...' : '이메일/비밀번호로 로그인'}
          </Button>
          <p className="text-center text-[11px] text-muted-foreground">스테이징/심사용 전용. 운영에서는 노출되지 않습니다.</p>
        </div>
      ) : null}
    </div>
  );
}
