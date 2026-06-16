'use client';

import { Dialog, Transition } from '@headlessui/react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Fragment, useCallback, useState } from 'react';
import { CTAButton } from '../ui/cta-button';
import { getKakaoOAuthOptions } from '@/lib/auth/oauth';
import { getAuthErrorMessage } from '@/lib/auth/errors';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  nextPath?: string;
  authError?: string | null;
}

function getCurrentPathForOAuthRedirect() {
  const url = new URL(window.location.href);
  url.searchParams.delete('auth_error');
  return `${url.pathname}${url.search}` || '/';
}

export function LoginModal({ open, onClose, nextPath, authError }: LoginModalProps) {
  const supabase = useSupabaseClient();
  const [loading, setLoading] = useState(false);
  const authErrorMessage = getAuthErrorMessage(authError);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    const desiredNext =
      nextPath ??
      (typeof window !== 'undefined'
        ? getCurrentPathForOAuthRedirect()
        : '/');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: getKakaoOAuthOptions(desiredNext)
      });

      if (error) {
        console.error('Kakao sign-in failed', error);
      }
    } finally {
      setLoading(false);
    }
  }, [nextPath, supabase]);

  return (
    <Transition appear show={open} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-3xl border border-border bg-background p-8 shadow-xl transition-all bg-opacity-95">
                <Dialog.Title className="text-2xl font-semibold text-foreground">
                  로그인/회원가입
                </Dialog.Title>
                <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                  카카오 계정으로 간편하게 로그인 또는 회원가입을 진행하세요.
                </Dialog.Description>

                <div className="mt-6 space-y-3">
                  {authErrorMessage ? (
                    <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                      {authErrorMessage}
                    </p>
                  ) : null}
                  <CTAButton
                    className="w-full bg-[#ffeb00] text-black hover:bg-[#f5dc00] hover:text-black focus-visible:ring-[#ffeb00]"
                    onClick={handleLogin}
                    type="button"
                    disabled={loading}
                  >
                    {loading ? '카카오 로그인 준비중...' : '카카오톡 로그인/회원가입'}
                  </CTAButton>
                  <CTAButton type="button" tone="secondary" className="w-full" onClick={onClose}>
                    닫기
                  </CTAButton>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
