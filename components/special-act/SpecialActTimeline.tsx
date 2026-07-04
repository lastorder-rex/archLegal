'use client';

import { useEffect, useState } from 'react';
import { SPECIAL_ACT_DATES } from '@/lib/constants/special-act';

// 일정 타임라인(부칙). 노드 텍스트는 기존 콘텐츠 그대로.
// '오늘' 마커 위치만 클라이언트에서 계산(하이드레이션 안전).

const NODES: [string, string, string][] = [
  ['2026.6.16', '제정·공포', '법률 제21820호로 제정·공포되었습니다(부칙 제1조).'],
  ['2026.12.17', '시행', '공포 후 6개월이 지난 날부터 시행됩니다. 신고 접수가 시작됩니다(부칙 제1조).'],
  [
    '2028.6.16',
    '유효기간 만료',
    '시행일부터 18개월간 효력을 가지며, 이날 유효기간이 만료됩니다(부칙 제2조). 만료 전 신고 접수분은 이후에도 적용됩니다(부칙 제3조).',
  ],
];

function toUTC(target: string): number {
  const [y, m, d] = target.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function SpecialActTimeline() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const enacted = toUTC(SPECIAL_ACT_DATES.enacted);
  const expiry = toUTC(SPECIAL_ACT_DATES.expiry);
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const progress = Math.min(100, Math.max(0, ((todayUTC - enacted) / (expiry - enacted)) * 100));

  return (
    <div className="mt-6">
      {/* 데스크톱: 수평 3노드 */}
      <div className="relative hidden pt-10 md:block">
        <div className="absolute left-[8%] right-[8%] top-[3.15rem] h-px bg-border" aria-hidden />
        {mounted && (
          <div
            className="absolute top-[2.35rem] z-10 -translate-x-1/2"
            style={{ left: `calc(8% + ${progress} * 0.84%)` }}
            aria-hidden
          >
            <span className="mx-auto block h-2.5 w-2.5 rounded-full bg-[color:var(--sa-accent)] ring-4 ring-[color:var(--sa-accent)]/20" />
            <span className="mt-1 block whitespace-nowrap text-center text-[0.65rem] font-bold text-[color:var(--sa-accent)]">
              오늘
            </span>
          </div>
        )}
        <ol className="relative grid grid-cols-3">
          {NODES.map(([date, title, desc], i) => (
            <li
              key={date}
              className={
                i === 0 ? 'pr-6 text-left' : i === 2 ? 'pl-6 text-right' : 'px-6 text-center'
              }
            >
              <span
                className={`block h-3 w-3 rounded-full border-2 border-[color:var(--sa-accent)] bg-background ${
                  i === 0 ? '' : i === 2 ? 'ml-auto' : 'mx-auto'
                }`}
                aria-hidden
              />
              <p className="sa-serif sa-nums mt-4 text-lg font-bold tabular-nums text-foreground">
                {date}
              </p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">{title}</p>
              <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{desc}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* 모바일: 수직 */}
      <ol className="space-y-5 border-l-2 border-border pl-6 md:hidden">
        {NODES.map(([date, title, desc]) => (
          <li key={date} className="relative">
            <span
              className="absolute -left-[1.72rem] top-1 h-3 w-3 rounded-full border-2 border-[color:var(--sa-accent)] bg-background"
              aria-hidden
            />
            <p className="sa-serif sa-nums text-base font-bold tabular-nums text-foreground">
              {date}
            </p>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="mt-0.5 text-sm leading-6 text-muted-foreground">{desc}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
