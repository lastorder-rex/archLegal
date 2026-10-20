'use client';

import { formatCurrency } from '@/lib/enforcement-fine/calculator-helpers';
import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type MobileStickyBarProps = Pick<Hook, 'setCurrentStep' | 'scrollResultCardIntoView'> & {
  result: NonNullable<Hook['result']>;
};

export function MobileStickyBar({ result, setCurrentStep, scrollResultCardIntoView }: MobileStickyBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold text-primary">예상 이행강제금</div>
          <div className="text-2xl font-bold leading-tight text-slate-950">{formatCurrency(result.result.estimatedFineKrw)}</div>
        </div>
        <button
          type="button"
          className="h-8 shrink-0 rounded-md border border-primary/30 px-2.5 text-xs font-semibold text-primary"
          onClick={() => {
            setCurrentStep(4);
            window.setTimeout(() => {
              scrollResultCardIntoView();
            }, 0);
          }}
        >
          보기
        </button>
      </div>
    </div>
  );
}
