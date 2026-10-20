'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type CalcHeaderProps = Pick<Hook, 'headerRef'> & {
  kakaoShareEnabled: boolean;
  onShareCalc: () => void;
};

export function CalcHeader({ headerRef, kakaoShareEnabled, onShareCalc }: CalcHeaderProps) {
  return (
    <header ref={headerRef} className="sticky top-2 z-30 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:top-4 sm:px-4 dark:border-slate-800 dark:bg-slate-900/90">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 text-inherit no-underline" aria-label="양성화.com 홈페이지로 이동">
        <span className="calc-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm dark:border-transparent dark:bg-primary">
          <Image src="/docu/archlegal-fa-p-transparent.png" alt="ArchLegal" width={30} height={30} />
        </span>
        <span className="flex min-w-0 flex-col leading-tight">
          <strong className="truncate text-sm font-extrabold text-slate-950 dark:text-slate-50">양성화.com</strong>
          <span className="truncate text-[11px] text-slate-500 dark:text-slate-300">공식 기준 기반 이행강제금 계산</span>
        </span>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <ThemeToggle className="h-10 min-h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white/80 p-0 shadow-none hover:border-primary/40 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:hover:border-primary/50 dark:hover:bg-slate-800" />
        {kakaoShareEnabled ? (
          <button
            type="button"
            onClick={onShareCalc}
            aria-label="카카오톡으로 공유하기"
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#FEE500' }}
          >
            <span
              className="relative flex items-center justify-center rounded-full text-[7px] font-black leading-none tracking-tight"
              style={{ width: 26, height: 17, backgroundColor: '#111', color: '#FEE500' }}
            >
              TALK
              <span
                aria-hidden="true"
                className="absolute"
                style={{ bottom: -3, left: 5, width: 7, height: 7, backgroundColor: '#111', borderRadius: 1, transform: 'rotate(35deg)' }}
              />
            </span>
          </button>
        ) : null}
        <Button type="button" className="h-10 w-auto px-3 text-sm sm:px-4" asChild>
          <Link href="/check">1분 자가진단</Link>
        </Button>
      </div>
    </header>
  );
}
