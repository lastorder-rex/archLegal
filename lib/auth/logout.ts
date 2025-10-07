import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

/**
 * 사용자 로그아웃 공통 유틸리티
 * - Supabase 세션 종료
 * - 서버 세션 쿠키 삭제
 * - 홈페이지로 리다이렉트
 */
export async function handleUserLogout(router: AppRouterInstance) {
  const supabase = createClientComponentClient();

  try {
    // Supabase 세션 종료
    await supabase.auth.signOut();

    // 서버 세션 쿠키 삭제
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // 페이지 새로고침 및 홈으로 이동
    router.refresh();
    router.replace('/');
  }
}

/**
 * 관리자 로그아웃 공통 유틸리티
 * - 관리자 세션 종료
 * - 관리자 로그인 페이지로 리다이렉트
 */
export async function handleAdminLogout(router: AppRouterInstance, onLogout?: () => void) {
  try {
    await fetch('/api/admin/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  } catch (error) {
    console.error('Admin logout error:', error);
  } finally {
    onLogout?.();
    router.push('/supercore');
    router.refresh();
  }
}
