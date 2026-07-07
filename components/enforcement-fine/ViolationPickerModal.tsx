'use client';

import { CheckCircle2, Loader2 } from 'lucide-react';
import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type ViolationPickerModalProps = Pick<
  Hook,
  | 'setViolationPickerOpen'
  | 'loadingTypes'
  | 'groupedViolationOptions'
  | 'violationType'
  | 'handleViolationTypeChange'
>;

export function ViolationPickerModal({
  setViolationPickerOpen,
  loadingTypes,
  groupedViolationOptions,
  violationType,
  handleViolationTypeChange
}: ViolationPickerModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-slate-950/45 px-0 sm:items-center sm:px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="violation-picker-title"
      onClick={() => setViolationPickerOpen(false)}
    >
      <div
        className="max-h-[82vh] w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:mx-auto sm:max-w-lg sm:rounded-xl"
        onClick={event => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
          <div>
            <h2 id="violation-picker-title" className="text-base font-semibold text-slate-950">위반유형 선택</h2>
            <p className="mt-0.5 text-xs text-slate-500">대분류 아래에서 실제 위반유형을 선택하세요.</p>
          </div>
          <button
            type="button"
            className="h-9 shrink-0 rounded-md border border-slate-200 px-3 text-sm font-medium text-slate-600"
            onClick={() => setViolationPickerOpen(false)}
          >
            닫기
          </button>
        </div>

        <div className="max-h-[calc(82vh-68px)] overflow-y-auto px-4 py-3">
          {loadingTypes && groupedViolationOptions.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              위반유형을 불러오는 중입니다.
            </div>
          ) : null}

          {!loadingTypes && groupedViolationOptions.length === 0 ? (
            <div className="rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-600">
              표시할 위반유형이 없습니다.
            </div>
          ) : null}

          <div className="space-y-5">
            {groupedViolationOptions.map(group => (
              <section key={group.label}>
                <h3 className="mb-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs font-semibold text-slate-700">
                  {group.label}
                </h3>
                <div className="ml-3 space-y-1.5 border-l border-slate-200 pl-3">
                  {group.items.map(option => {
                    const selected = violationType === option.code;

                    return (
                      <button
                        key={option.code}
                        type="button"
                        className={[
                          'flex w-full items-start justify-between gap-3 rounded-md border px-3 py-2.5 text-left text-sm leading-5 transition',
                          selected
                            ? 'border-primary bg-primary/5 text-primary'
                            : 'border-slate-200 bg-white text-slate-800 hover:border-primary/40 hover:bg-blue-50'
                        ].join(' ')}
                        onClick={() => handleViolationTypeChange(option.code)}
                      >
                        <span>{option.label}</span>
                        {selected ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : null}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
