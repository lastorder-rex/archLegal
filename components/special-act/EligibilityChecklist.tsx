'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';

// 대상 여부 30초 체크리스트. 단정 대신 "가능성" 수준으로만 안내하고,
// 결과와 무관하게 /check(1분 자가진단)·상담으로 연결한다.

const ITEMS = [
  '2023년 12월 31일 이전에 사실상 완공되었다',
  '건물 연면적의 50% 이상이 주거용이다',
  '면적 기준 이내다 (다세대: 세대당 85㎡ 이하 / 단독: 연면적 165㎡ 이하 / 다가구: 660㎡ 이하)',
  '개발제한구역·정비구역 등 제외 구역이 아니다 (또는 모름)',
];

type Result = { tone: 'good' | 'mid' | 'low'; title: string; desc: string };

function evaluate(count: number): Result {
  if (count === 4) {
    return {
      tone: 'good',
      title: '대상 가능성이 높습니다',
      desc: '네 가지 조건을 모두 충족하는 것으로 보입니다. 다만 완공 시점·면적·구역은 서류로 정밀 확인이 필요하니, 자가진단이나 상담으로 확인해 보세요.',
    };
  }
  if (count >= 2) {
    return {
      tone: 'mid',
      title: '정밀 확인이 필요합니다',
      desc: '일부 조건이 확실하지 않습니다. 면적·구역 기준은 도면과 대장 확인에 따라 결과가 달라질 수 있으므로 자가진단으로 좀 더 정확히 확인해 보세요.',
    };
  }
  return {
    tone: 'low',
    title: '대상이 아닐 수 있으나 예외 조항이 있습니다',
    desc: '현재 답변으로는 대상 가능성이 낮아 보이지만, 조례에 따른 면적 확장이나 제외 구역의 단서 예외 등 개별 사정이 있을 수 있습니다. 확실한 판단은 상담을 통해 확인하시기 바랍니다.',
  };
}

export function EligibilityChecklist() {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false]);
  const [showResult, setShowResult] = useState(false);

  const count = checked.filter(Boolean).length;
  const result = evaluate(count);

  const toggle = (i: number) =>
    setChecked(prev => prev.map((v, idx) => (idx === i ? !v : v)));

  const toneAccent =
    result.tone === 'good'
      ? 'var(--sa-accent)'
      : result.tone === 'mid'
        ? 'hsl(var(--primary))'
        : 'hsl(var(--border))';

  return (
    <div className="rounded-2xl border border-border sa-paper-panel p-6 sm:p-7">
      <ul className="divide-y divide-border/70">
        {ITEMS.map((item, i) => (
          <li key={i}>
            <button
              type="button"
              onClick={() => toggle(i)}
              aria-pressed={checked[i]}
              className="group flex w-full items-start gap-4 py-4 text-left"
            >
              <span className="sa-nums mt-0.5 shrink-0 text-xs font-semibold tabular-nums text-muted-foreground">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span
                data-checked={checked[i]}
                className="sa-check mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[5px]"
                aria-hidden
              >
                <svg
                  viewBox="0 0 16 16"
                  className={`h-3.5 w-3.5 ${checked[i] ? 'opacity-100' : 'opacity-0'}`}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8.5l3.2 3.2L13 4.5" />
                </svg>
              </span>
              <span className="text-sm leading-6 text-foreground transition group-hover:text-foreground">
                {item}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => setShowResult(true)}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-base font-extrabold text-primary-foreground transition hover:opacity-90"
      >
        결과 보기 ({count}/4 선택)
      </button>

      {showResult && (
        <div
          className="mt-5 rounded-r-xl bg-background/60 p-5 pl-6"
          style={{ borderLeft: `4px solid ${toneAccent}` }}
        >
          <p className="sa-serif text-lg font-bold text-foreground">{result.title}</p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.desc}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/check"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:opacity-90"
            >
              <Search className="h-4 w-4" aria-hidden />
              1분 자가진단 하기
            </Link>
            <Link
              href="/?address=open"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-primary px-5 text-sm font-bold text-primary transition hover:bg-primary/10"
            >
              무료 상담 신청
            </Link>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            이 결과는 참고용 안내이며, 실제 대상 여부는 서류 검토와 전문가 상담으로 확인해야 합니다.
          </p>
        </div>
      )}
    </div>
  );
}
