'use client';

import { useEffect, useState } from 'react';
import { SPECIAL_ACT_DATES } from '@/lib/constants/special-act';

// 히어로 하단 D-day 스탯 스트립 + 18개월 진행 게이지 + 3-스톱 미니 타임라인.
// 서버/클라이언트 시각 차로 인한 하이드레이션 불일치를 막기 위해 마운트 후에만 계산한다.
// 시행 후에는 첫 스탯이 '시행까지'에서 '신고 접수 중'으로 자동 전환된다.

function toUTC(target: string): number {
  const [y, m, d] = target.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function daysUntil(target: string): number {
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.ceil((toUTC(target) - today) / 86_400_000);
}

const ENACTED = toUTC(SPECIAL_ACT_DATES.enacted);
const EFFECTIVE = toUTC(SPECIAL_ACT_DATES.effective);
const EXPIRY = toUTC(SPECIAL_ACT_DATES.expiry);

export function DdayBadges() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const toEffective = daysUntil(SPECIAL_ACT_DATES.effective);
  const toExpiry = daysUntil(SPECIAL_ACT_DATES.expiry);
  const started = toEffective <= 0;

  // 제정→만료 전체 구간에서 오늘 위치(0~1)
  const now = new Date();
  const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const progress = Math.min(1, Math.max(0, (todayUTC - ENACTED) / (EXPIRY - ENACTED)));
  const effectiveStop = ((EFFECTIVE - ENACTED) / (EXPIRY - ENACTED)) * 100;

  return (
    <div className="mt-10">
      {/* 큰 스탯 2개 + 게이지 */}
      <div className="grid gap-6 sm:grid-cols-[auto_auto_1fr] sm:items-end sm:gap-10">
        <Stat
          label={started ? '신고 접수 중' : '시행까지'}
          value={
            !mounted
              ? '·'
              : started
                ? '접수중'
                : `D-${toEffective.toLocaleString()}`
          }
        />
        <div className="hidden h-12 w-px self-center bg-[color:var(--sa-on-ink-faint)] sm:block" aria-hidden />
        <Stat
          label="신청 마감까지"
          value={!mounted ? '·' : `D-${Math.max(0, toExpiry).toLocaleString()}`}
          align="left"
        />
      </div>

      {/* 18개월 진행 게이지 */}
      <div className="mt-8 max-w-xl">
        <div className="sa-gauge-track relative h-1.5 w-full rounded-full" aria-hidden>
          {/* 시행 지점 마커 */}
          <span
            className="absolute top-1/2 h-3 w-px -translate-y-1/2 bg-[color:var(--sa-on-ink-muted)]"
            style={{ left: `${effectiveStop}%` }}
          />
          {mounted && (
            <>
              <span
                className="sa-gauge-fill absolute inset-y-0 left-0 rounded-full"
                style={{ width: `${progress * 100}%` }}
              />
              <span
                className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--sa-accent)] bg-[color:var(--sa-ink)]"
                style={{ left: `${progress * 100}%` }}
              />
            </>
          )}
        </div>
        {/* 3-스톱 미니 타임라인 */}
        <div className="mt-2.5 flex justify-between text-[0.7rem]">
          <MiniStop label="제정" date={SPECIAL_ACT_DATES.enacted} align="start" />
          <MiniStop label="시행" date={SPECIAL_ACT_DATES.effective} align="center" />
          <MiniStop label="만료" date={SPECIAL_ACT_DATES.expiry} align="end" />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  align = 'left',
}: {
  label: string;
  value: string;
  align?: 'left';
}) {
  return (
    <div className={align}>
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.2em] sa-on-ink-muted">
        {label}
      </p>
      <p className="sa-serif sa-nums mt-1 text-[2.6rem] font-black leading-none tabular-nums sa-on-ink sm:text-[3rem]">
        {value}
      </p>
    </div>
  );
}

function MiniStop({
  label,
  date,
  align,
}: {
  label: string;
  date: string;
  align: 'start' | 'center' | 'end';
}) {
  const textAlign =
    align === 'start' ? 'text-left' : align === 'end' ? 'text-right' : 'text-center';
  return (
    <div className={textAlign}>
      <span className="font-semibold sa-on-ink">{label}</span>
      <span className="sa-nums ml-1.5 tabular-nums sa-on-ink-muted">{date}</span>
    </div>
  );
}
