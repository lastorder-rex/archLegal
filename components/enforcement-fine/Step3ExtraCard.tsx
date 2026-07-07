'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatDecimal } from '@/lib/enforcement-fine/calculator-helpers';
import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type Step3ExtraCardProps = Pick<
  Hook,
  | 'selectedAdditionCodes'
  | 'setSelectedAdditionCodes'
  | 'additionOptions'
  | 'selectedReductionCodes'
  | 'setSelectedReductionCodes'
  | 'reductionOptions'
  | 'loadingAdjustments'
  | 'setResult'
  | 'extensionConstructionType'
  | 'setExtensionConstructionType'
  | 'extensionConstructionOptions'
  | 'loadingExtensionConstructionOptions'
  | 'loadExtensionConstructionOptions'
  | 'setCurrentStep'
>;

export function Step3ExtraCard({
  selectedAdditionCodes,
  setSelectedAdditionCodes,
  additionOptions,
  selectedReductionCodes,
  setSelectedReductionCodes,
  reductionOptions,
  loadingAdjustments,
  setResult,
  extensionConstructionType,
  setExtensionConstructionType,
  extensionConstructionOptions,
  loadingExtensionConstructionOptions,
  loadExtensionConstructionOptions,
  setCurrentStep
}: Step3ExtraCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-4 text-base font-semibold text-slate-950">③ 추가 사항</h2>
      <div className="grid gap-4">
        <details className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">
            가산 항목 ({selectedAdditionCodes.length}개 선택)
          </summary>
          <div className="mt-3 grid gap-2">
            {loadingAdjustments && additionOptions.length === 0 ? (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-500">가산 항목을 불러오는 중입니다.</div>
            ) : null}
            {!loadingAdjustments && additionOptions.length === 0 ? (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-500">선택 가능한 가산 항목이 없습니다.</div>
            ) : null}
            {additionOptions.map(option => (
              <label key={option.code} className="flex items-start gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={selectedAdditionCodes.includes(option.code)}
                  onChange={event => {
                    setSelectedAdditionCodes(current => event.target.checked
                      ? [...current, option.code]
                      : current.filter(code => code !== option.code));
                    setResult(null);
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-snug">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">+{formatDecimal(option.rate)}</span>
                </span>
              </label>
            ))}
          </div>
        </details>

        <details className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <summary className="cursor-pointer text-sm font-semibold text-slate-950">
            감산 항목 ({selectedReductionCodes.length}개 선택)
          </summary>
          <div className="mt-3 grid gap-2">
            {loadingAdjustments && reductionOptions.length === 0 ? (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-500">감산 항목을 불러오는 중입니다.</div>
            ) : null}
            {!loadingAdjustments && reductionOptions.length === 0 ? (
              <div className="rounded-md bg-white px-3 py-2 text-sm text-slate-500">선택 가능한 감산 항목이 없습니다.</div>
            ) : null}
            {reductionOptions.map(option => (
              <label key={option.code} className="flex items-start gap-2 rounded-md bg-white px-3 py-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-slate-300"
                  checked={selectedReductionCodes.includes(option.code)}
                  onChange={event => {
                    setSelectedReductionCodes(current => event.target.checked
                      ? [...current, option.code]
                      : current.filter(code => code !== option.code));
                    setResult(null);
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium leading-snug">{option.label}</span>
                  <span className="mt-0.5 block text-xs text-slate-500">-{formatDecimal(option.rate)}</span>
                </span>
              </label>
            ))}
          </div>
        </details>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
          <Label htmlFor="wizard-extension">무허가 증축 기초시공</Label>
          <select
            id="wizard-extension"
            className="mt-2 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={extensionConstructionType}
            onFocus={() => {
              if (extensionConstructionOptions.length === 0 && !loadingExtensionConstructionOptions) {
                void loadExtensionConstructionOptions();
              }
            }}
            onChange={event => {
              setExtensionConstructionType(event.target.value);
              setResult(null);
            }}
          >
            {loadingExtensionConstructionOptions && extensionConstructionOptions.length === 0 ? (
              <option value={extensionConstructionType}>기초시공 항목 불러오는 중</option>
            ) : null}
            {extensionConstructionOptions.length === 0 && !loadingExtensionConstructionOptions ? (
              <option value="not_applicable">해당없음</option>
            ) : null}
            {extensionConstructionOptions.map(option => (
              <option key={option.code} value={option.code}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(2)}>이전</Button>
          <Button type="button" onClick={() => setCurrentStep(4)}>다음</Button>
        </div>
      </div>
    </div>
  );
}
