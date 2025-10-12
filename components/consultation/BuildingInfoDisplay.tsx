'use client';

import type { BuildingSearchResult } from '@/lib/validations/consultation';

interface BuildingInfoDisplayProps {
  buildingInfo: BuildingSearchResult;
}

export function BuildingInfoDisplay({ buildingInfo }: BuildingInfoDisplayProps) {
  const { building, summary } = buildingInfo;

  // Format area values
  const formatArea = (area: number | null): string => {
    if (area === null || area === undefined) return '정보없음';
    return `${area.toLocaleString()}㎡`;
  };

  // Format floor count
  const formatFloors = (count: number | null): string => {
    if (count === null || count === undefined) return '정보없음';
    return `${count}층`;
  };

  // Format household count
  const formatHouseholds = (count: number | null): string => {
    if (count === null || count === undefined) return '정보없음';
    return `${count}세대`;
  };

  const displayPurpose = summary.secondaryUse || summary.mainPurpose;

  return (
    <div className="space-y-4">
      {/* Main Building Summary */}
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <h4 className="font-semibold text-primary mb-3">건축물 기본 정보</h4>
        <div className="space-y-3 text-sm">
          <div className="flex flex-col gap-1">
            <span className="text-muted-foreground">주용도</span>
            <span className="font-medium leading-relaxed break-words">{displayPurpose}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">연면적:</span>
              <span className="font-medium">{formatArea(summary.totalArea)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">대지면적:</span>
              <span className="font-medium">{formatArea(summary.plotArea)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">지상층수:</span>
              <span className="font-medium">{formatFloors(summary.floors.ground)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="space-y-3">
        <h4 className="font-semibold">상세 정보</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {summary.floors.underground !== null && summary.floors.underground > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">지하층수:</span>
              <span>{formatFloors(summary.floors.underground)}</span>
            </div>
          )}

          {summary.households !== null && summary.households > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">세대수:</span>
              <span>{formatHouseholds(summary.households)}</span>
            </div>
          )}

          {building.fmlyNum !== null && building.fmlyNum !== undefined && building.fmlyNum > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">가구수:</span>
              <span>{building.fmlyNum}가구</span>
            </div>
          )}

          {building.mainBldCnt !== null && building.mainBldCnt !== undefined && building.mainBldCnt > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">주건축물수:</span>
              <span>{building.mainBldCnt}동</span>
            </div>
          )}

          {building.atchBldCnt !== null && building.atchBldCnt !== undefined && building.atchBldCnt > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">부속건축물수:</span>
              <span>{building.atchBldCnt}동</span>
            </div>
          )}
        </div>

      </div>

      {/* Building Code Information (for debugging) */}
      {process.env.NODE_ENV === 'development' && building.addressInfo && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground">
            개발자 정보 (주소 코드)
          </summary>
          <div className="mt-2 bg-muted p-2 rounded text-muted-foreground">
            <pre>{JSON.stringify(building.addressInfo, null, 2)}</pre>
          </div>
        </details>
      )}
    </div>
  );
}
