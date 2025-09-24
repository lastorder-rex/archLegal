'use client';

import { useCallback, useState } from 'react';
import type { Session } from 'next-auth';
import { signIn, signOut } from 'next-auth/react';
import type { UserProfile } from '@/types/profile';
import { Button } from '../ui/button';

type SessionUser = (Session['user'] & { id?: string | null; phone?: string | null }) | null;

function resolveDisplayName(sessionUser: SessionUser, profile: UserProfile | null) {
  if (profile?.full_name) return profile.full_name;
  if (sessionUser?.name) return sessionUser.name;
  return sessionUser?.email ?? '사용자';
}

type Props = {
  sessionUser: SessionUser;
  profile: UserProfile | null;
};

export default function AuthPanel({ sessionUser, profile }: Props) {
  const [loading, setLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    setLoading(true);

    try {
      // FIX: Switch to NextAuth sign-in flow.
      await signIn('kakao', { callbackUrl: '/' });
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    setLoading(true);

    try {
      // FIX: Sign out via NextAuth to remove Kakao cookies.
      await signOut({ callbackUrl: '/' });
    } finally {
      setLoading(false);
    }
  }, []);

  if (sessionUser) {
    const displayName = resolveDisplayName(sessionUser, profile);

    return (
      <div className="space-y-6 text-center">
        <div className="space-y-2">
          <p className="text-2xl font-semibold">환영합니다. {displayName}님</p>
          {profile?.email || sessionUser.email ? (
            <p className="text-sm text-muted-foreground">{profile?.email ?? sessionUser.email}</p>
          ) : null}
          {profile?.phone || sessionUser.phone ? (
            <p className="text-sm text-muted-foreground">연락처: {profile?.phone ?? sessionUser.phone}</p>
          ) : null}
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
