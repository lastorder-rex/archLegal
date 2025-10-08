'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * 전역 복사 방지 컴포넌트
 * - 텍스트 선택 차단
 * - 우클릭 메뉴 비활성화
 * - 키보드 복사(Ctrl+C) 차단
 * - 관리자 페이지는 제외
 */
export function CopyProtection() {
  const pathname = usePathname();

  useEffect(() => {
    // 관리자 페이지는 복사 보호 제외
    const isAdminPage = pathname?.startsWith('/admin');
    if (isAdminPage) return;

    // 우클릭 방지
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // 복사 키보드 단축키 방지 (Ctrl+C, Cmd+C)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
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

    // 드래그 시작 방지
    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    // 이벤트 리스너 등록
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('dragstart', handleDragStart);

    // 클린업
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, [pathname]);

  return null;
}
