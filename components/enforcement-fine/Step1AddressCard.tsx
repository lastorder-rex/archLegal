'use client';

import { Loader2, MapPin, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { useEnforcementFineCalculator } from '@/components/enforcement-fine/useEnforcementFineCalculator';

type Hook = ReturnType<typeof useEnforcementFineCalculator>;

type Step1AddressCardProps = Pick<
  Hook,
  | 'address'
  | 'selectedAddress'
  | 'dongName'
  | 'setDongName'
  | 'hoName'
  | 'setHoName'
  | 'session'
  | 'clearPreparedCalculation'
  | 'requireLogin'
  | 'openAddressSearch'
  | 'prepareBuilding'
  | 'canPrepare'
  | 'preparing'
  | 'preparedData'
  | 'setCurrentStep'
>;

export function Step1AddressCard({
  address,
  selectedAddress,
  dongName,
  setDongName,
  hoName,
  setHoName,
  session,
  clearPreparedCalculation,
  requireLogin,
  openAddressSearch,
  prepareBuilding,
  canPrepare,
  preparing,
  preparedData,
  setCurrentStep
}: Step1AddressCardProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <MapPin className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold text-slate-950">① 주소/공시지가</h2>
      </div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label htmlFor="wizard-address" required>주소</Label>
          <div className="grid grid-cols-[minmax(0,1fr)_96px] gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
            <Input
              id="wizard-address"
              value={address}
              readOnly
              placeholder="주소 검색 버튼을 클릭해주세요"
              className={!selectedAddress ? 'border-amber-200 bg-amber-50' : ''}
            />
            <Button type="button" variant="outline" className="gap-2" onClick={openAddressSearch}>
              <Search className="h-4 w-4" />
              검색
            </Button>
          </div>
          {selectedAddress ? (
            <div className="grid gap-1 text-xs text-slate-500">
              <span>지번: {selectedAddress.jibunAddr}</span>
              {selectedAddress.buildingName ? <span>건물명: {selectedAddress.buildingName}</span> : null}
            </div>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="wizard-dong">동</Label>
            <Input
              id="wizard-dong"
              value={dongName}
              onChange={event => {
                setDongName(event.target.value);
                clearPreparedCalculation();
              }}
              placeholder="예: B동"
              disabled={!session?.user}
              onFocus={() => {
                if (!session?.user) requireLogin();
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wizard-ho">호수</Label>
            <Input
              id="wizard-ho"
              value={hoName}
              onChange={event => {
                setHoName(event.target.value);
                clearPreparedCalculation();
              }}
              placeholder="예: 501호"
              disabled={!session?.user}
              onFocus={() => {
                if (!session?.user) requireLogin();
              }}
            />
          </div>
        </div>
        {/* {preparedData ? (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-900">
            공시지가·구조·용도 기준을 자동 조회했습니다. 다음 단계에서 직접 수정할 수 있습니다.
          </div>
        ) : null} */}
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" className="gap-2 sm:w-auto" onClick={prepareBuilding} disabled={!canPrepare}>
            {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {preparedData ? '다시 조회' : '조회하고 다음'}
          </Button>
          {preparedData ? (
            <Button type="button" variant="outline" className="sm:w-auto" onClick={() => setCurrentStep(2)}>
              다음
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
