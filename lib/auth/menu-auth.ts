import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// 단독 HTML(qna3d/qna3d-photo)의 우측 메뉴 로그인 링크를 서버에서 세션 상태에 맞춰 주입하기 위한 헬퍼.
// SiteHeader와 동일 규칙: 로그인 → 마이페이지(/mypage), 비로그인 → 로그인/회원가입(/login).
// (메뉴 표시용 판단이라 getSession으로 충분 — 권한 강제는 각 보호 라우트/API가 서버에서 별도 수행.)
export async function getMenuAuthLink(): Promise<{ href: string; label: string }> {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session }
    } = await supabase.auth.getSession();
    return session?.user
      ? { href: '/mypage', label: '마이페이지' }
      : { href: '/login', label: '로그인 / 회원가입' };
  } catch {
    return { href: '/login', label: '로그인 / 회원가입' };
  }
}
