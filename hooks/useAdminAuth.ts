'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Admin } from '@/types/admin';

// 관리자 페이지 공통 인증 게이트.
// 기존 각 페이지의 checkAuth 패턴을 그대로 옮긴 것:
//   /api/admin/auth/verify GET → 성공 시 admin/isAuthenticated 갱신 + onReady(초기 로드) await
//   → 실패·예외 시 router.push(redirectTo).
// ⚠️ onReady 는 반드시 useCallback 으로 감싸 넘길 것. onReady 의 identity 가 바뀌면
//    (예: 검색필터 의존 loadX) 원본과 동일하게 재검증+재로드가 다시 실행된다.
//    또한 첫 페인트의 로딩 화면이 데이터 로드 완료까지 유지되도록 onReady 는 Promise 를 반환해야 한다.
interface UseAdminAuthOptions {
  onReady?: (admin: Admin | null) => void | Promise<void>;
  redirectTo?: string;
}

interface UseAdminAuthResult {
  admin: Admin | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
}

export function useAdminAuth(options: UseAdminAuthOptions = {}): UseAdminAuthResult {
  const { onReady, redirectTo = '/supercore' } = options;
  const router = useRouter();

  const [admin, setAdmin] = useState<Admin | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/auth/verify', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setAdmin(data.admin);
        setIsAuthenticated(true);
        await onReady?.(data.admin);
      } else {
        router.push(redirectTo);
      }
    } catch (error) {
      console.error('Auth check error:', error);
      router.push(redirectTo);
    } finally {
      setIsCheckingAuth(false);
    }
  }, [onReady, redirectTo, router]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return { admin, isAuthenticated, isCheckingAuth };
}
