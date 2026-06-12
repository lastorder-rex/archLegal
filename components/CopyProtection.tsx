'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 전역 복사 방지 컴포넌트
 * - 텍스트 선택 차단
 * - 우클릭 메뉴 비활성화
 * - 키보드 복사/붙여넣기 단축키 차단
 * - 복사/잘라내기/붙여넣기 이벤트 차단
 * - 관리자 페이지는 제외
 */
export function CopyProtection() {
  const pathname = usePathname();

  useEffect(() => {
    // 관리자/인증 페이지와 입력 화면에서는 복사 보호 제외
    const isExcludedPage =
      pathname?.startsWith('/admin') ||
      pathname?.startsWith('/supercore') ||
      pathname?.startsWith('/auth') ||
      pathname === '/login' ||
      pathname === '/signup';
    if (isExcludedPage) return;

    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) {
        return false;
      }

      return Boolean(
        target.closest('input, textarea, select, [contenteditable="true"]')
      );
    };

    const blockEvent = (e: Event) => {
      if (isEditableTarget(e.target)) {
        return;
      }
      e.preventDefault();
      return false;
    };

    // 복사/붙여넣기 키보드 단축키 방지
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target) || typeof e.key !== 'string') {
        return;
      }

      const key = e.key.toLowerCase();
      if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'x', 'v'].includes(key)) {
        e.preventDefault();
        return false;
      }
      // 개발자 도구 단축키도 선택적으로 방지 (F12, Ctrl+Shift+I)
      if (e.key === 'F12' ||
          ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
        return false;
      }
    };

    // 이벤트 리스너 등록
    document.addEventListener('contextmenu', blockEvent);
    document.addEventListener('copy', blockEvent);
    document.addEventListener('cut', blockEvent);
    document.addEventListener('paste', blockEvent);
    document.addEventListener('selectstart', blockEvent);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', blockEvent);

    // 클린업
    return () => {
      document.removeEventListener('contextmenu', blockEvent);
      document.removeEventListener('copy', blockEvent);
      document.removeEventListener('cut', blockEvent);
      document.removeEventListener('paste', blockEvent);
      document.removeEventListener('selectstart', blockEvent);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', blockEvent);
    };
  }, [pathname]);

  return null;
}
