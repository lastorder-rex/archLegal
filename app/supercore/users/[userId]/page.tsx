'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import SupercoreLayout from '@/components/supercore/SupercoreLayout';
import AdminLoadingScreen from '@/components/supercore/AdminLoadingScreen';
import { Button } from '@/components/ui/button';
import { Comment1, CreditCardMultiple } from 'lineicons-react';
import type { UserDetail } from '@/types/admin';
import { formatDateTimeShortSafe as formatDateTime } from '@/lib/admin/format';

interface UserDetailResponse {
  user: UserDetail;
  stats: {
    consultation_count: number;
    payment_count: number;
    last_consultation_at: string | null;
    last_payment_at: string | null;
  };
}

export default function UserDetailPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;

  const [isLoading, setIsLoading] = useState(true);
  const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
  const [stats, setStats] = useState<UserDetailResponse['stats'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUserDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        const message = response.status === 404 ? '회원 정보를 찾을 수 없습니다.' : '회원 정보를 불러오지 못했습니다.';
        setError(message);
        setUserDetail(null);
        return;
      }

      const data: UserDetailResponse = await response.json();
      setUserDetail(data.user);
      setStats(data.stats);
      setError(null);
    } catch (err) {
      console.error('Load user detail error:', err);
      setError('회원 정보를 불러오지 못했습니다.');
      setUserDetail(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const handleBlockUser = useCallback(() => {
    const confirmed = window.confirm('회원을 차단하시겠습니까?');
    if (!confirmed) {
      return;
    }

    // TODO: 블로킹 API 연동 시 구현
    console.info('Block user action pending API integration.');
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        await response.json();
        await loadUserDetail();
      } else {
        router.push('/supercore');
      }
    } catch (err) {
      console.error('Auth check error:', err);
      router.push('/supercore');
    } finally {
      setIsLoading(false);
    }
  }, [loadUserDetail, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (isLoading && !userDetail) {
    return <AdminLoadingScreen />;
  }

  return (
    <SupercoreLayout title="회원 상세 정보">
      <div className="space-y-6">
        {error ? (
          <div className="bg-white rounded-lg border border-red-200 p-6 text-red-600">
            {error}
          </div>
        ) : userDetail ? (
          <>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900">기본 정보</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">이름</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{userDetail.legal_name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">전화번호</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{userDetail.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">이메일</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{userDetail.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">생년월일</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{userDetail.birth_date || '-'}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">가입일시</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatDateTime(userDetail.created_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">마지막 로그인</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">{formatDateTime(userDetail.last_sign_in_at)}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">프로필 완료</p>
                  <p className="mt-1 text-base font-semibold text-slate-900">
                    {userDetail.profile_completed ? '완료' : '미완료'}
                    {userDetail.profile_completed_at && ` (${formatDateTime(userDetail.profile_completed_at)})`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">회원 관리</p>
                  <Button
                    onClick={handleBlockUser}
                    size="sm"
                    className="mt-2 h-10 px-6 bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600 sm:w-auto"
                  >
                    회원 차단
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div
                className="rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-primary hover:shadow"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/supercore/users/${userId}/consultations`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/supercore/users/${userId}/consultations`);
                  }
                }}
              >
                <div className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <Comment1 className="inline h-5 w-5 mr-2 align-text-bottom" aria-hidden />
                    상담 요청
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.consultation_count ?? 0}건
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    최근 상담일: {formatDateTime(stats?.last_consultation_at ?? null)}
                  </p>
                </div>
              </div>
              <div
                className="rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-primary hover:shadow"
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/supercore/users/${userId}/payments`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    router.push(`/supercore/users/${userId}/payments`);
                  }
                }}
              >
                <div className="p-6">
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    <CreditCardMultiple className="inline h-5 w-5 mr-2 align-text-bottom" aria-hidden />
                    결제
                  </p>
                  <p className="mt-2 text-3xl font-bold text-slate-900">
                    {stats?.payment_count ?? 0}건
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    최근 결제일: {formatDateTime(stats?.last_payment_at ?? null)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="h-10 px-6 sm:w-auto"
                onClick={() => router.push('/supercore/users')}
              >
                목록으로
              </Button>
              <Button
                variant="primary"
                size="sm"
                className="h-10 px-6 sm:w-auto"
                onClick={() => router.push(`/supercore/users/${userId}/consultations`)}
              >
                상담 내역 보기
              </Button>
            </div>
          </>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-6 text-slate-600">
            회원 정보를 불러올 수 없습니다.
          </div>
        )}
      </div>
    </SupercoreLayout>
  );
}
