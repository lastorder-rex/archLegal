'use client';

import type { User } from '@supabase/auth-helpers-nextjs';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import type { UserProfile } from '../../types/profile';

function resolveDisplayName(sessionUser: User | null, profile: UserProfile | null) {
  if (profile?.full_name) return profile.full_name;
  if (sessionUser?.user_metadata?.name) return sessionUser.user_metadata.name as string;
  if (sessionUser?.user_metadata?.full_name) return sessionUser.user_metadata.full_name as string;
  return sessionUser?.email ?? '사용자';
}

type Props = {
  sessionUser: User | null;
  profile: UserProfile | null;
};

export default function AuthPanel({ sessionUser, profile }: Props) {
  const supabase = useMemo(() => createClientComponentClient(), []);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    setLoading(true);
    const origin =
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: `${cleanOrigin}/auth/callback`,
        queryParams: {
          scope: 'account_email'
        }
      }
    });
  }, [supabase]);

  const handleSignOut = useCallback(async () => {
    setLoading(true);

    try {
      await supabase.auth.signOut();
    } finally {
      setLoading(false);
      router.refresh();
      router.replace('/');
    }
  }, [router, supabase]);

  if (sessionUser) {
    const displayName = resolveDisplayName(sessionUser, profile);

    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-2xl font-semibold">환영합니다. {displayName}님</p>
          {profile?.email || sessionUser.email ? (
            <p className="text-sm text-muted-foreground">{profile?.email ?? sessionUser.email}</p>
          ) : null}
          {profile?.phone ? <p className="text-sm text-muted-foreground">연락처: {profile.phone}</p> : null}
        </div>
        <Button onClick={handleSignOut} disabled={loading} variant="outline">
          카카오 로그아웃
        </Button>
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
