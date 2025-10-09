'use client';

import type { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { Button } from '../ui/button';
import type { UserProfile } from '../../types/profile';
import { getUserDisplayName } from '@/lib/auth/user-utils';
import { handleUserLogout } from '@/lib/auth/logout';

type Props = {
  sessionUser: User | null;
  profile: UserProfile | null;
};

export default function AuthPanel({ sessionUser, profile }: Props) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  const desiredNextParam = searchParams.get('redirect');
  const handleSignIn = useCallback(async () => {
    setLoading(true);
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    const desiredNext = desiredNextParam && desiredNextParam.startsWith('/') ? desiredNextParam : '/';
    const encodedNext = encodeURIComponent(desiredNext);

    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${cleanOrigin}/auth/callback?next=${encodedNext}`,
        queryParams: {
          scope: 'account_email'
        }
      }
    });
  }, [desiredNextParam, supabase]);

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

    const signupTarget =
      desiredNextParam && desiredNextParam.startsWith('/')
        ? `/signup?next=${encodeURIComponent(desiredNextParam)}`
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
      <header className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">카카오로 로그인</h1>
        <p className="text-sm text-muted-foreground">로그인과 회원가입이 한 번에 진행됩니다.</p>
      </header>
      <Button onClick={handleSignIn} disabled={loading}>
        {loading ? '카카오 로그인 준비중...' : '카카오 계정으로 시작하기'}
      </Button>
      <ul className="space-y-2 text-xs text-muted-foreground">
        <li>• 최초 로그인 시 회원정보가 자동으로 저장됩니다.</li>
        <li>• 로그인 후 로그아웃을 통해 세션을 종료할 수 있습니다.</li>
      </ul>
    </div>
  );
}
