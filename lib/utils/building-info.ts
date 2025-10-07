import type { AddressCode, BuildingInfo } from '@/lib/validations/consultation';

/**
 * 건축물 정보 조회 실패 시 사용할 fallback 정보 생성
 *
 * @param address - 도로명 주소
 * @param addressCode - 주소 코드 정보
 * @returns 기본 건축물 정보 객체
 */
export function createFallbackBuildingInfo(
  address: string,
  addressCode: AddressCode
): BuildingInfo {
  return {
    mainPurpsCdNm: '확인 필요',
    totArea: null,
    platArea: null,
    groundFloorCnt: null,
    ugrndFloorCnt: null,
    hhldCnt: null,
    fmlyNum: null,
    mainBldCnt: null,
    atchBldCnt: null,
    platPlc: null,
    addressInfo: {
      ...addressCode,
    },
    rawData: {
      status: 'UNAVAILABLE' as const,
      address,
    },
  };
}
