'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  buildCalcConsultMessage,
  CALC_CONSULT_KEY,
  formatCurrency,
  formatDecimal,
  formatRate
} from '@/lib/enforcement-fine/calculator-helpers';
import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type ResultAsideProps = Pick<
  Hook,
  | 'resultCardRef'
  | 'result'
  | 'hasEstimatedRange'
  | 'resultViolationLabel'
  | 'violationBasis'
  | 'preparedData'
  | 'dongName'
  | 'hoName'
  | 'selectedAddress'
  | 'criteriaOpen'
  | 'setCriteriaOpen'
  | 'criteriaInputRows'
  | 'criteriaIntermediateRows'
  | 'adjustmentItems'
  | 'specialConditionItems'
> & {
  showInternalCalculationDetails: boolean;
};

export function ResultAside({
  resultCardRef,
  result,
  hasEstimatedRange,
  resultViolationLabel,
  violationBasis,
  preparedData,
  dongName,
  hoName,
  selectedAddress,
  criteriaOpen,
  setCriteriaOpen,
  criteriaInputRows,
  criteriaIntermediateRows,
  adjustmentItems,
  specialConditionItems,
  showInternalCalculationDetails
}: ResultAsideProps) {
  return (
    <aside className="order-2 space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div ref={resultCardRef} className="rounded-lg border border-primary/30 bg-white p-4 shadow-sm sm:p-5">
        <div className="text-sm font-semibold text-primary">예상 이행강제금</div>
        {result ? (
          <>
            <div className="mt-2 text-3xl font-bold text-slate-950">{formatCurrency(result.result.estimatedFineKrw)}</div>
            {hasEstimatedRange ? (
              <div className="mt-3 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
                예상범위 {formatCurrency(result.result.estimatedFineMinKrw)} ~ {formatCurrency(result.result.estimatedFineMaxKrw)}
              </div>
            ) : null}

            {/* 방치 시 누적 — 이행강제금은 시정할 때까지 매년 반복 부과 */}
            <div className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-3 py-3">
              <div className="text-sm font-semibold text-rose-700">방치하면 — 매년 반복 부과</div>
              <dl className="mt-2 space-y-1.5 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-rose-700/80">3년 누적</dt>
                  <dd className="font-bold text-rose-700">{formatCurrency(result.result.estimatedFineKrw * 3)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-rose-700/80">5년 누적</dt>
                  <dd className="font-bold text-rose-700">{formatCurrency(result.result.estimatedFineKrw * 5)}</dd>
                </div>
              </dl>
              <p className="mt-2 text-xs leading-4 text-rose-700/70">
                이행강제금은 위반을 시정할 때까지 매년 반복 부과됩니다. 누적액은 연 1회 부과를 가정한 단순 합계이며,
                실제는 부과 횟수·시가표준액 변동에 따라 달라집니다.
              </p>
            </div>

            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">위반유형</dt>
                <dd className="text-right font-medium">{resultViolationLabel}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">1㎡당 시가표준액</dt>
                <dd className="font-medium">{formatCurrency(result.result.standardPriceKrwPerM2)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">위반부분 시가표준액</dt>
                <dd className="font-medium">{formatCurrency(result.result.buildingStandardValueKrw)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-500">산정비율</dt>
                <dd className="font-medium">{formatRate(violationBasis?.violationRate)}</dd>
              </div>
            </dl>
            {result.result.warnings.length > 0 ? (
              <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                <div className="font-medium">확인 필요</div>
                <ul className="mt-2 space-y-1">
                  {result.result.warnings.slice(0, 4).map(item => <li key={item}>{item}</li>)}
                </ul>
              </div>
            ) : null}
            <Button
              type="button"
              className="mt-4 w-full"
              onClick={() => {
                if (result && preparedData) {
                  try {
                    const detailParts = [dongName.trim(), hoName.trim()].filter(Boolean);
                    window.sessionStorage.setItem(CALC_CONSULT_KEY, JSON.stringify({
                      address: selectedAddress,
                      addressDetail: detailParts.join(' '),
                      message: buildCalcConsultMessage(result, preparedData, resultViolationLabel)
                    }));
                  } catch {}
                }
                window.location.href = '/?consultation=open';
              }}
            >
              무료상담 신청하기
            </Button>
          </>
        ) : (
          <div className="mt-3 rounded-md bg-slate-50 px-3 py-4 text-sm text-slate-600">
            항목을 입력하고 계산하면 이 영역에 예상 금액이 표시됩니다.
          </div>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 text-left"
          onClick={() => setCriteriaOpen(open => !open)}
          aria-expanded={criteriaOpen}
        >
          <span className="text-sm font-semibold text-slate-950">계산 기준</span>
          {criteriaOpen ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
        </button>
        {criteriaOpen ? (
          <div className="mt-3 space-y-4 text-sm">
            <section>
              <h3 className="text-sm font-semibold text-slate-950">입력 요약</h3>
              <dl className="mt-2 space-y-2">
                {criteriaInputRows.map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-3">
                    <dt className="text-slate-500">{label}</dt>
                    <dd className="text-right font-medium text-slate-900">{value}</dd>
                  </div>
                ))}
              </dl>
            </section>

            {showInternalCalculationDetails ? (
              <>
                <section className="border-t border-slate-100 pt-4">
                  <h3 className="text-sm font-semibold text-slate-950">중간값</h3>
                  <dl className="mt-2 space-y-2">
                    {criteriaIntermediateRows.map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-3">
                        <dt className="text-slate-500">{label}</dt>
                        <dd className="text-right font-medium text-slate-900">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>

                {adjustmentItems.length > 0 ? (
                  <section className="border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-semibold text-slate-950">가감산 항목</h3>
                    <div className="mt-2 space-y-1">
                      {adjustmentItems.map((item: any) => (
                        <div key={item.code} className="flex justify-between gap-3 text-slate-800">
                          <span>{item.label}</span>
                          <span className="shrink-0 font-medium">{formatDecimal(item.rate)}</span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {specialConditionItems.length > 0 ? (
                  <section className="border-t border-slate-100 pt-4">
                    <h3 className="text-sm font-semibold text-slate-950">가중·감경·특례 항목</h3>
                    <div className="mt-2 space-y-1">
                      {specialConditionItems.map((item: any) => (
                        <div key={item.code} className="flex justify-between gap-3 text-slate-800">
                          <span>{item.label}</span>
                          <span className="shrink-0 font-medium">
                            {item.type === 'increase' ? `+${formatDecimal(item.rate)}` : `×${formatDecimal(item.multiplier)}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}
              </>
            ) : null}

            {showInternalCalculationDetails ? (
              <section className="border-t border-slate-100 pt-4">
                <h3 className="text-sm font-semibold text-slate-950">적용 수식</h3>
                <div className="mt-2 space-y-2 text-xs leading-5 text-slate-700">
                  <p>㎡당가액 = 구조지수 × 용도지수 × 위치지수 × 잔가율 × 가감산율 × 기준액</p>
                  <p>시가표준액 = ⌊⌊㎡당가액 × 위반면적 × 대수선비율⌋₁₀₀₀ × 기초시공계수⌋₁₀₀₀</p>
                  <p>이행강제금 = 시가표준액 × 위반사유요율 × 위반요율 × 가중 × 감경 × 특례</p>
                </div>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
