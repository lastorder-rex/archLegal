import { Button } from '@/components/ui/button';
import { BuildingInfoDisplay } from '../BuildingInfoDisplay';
import type { AddressSearchResult, BuildingSearchResult } from '@/lib/validations/consultation';

interface BuildingInfoSectionProps {
  selectedAddress: AddressSearchResult | null;
  buildingInfo: BuildingSearchResult | null;
  isBuildingLoading: boolean;
  errors: Record<string, string>;
  onOpenRoadview: (provider: 'kakao' | 'naver') => void;
}

export function BuildingInfoSection({
  selectedAddress,
  buildingInfo,
  isBuildingLoading,
  errors,
  onOpenRoadview
}: BuildingInfoSectionProps) {
  if (!selectedAddress) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">건축물 정보</h3>

      {isBuildingLoading ? (
        <div className="text-center py-8">
          <p className="text-muted-foreground">건축물 정보를 조회하고 있습니다...</p>
        </div>
      ) : buildingInfo ? (
        <BuildingInfoDisplay buildingInfo={buildingInfo} />
      ) : errors.building ? (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {errors.building}
        </div>
      ) : null}

      <div className="rounded-md border border-border bg-muted/30 p-4 space-y-3">
        <div className="space-y-1">
          <h4 className="text-sm font-medium">로드뷰 확인</h4>
          <p className="text-xs text-muted-foreground">
            카카오 지도에서 로드뷰를 열어 주변 현황을 확인할 수 있습니다.
          </p>
          {!buildingInfo && !isBuildingLoading && (
            <p className="text-xs text-muted-foreground">
              건축물 정보를 불러오지 못해도 선택한 주소 기준으로 로드뷰가 열립니다.
            </p>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <Button
            type="button"
            variant="outline"
            className="sm:w-auto"
            onClick={() => onOpenRoadview('kakao')}
          >
            카카오 로드뷰 열기
          </Button>
          <Button
            type="button"
            variant="outline"
            className="sm:w-auto"
            onClick={() => onOpenRoadview('naver')}
          >
            네이버 로드뷰 열기
          </Button>
        </div>
      </div>
    </div>
  );
}
