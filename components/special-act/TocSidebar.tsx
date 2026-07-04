'use client';

import { useEffect, useState } from 'react';

// 스티키 스크롤스파이 목차. 앵커 id 배열은 page.tsx의 TOC를 그대로 재사용한다.
// lg 이상: 좌측 세로 목차(현재 섹션 하이라이트) / 모바일: 가로 스크롤 칩 리스트.

export interface TocItem {
  id: string;
  label: string;
}

export function TocSidebar({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>(items[0]?.id ?? '');

  useEffect(() => {
    const els = items
      .map(t => document.getElementById(t.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );

    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [items]);

  const num = (i: number) => String(i + 1).padStart(2, '0');

  return (
    <nav aria-label="목차">
      {/* 데스크톱: 스티키 세로 목차 */}
      <div className="sticky top-24 hidden lg:block">
        <p className="mb-4 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          목차
        </p>
        <ul className="space-y-2.5">
          {items.map((t, i) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                data-active={active === t.id}
                className="sa-toc-link group flex items-baseline gap-2.5 text-sm text-muted-foreground hover:text-foreground"
              >
                <span className="sa-toc-bar" aria-hidden />
                <span className="sa-nums shrink-0 text-xs font-semibold tabular-nums opacity-60">
                  {num(i)}
                </span>
                <span className="leading-snug">{t.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* 모바일: 가로 스크롤 칩 */}
      <div className="lg:hidden">
        <ul className="-mx-6 flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((t, i) => (
            <li key={t.id} className="shrink-0">
              <a
                href={`#${t.id}`}
                data-active={active === t.id}
                className="sa-toc-link inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground data-[active=true]:border-[color:var(--sa-accent)]"
              >
                <span className="sa-nums tabular-nums opacity-60">{num(i)}</span>
                {t.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
