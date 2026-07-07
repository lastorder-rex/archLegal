'use client';

import { Calculator, ChevronDown, Info, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CURRENT_YEAR,
  VIOLATION_EXAMPLE_TIPS
} from '@/lib/enforcement-fine/calculator-constants';
import {
  formatDecimal,
  sanitizeAreaInput,
  sanitizeYearInput
} from '@/lib/enforcement-fine/calculator-helpers';
import type {
  useEnforcementFineCalculator,
  AreaUnit
} from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type Step4ViolationCardProps = Pick<
  Hook,
  | 'violationArea'
  | 'setViolationArea'
  | 'setResult'
  | 'areaUnit'
  | 'setAreaUnit'
  | 'violationCompletedYear'
  | 'setViolationCompletedYear'
  | 'violationExamplesOpen'
  | 'setViolationExamplesOpen'
  | 'selectedViolationLabel'
  | 'loadingTypes'
  | 'openViolationPicker'
  | 'violationPickerOpen'
  | 'isMajorRepairType'
  | 'majorRepairApprovalType'
  | 'setMajorRepairApprovalType'
  | 'majorRepairRoofReductionApplied'
  | 'setMajorRepairRoofReductionApplied'
  | 'aggravationId'
  | 'setAggravationId'
  | 'specialConditionOptions'
  | 'loadingSpecialConditions'
  | 'loadSpecialConditionOptions'
  | 'aggravationOptions'
  | 'mitigationId'
  | 'setMitigationId'
  | 'setAcquiredAfterViolation'
  | 'mitigationOptions'
  | 'residentialSpecialId'
  | 'setResidentialSpecialId'
  | 'residentialSpecialOptions'
  | 'isUseChangeType'
  | 'calculateFine'
  | 'canCalculate'
  | 'calculating'
  | 'setCurrentStep'
>;

export function Step4ViolationCard({
  violationArea,
  setViolationArea,
  setResult,
  areaUnit,
  setAreaUnit,
  violationCompletedYear,
  setViolationCompletedYear,
  violationExamplesOpen,
  setViolationExamplesOpen,
  selectedViolationLabel,
  loadingTypes,
  openViolationPicker,
  violationPickerOpen,
  isMajorRepairType,
  majorRepairApprovalType,
  setMajorRepairApprovalType,
  majorRepairRoofReductionApplied,
  setMajorRepairRoofReductionApplied,
  aggravationId,
  setAggravationId,
  specialConditionOptions,
  loadingSpecialConditions,
  loadSpecialConditionOptions,
  aggravationOptions,
  mitigationId,
  setMitigationId,
  setAcquiredAfterViolation,
  mitigationOptions,
  residentialSpecialId,
  setResidentialSpecialId,
  residentialSpecialOptions,
  isUseChangeType,
  calculateFine,
  canCalculate,
  calculating,
  setCurrentStep
}: Step4ViolationCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Calculator className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-950">④ 위반 내용</h2>
      </div>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px_minmax(0,1fr)]">
          <div className="space-y-2">
            <Label htmlFor="wizard-area" required>위반면적</Label>
            <Input
              id="wizard-area"
              type="number"
              min="0"
              max="99999.99"
              step="0.01"
              inputMode="decimal"
              value={violationArea}
              onChange={event => {
                setViolationArea(sanitizeAreaInput(event.target.value));
                setResult(null);
              }}
              placeholder="예: 4"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-area-unit">단위</Label>
            <select
              id="wizard-area-unit"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={areaUnit}
              onChange={event => {
                setAreaUnit(event.target.value as AreaUnit);
                setResult(null);
              }}
            >
              <option value="pyeong">평</option>
              <option value="m2">㎡</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-year">위반완료연도</Label>
            <Input
              id="wizard-year"
              type="text"
              inputMode="numeric"
              min="1900"
              max={CURRENT_YEAR}
              maxLength={4}
              value={violationCompletedYear}
              onChange={event => {
                setViolationCompletedYear(sanitizeYearInput(event.target.value));
                setResult(null);
              }}
              placeholder="예: 2019"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Label htmlFor="wizard-violation-type" required>위반유형</Label>
            <button
              type="button"
              className="inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-600 transition hover:border-primary/40 hover:text-primary"
              aria-expanded={violationExamplesOpen}
              onClick={() => setViolationExamplesOpen(open => !open)}
            >
              <Info className="h-3.5 w-3.5" />
              대표 위반사례
            </button>
          </div>
          <button
            id="wizard-violation-type"
            type="button"
            className="flex min-h-11 w-full items-center justify-between gap-3 rounded-md border border-input bg-background px-3 py-2 text-left text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-40"
            onClick={openViolationPicker}
            aria-haspopup="dialog"
            aria-expanded={violationPickerOpen}
          >
            <span className={selectedViolationLabel ? 'leading-5 text-slate-950' : 'text-slate-500'}>
              {selectedViolationLabel || (loadingTypes ? '위반유형 불러오는 중' : '위반유형 선택')}
            </span>
            {loadingTypes ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 shrink-0 text-slate-500" />
            )}
          </button>
          {violationExamplesOpen ? (
            <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-950">
              <div className="font-semibold">대표 위반사례 보기</div>
              <p className="mt-1 text-xs leading-5 text-blue-900">
                위반건축물은 하나의 행위가 여러 위반사유에 동시에 해당할 수 있습니다. 아래 사례를 보고 가장 가까운 위반사유를 선택하세요.
              </p>
              <div className="mt-3 grid gap-2">
                {VIOLATION_EXAMPLE_TIPS.map(item => (
                  <div key={item.title} className="rounded-md bg-white px-3 py-2">
                    <div className="font-medium text-slate-950">{item.title}</div>
                    <p className="mt-1 text-xs leading-5 text-slate-600">{item.description}</p>
                    <div className="mt-1 text-xs font-medium leading-5 text-primary">선택 후보: {item.mapsTo}</div>
                  </div>
                ))}
              </div>
              <div className="mt-3 rounded-md bg-white px-3 py-2 text-xs font-medium leading-5 text-slate-700">
                판단 기준: 면적이 늘었으면 증축, 사용 목적이 바뀌었으면 용도변경, 벽·계단·구조·구획을 바꿨으면 대수선 가능성이 큽니다.
              </div>
            </div>
          ) : null}
        </div>

        {isMajorRepairType ? (
          <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
            <div className="text-sm font-semibold text-slate-950">대수선 대상 구분</div>
            <p className="mt-1 mb-3 text-xs leading-5 text-slate-600">
              실제 허가·신고 여부가 아니라, 해당 대수선 행위가 원래 허가 대상인지 신고 대상인지 선택하세요.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="wizard-major-repair-type"
                  value="permit"
                  checked={majorRepairApprovalType === 'permit'}
                  onChange={() => {
                    setMajorRepairApprovalType('permit');
                    setResult(null);
                  }}
                />
                허가 대상
              </label>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="radio"
                  name="wizard-major-repair-type"
                  value="report"
                  checked={majorRepairApprovalType === 'report'}
                  onChange={() => {
                    setMajorRepairApprovalType('report');
                    setResult(null);
                  }}
                />
                신고 대상
              </label>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={majorRepairRoofReductionApplied}
                onChange={event => {
                  setMajorRepairRoofReductionApplied(event.target.checked);
                  setResult(null);
                }}
              />
              노후 건축물 지붕 수선 또는 덮개 추가
            </label>
          </div>
        ) : null}

        <div className="grid gap-4">
          <div className="space-y-2">
            <Label htmlFor="wizard-aggravation">가중 부과</Label>
            <select
              id="wizard-aggravation"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={aggravationId}
              onFocus={() => {
                if (specialConditionOptions.length === 0 && !loadingSpecialConditions) void loadSpecialConditionOptions();
              }}
              onChange={event => {
                setAggravationId(event.target.value);
                setResult(null);
              }}
            >
              <option value="">해당없음</option>
              {loadingSpecialConditions && aggravationOptions.length === 0 ? (
                <option value="" disabled>가중 부과 항목 불러오는 중</option>
              ) : null}
              {aggravationOptions.map(option => (
                <option key={option.code} value={option.code}>
                  {option.label} · ×{formatDecimal(option.multiplier)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-mitigation">감경 부과</Label>
            <select
              id="wizard-mitigation"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={mitigationId}
              onFocus={() => {
                if (specialConditionOptions.length === 0 && !loadingSpecialConditions) void loadSpecialConditionOptions();
              }}
              onChange={event => {
                setMitigationId(event.target.value);
                setAcquiredAfterViolation(event.target.value === 'acquired_after_violation');
                setResult(null);
              }}
            >
              <option value="">해당없음</option>
              {loadingSpecialConditions && mitigationOptions.length === 0 ? (
                <option value="" disabled>감경 부과 항목 불러오는 중</option>
              ) : null}
              {mitigationOptions.map(option => (
                <option key={option.code} value={option.code}>
                  {option.label} · ×{formatDecimal(option.multiplier)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-special">주거용 특례</Label>
            <select
              id="wizard-special"
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={residentialSpecialId}
              onFocus={() => {
                if (specialConditionOptions.length === 0 && !loadingSpecialConditions) void loadSpecialConditionOptions();
              }}
              onChange={event => {
                setResidentialSpecialId(event.target.value);
                setResult(null);
              }}
            >
              <option value="">해당없음</option>
              {loadingSpecialConditions && residentialSpecialOptions.length === 0 ? (
                <option value="" disabled>주거용 특례 항목 불러오는 중</option>
              ) : null}
              {residentialSpecialOptions.map(option => (
                <option key={option.code} value={option.code}>
                  {option.label} · ×{formatDecimal(option.multiplier)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isUseChangeType ? (
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-3 text-sm text-blue-900">
            무단 용도변경은 ② 건물 정보에서 선택한 세부용도를 실제 사용 또는 변경 후 용도로 적용합니다.
          </div>
        ) : null}

        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(3)}>이전</Button>
          <Button type="button" className="gap-2" onClick={calculateFine} disabled={!canCalculate}>
            {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
            계산하기
          </Button>
        </div>
      </div>
    </div>
  );
}
