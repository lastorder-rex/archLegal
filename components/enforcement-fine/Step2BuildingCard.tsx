'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatDecimal, getUseCategorySelectionKey } from '@/lib/enforcement-fine/calculator-helpers';
import type {
  useEnforcementFineCalculator,
  UseOption
} from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

function formatUseOptionLabel(item: UseOption) {
  return item.detailUse || item.mainUse;
}

type Step2BuildingCardProps = Pick<
  Hook,
  | 'selectedUnit'
  | 'building'
  | 'violationStructureIndexId'
  | 'setViolationStructureIndexId'
  | 'setResult'
  | 'structureOptions'
  | 'loadingStructures'
  | 'loadStructureOptions'
  | 'displayedUseCategoryKey'
  | 'setViolationUseCategoryKey'
  | 'setUseCategoryManuallyChanged'
  | 'setViolationUseIndexId'
  | 'useOptions'
  | 'loadingUses'
  | 'loadUseOptions'
  | 'displayedUseIndexId'
  | 'reference'
  | 'filteredUseOptionGroups'
  | 'selectedUseOption'
  | 'canContinueBuildingInfo'
  | 'setCurrentStep'
> & {
  preparedData: NonNullable<Hook['preparedData']>;
};

export function Step2BuildingCard({
  preparedData,
  selectedUnit,
  building,
  violationStructureIndexId,
  setViolationStructureIndexId,
  setResult,
  structureOptions,
  loadingStructures,
  loadStructureOptions,
  displayedUseCategoryKey,
  setViolationUseCategoryKey,
  setUseCategoryManuallyChanged,
  setViolationUseIndexId,
  useOptions,
  loadingUses,
  loadUseOptions,
  displayedUseIndexId,
  reference,
  filteredUseOptionGroups,
  selectedUseOption,
  canContinueBuildingInfo,
  setCurrentStep
}: Step2BuildingCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-950">② 건물 정보</h2>
        {/* <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">자동값 수정 가능</span> */}
      </div>
      <div className="grid gap-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-slate-500">대장상 구조</dt>
            <dd className="mt-1 text-sm font-medium text-slate-950">{selectedUnit?.structure || building?.structure || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm text-slate-500">대장상 용도</dt>
            <dd className="mt-1 text-sm font-medium text-slate-950">
              {selectedUnit?.detailUse || building?.detailUse || building?.mainUse || '-'}
            </dd>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wizard-structure" required>구조</Label>
          <select
            id="wizard-structure"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={violationStructureIndexId || preparedData.reference?.structure?.id || ''}
            onFocus={() => {
              if (structureOptions.length === 0 && !loadingStructures) void loadStructureOptions();
            }}
            onChange={event => {
              setViolationStructureIndexId(event.target.value);
              setResult(null);
            }}
          >
            {structureOptions.length === 0 ? (
              <option value={preparedData.reference?.structure?.id || ''}>
                {preparedData.reference?.structure?.name || '구조 불러오기'}
              </option>
            ) : (
              structureOptions.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name} · 구조지수 {formatDecimal(item.index)} · 내용연수 {item.usefulLifeYears}년
                </option>
              ))
            )}
          </select>
          <p className="text-xs text-slate-500">주소 조회 결과가 있으면 자동 선택되며, 실제 위반 부분 구조가 다르면 수정하세요.</p>
        </div>
        <div className="space-y-2">
          <Label required>용도 대분류</Label>
          <div className="grid grid-cols-3 gap-1.5">
            {([
              { key: 'I', label: '주거용' },
              { key: 'II', label: '상업용' },
              { key: 'other', label: '기타' }
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`h-9 rounded-md border text-sm font-medium transition-colors ${
                  displayedUseCategoryKey === key
                    ? 'border-primary bg-primary text-white'
                    : 'border-input bg-background text-slate-700 hover:bg-slate-50'
                }`}
                onClick={() => {
                  setViolationUseCategoryKey(key);
                  setUseCategoryManuallyChanged(true);
                  setViolationUseIndexId('');
                  setResult(null);
                  if (useOptions.length === 0 && !loadingUses) void loadUseOptions();
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="wizard-use" required>세부용도</Label>
          <select
            id="wizard-use"
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={displayedUseIndexId}
            onFocus={() => {
              if (useOptions.length === 0 && !loadingUses) void loadUseOptions();
            }}
            onChange={event => {
              const nextUseId = event.target.value;
              const nextUse = useOptions.find(item => item.id === nextUseId);
              setViolationUseIndexId(nextUseId);
              if (nextUse) {
                setViolationUseCategoryKey(getUseCategorySelectionKey(nextUse.categoryCode));
              }
              setUseCategoryManuallyChanged(true);
              setResult(null);
            }}
          >
            <option value="">
              {loadingUses ? '불러오는 중…' : '세부용도 선택'}
            </option>
            {reference?.use?.id && !useOptions.some(item => item.id === reference.use.id) ? (
              <option value={reference.use.id}>
                {reference.use.detailUse || reference.use.mainUse}
              </option>
            ) : null}
            {filteredUseOptionGroups.map(([groupLabel, items]) => (
              <optgroup key={groupLabel} label={groupLabel}>
                {items.map(item => (
                  <option key={item.id} value={item.id}>
                    {formatUseOptionLabel(item)}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <p className="text-xs text-slate-500">
            선택 용도: {selectedUseOption ? formatUseOptionLabel(selectedUseOption) : (reference?.use?.detailUse || reference?.use?.mainUse || '자동 매칭 전')}
          </p>
        </div>
        <div className="flex justify-between gap-2">
          <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>이전</Button>
          <Button type="button" onClick={() => setCurrentStep(3)} disabled={!canContinueBuildingInfo}>다음</Button>
        </div>
      </div>
    </div>
  );
}
