'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

interface UsePasswordLoginOptions {
  redirectPath: string;
}

export function usePasswordLogin({ redirectPath }: UsePasswordLoginOptions) {
  const router = useRouter();
  const supabase = useSupabaseClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;
      if (!data.user) {
        throw new Error('이메일/비밀번호 로그인에 실패했습니다.');
      }

      const sessionResponse = await fetch('/api/auth/session', { method: 'POST' });

      if (!sessionResponse.ok) {
        const payload = await sessionResponse.json().catch(() => ({}));
        throw new Error(payload.error || '세션 동기화에 실패했습니다.');
      }

      router.push(redirectPath);
      router.refresh();
    } catch (err: any) {
      const message = err?.message || '로그인 중 오류가 발생했습니다.';
      setError(message);
      console.error('[auth] password login failed', err);
    } finally {
      setLoading(false);
    }
  }, [email, password, redirectPath, router, supabase.auth]);

  return {
    email,
    password,
    loading,
    error,
    setEmail,
    setPassword,
    signIn,
    canSubmit: Boolean(email && password && !loading),
  };
}
