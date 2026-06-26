'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@supabase/auth-helpers-react';
import { BookUp, Building2, Megaphone, Menu, Newspaper, X } from 'lucide-react';

// 콘텐츠 페이지 공용 헤더 (qna/card-news/campaign/press/procedure 공유 — 통일감).
// 랜딩의 공개 메뉴를 밝은 헤더로 보여준다(경량판: 페이지 링크 + 로그인. 모달/알림 등 랜딩 전용 요소 제외).
// 헤더를 바꾸려면 이 파일 한 곳만 고치면 모든 페이지에 반영.

const NAV_LINKS = [
  { label: '3D 위반사례', href: '/qna', icon: <Building2 className="h-4 w-4" aria-hidden /> },
  { label: '핵심정리', href: '/card-news', icon: <BookUp className="h-4 w-4" aria-hidden /> },
  { label: '캠페인', href: '/campaign', icon: <Megaphone className="h-4 w-4" aria-hidden /> },
  { label: '언론보도', href: '/press', icon: <Newspaper className="h-4 w-4" aria-hidden /> },
];

export function SiteHeader() {
  const user = useUser();
  const [open, setOpen] = useState(false);
  const authHref = user ? '/mypage' : '/login';
  const authLabel = user ? '마이페이지' : '로그인/회원가입';

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.35em] text-muted-foreground transition hover:text-primary"
        >
          <Image src="/docu/logo.png" alt="" width={28} height={28} aria-hidden="true" />
          <span>양성화.com</span>
        </Link>

        {/* 데스크톱 메뉴 */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground sm:flex">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="inline-flex items-center gap-2 transition hover:text-primary"
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
          <Link
            href={authHref}
            className="inline-flex items-center rounded-lg border border-border px-3 py-1.5 font-semibold transition hover:border-primary hover:text-primary"
          >
            {authLabel}
          </Link>
        </nav>

        {/* 모바일 토글 */}
        <button
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="text-muted-foreground transition hover:text-primary sm:hidden"
        >
          {open ? <X className="h-6 w-6" aria-hidden /> : <Menu className="h-6 w-6" aria-hidden />}
        </button>
      </div>

      {/* 모바일 메뉴 */}
      {open && (
        <nav className="border-t border-border bg-background px-6 py-4 text-sm font-medium text-muted-foreground sm:hidden">
          <div className="flex flex-col gap-3">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 transition hover:text-primary"
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
            <Link
              href={authHref}
              onClick={() => setOpen(false)}
              className="inline-flex w-fit items-center rounded-lg border border-border px-3 py-1.5 font-semibold transition hover:border-primary hover:text-primary"
            >
              {authLabel}
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
