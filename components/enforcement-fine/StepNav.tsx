'use client';

import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type StepNavProps = Pick<Hook, 'preparedData' | 'currentStep' | 'setCurrentStep'>;

export function StepNav({ preparedData, currentStep, setCurrentStep }: StepNavProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
      <ol className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
        {[
          '주소/공시지가',
          '건물 정보',
          '추가 사항',
          '위반 내용'
        ].map((label, index) => {
          const step = index + 1;
          const enabled = step === 1 || Boolean(preparedData);
          return (
            <li key={label}>
              <button
                type="button"
                disabled={!enabled}
                onClick={() => enabled && setCurrentStep(step)}
                className={`group flex min-h-10 w-full items-center gap-2 rounded-md border px-2.5 text-left text-sm transition-colors ${
                  currentStep === step
                    ? 'border-primary bg-primary/5 text-primary'
                    : enabled
                      ? 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                      : 'border-transparent text-slate-300'
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                    currentStep === step
                      ? 'bg-primary text-white'
                      : enabled
                        ? 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                        : 'bg-slate-50 text-slate-300'
                  }`}
                >
                  {step}
                </span>
                <span className="break-keep font-medium leading-snug">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
