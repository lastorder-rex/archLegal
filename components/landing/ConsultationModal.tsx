'use client';

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useEffect, useState, useMemo, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { User } from '@supabase/supabase-js';
import { X } from 'lucide-react';
import ConsultationForm from '@/components/consultation/ConsultationForm';
import type { UserProfile } from '@/types/profile';
import { CTAButton } from '@/components/ui/cta-button';

interface ConsultationModalProps {
  open: boolean;
  onClose: () => void;
}

export function ConsultationModal({ open, onClose }: ConsultationModalProps) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClientComponentClient(), []);

  useEffect(() => {
    if (!open) return;

    const loadUserData = async () => {
      setIsLoading(true);
      setNeedsLogin(false);

      try {
        // Get current session
        const {
          data: { user: sessionUser },
          error: authError
        } = await supabase.auth.getUser();

        if (authError || !sessionUser) {
          setNeedsLogin(true);
          setIsLoading(false);
          return;
        }

        setUser(sessionUser);

        // Get user profile
        const { data: profileData, error: profileError } = await supabase
          .from('users')
          .select(
            'auth_id, full_name, email, phone, legal_name, contact_phone, profile_completed, profile_completed_at, consent_terms_at, consent_privacy_at, contact_phone_verified_at, birth_date'
          )
          .eq('auth_id', sessionUser.id)
          .maybeSingle<UserProfile>();

        if (profileError) {
          console.error('Failed to load user profile', profileError);
        }

        if (!profileData || !profileData.profile_completed) {
          setNeedsLogin(true);
          setIsLoading(false);
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error('Error loading user data:', error);
        setNeedsLogin(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, [open, supabase]);

  const handleLogin = useCallback(async () => {
    setLoading(true);
    const origin =
      process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const cleanOrigin = origin.endsWith('/') ? origin.slice(0, -1) : origin;

    const desiredNext = '/';
    const encodedNext = encodeURIComponent(desiredNext);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${cleanOrigin}/auth/callback?next=${encodedNext}`,
          queryParams: {
            scope: 'account_email'
          }
        }
      });

      if (error) {
        console.error('Kakao sign-in failed', error);
      }
    } finally {
      setLoading(false);
    }
  }, [supabase]);

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
              <Dialog.Panel className="w-full max-w-[660px] transform overflow-hidden rounded-3xl border border-border bg-background shadow-xl transition-all">
                {/* Header */}
                <div className="border-b border-border bg-card px-6 py-4 flex items-center justify-between">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-foreground">
                      상담 문의 등록
                    </Dialog.Title>
                    <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                    30년 경력의 전문가가 빠르게 도와드립니다.
                    </Dialog.Description>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-2 hover:bg-muted transition-colors"
                    aria-label="닫기"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="px-6 py-6 max-h-[calc(100vh-200px)] overflow-y-auto">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center space-y-3">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                        <p className="text-sm text-muted-foreground">로딩 중...</p>
                      </div>
                    </div>
                  ) : needsLogin ? (
                    <div className="text-center py-12 space-y-6">
                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold">로그인이 필요합니다</h3>
                        <p className="text-sm text-muted-foreground">
                          상담 신청을 하시려면 먼저 로그인 또는 회원가입이 필요합니다.
                        </p>
                      </div>
                      <div className="flex flex-col gap-3 justify-center max-w-sm mx-auto">
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
                    </div>
                  ) : user && profile ? (
                    <div className="space-y-6">
                      {/* User Info */}
                      {/* <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {user.user_metadata?.name?.[0] ||
                               user.email?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {user.user_metadata?.name ||
                               user.user_metadata?.full_name ||
                               '사용자'}님 안녕하세요!
                            </p>
                            <p className="text-sm text-muted-foreground">
                              로그인 상태: 인증됨
                            </p>
                          </div>
                        </div>
                      </div> */}

                      {/* Instructions - Collapsible */}
                      {/* <div className="space-y-3">
                        <details className="bg-muted/50 rounded-lg overflow-hidden">
                          <summary className="cursor-pointer p-4 font-semibold hover:bg-muted/70 transition-colors text-sm">
                            📋 상담 신청 절차 (클릭하여 보기)
                          </summary>
                          <div className="px-4 pb-4">
                            <ol className="text-sm text-muted-foreground space-y-1">
                              <li>1. 개인정보 입력 (실명, 연락처)</li>
                              <li>2. 주소 검색 및 선택</li>
                              <li>3. 건축물대장 정보 자동 조회</li>
                              <li>4. 상담 내용 작성 및 제출</li>
                            </ol>
                          </div>
                        </details>

                        <details className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden dark:bg-blue-950/30 dark:border-blue-800">
                          <summary className="cursor-pointer p-4 font-semibold text-blue-900 dark:text-blue-100 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors text-sm">
                            💡 이용 안내 (클릭하여 보기)
                          </summary>
                          <div className="px-4 pb-4">
                            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                              <li>• 주소는 도로명주소 기준으로 검색됩니다</li>
                              <li>• 건축물 정보는 국토교통부 공식 데이터를 사용합니다</li>
                              <li>• 상담 접수 후 전문가가 검토하여 연락드립니다</li>
                              <li>• 개인정보는 상담 목적으로만 사용됩니다</li>
                            </ul>
                          </div>
                        </details>
                      </div> */}

                      {/* Consultation Form */}
                      <div className="bg-card border border-border rounded-lg p-6">
                        <ConsultationForm user={user} profile={profile} onCancel={onClose} />
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-sm text-muted-foreground">
                        사용자 정보를 불러올 수 없습니다.
                      </p>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
