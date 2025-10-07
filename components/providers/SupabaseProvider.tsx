'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { USER_SESSION_DURATION_MS } from '@/lib/constants/session';

const SESSION_STORAGE_KEY = 'user-session-start';

type Props = {
  children: React.ReactNode;
  initialSession: Session | null;
};

export default function SupabaseProvider({ children, initialSession }: Props) {
  const [supabase] = useState(() => createClientComponentClient());
  const logoutNotifiedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    let active = true;

    const clearTimer = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };

    const notifyServerLogout = async () => {
      if (logoutNotifiedRef.current) {
        return;
      }

      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include'
        });
        logoutNotifiedRef.current = true;
      } catch (error) {
        console.error('세션 쿠키 정리 중 오류가 발생했습니다.', error);
        logoutNotifiedRef.current = false;
      }
    };

    const performSignOut = async () => {
      clearTimer();
      window.localStorage.removeItem(SESSION_STORAGE_KEY);

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Supabase 로그아웃 중 오류가 발생했습니다.', error);
      } finally {
        await notifyServerLogout();
      }
    };

    const scheduleSignOut = (sessionStart: number) => {
      clearTimer();
      const expiresAt = sessionStart + USER_SESSION_DURATION_MS;
      const remaining = expiresAt - Date.now();

      if (remaining <= 0) {
        void performSignOut();
        return;
      }

      timerRef.current = window.setTimeout(() => {
        void performSignOut();
      }, remaining);
    };

    const ensureTimerForSession = async (session: Session | null) => {
      if (!active) return;

      if (!session?.user) {
        clearTimer();
        window.localStorage.removeItem(SESSION_STORAGE_KEY);
        logoutNotifiedRef.current = false;
        return;
      }

      logoutNotifiedRef.current = false;

      const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
      const parsed = stored ? Number.parseInt(stored, 10) : NaN;

      if (!stored || !Number.isFinite(parsed)) {
        const now = Date.now();
        window.localStorage.setItem(SESSION_STORAGE_KEY, now.toString());
        scheduleSignOut(now);
        return;
      }

      if (Date.now() - parsed >= USER_SESSION_DURATION_MS) {
        await performSignOut();
        return;
      }

      scheduleSignOut(parsed);
    };

    void ensureTimerForSession(initialSession);

    supabase.auth.getSession().then(({ data: { session } }) => {
      void ensureTimerForSession(session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      switch (event) {
        case 'SIGNED_IN': {
          const now = Date.now();
          window.localStorage.setItem(SESSION_STORAGE_KEY, now.toString());
          logoutNotifiedRef.current = false;
          scheduleSignOut(now);
          break;
        }
        case 'TOKEN_REFRESHED':
        case 'USER_UPDATED': {
          await ensureTimerForSession(session);
          break;
        }
        case 'SIGNED_OUT': {
          clearTimer();
          window.localStorage.removeItem(SESSION_STORAGE_KEY);
          await notifyServerLogout();
          break;
        }
        default:
          break;
      }
    });

    return () => {
      active = false;
      clearTimer();
      subscription.unsubscribe();
    };
  }, [initialSession, supabase]);

  return (
    <SessionContextProvider supabaseClient={supabase} initialSession={initialSession}>
      {children}
    </SessionContextProvider>
  );
}
