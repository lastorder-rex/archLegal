'use client';

import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import {
  AlertCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  MapPin,
  RotateCcw,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoginModal } from '@/components/landing/LoginModal';
import { AddressSearchModal } from '@/components/consultation/AddressSearchModal';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import type { AddressSearchResult } from '@/lib/validations/consultation';

declare global {
  interface Window {
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share?: {
        sendDefault: (template: {
          objectType: 'feed';
          content: {
            title: string;
            description: string;
            imageUrl: string;
            imageWidth: number;
            imageHeight: number;
            link: { mobileWebUrl: string; webUrl: string };
          };
          buttons: Array<{
            title: string;
            link: { mobileWebUrl: string; webUrl: string };
          }>;
        }) => void;
      };
    };
  }
}

const KAKAO_JAVASCRIPT_KEY = process.env.NEXT_PUBLIC_KAKAO_JAVASCRIPT_KEY;
const CALC_SHARE_ORIGIN = 'https://www.archlegal.co.kr';
const CALC_SHARE_IMAGE_URL = 'https://rylclvdntoelktrameow.supabase.co/storage/v1/object/public/docu/kakao_c.png';

type ViolationType = {
  code: string;
  label: string;
  formulaType: string;
  baseFineRate: number | null;
  violationRate: number;
  requiresLocalOrdinance: boolean;
  requiresUserConfirmation: boolean;
  description?: string | null;
};

type PreparedData = Record<string, any>;

type StructureOption = {
  id: string;
  structureNo: number;
  name: string;
  index: number;
  usefulLifeYears: number;
};

type UseOption = {
  id: string;
  categoryCode: string;
  categoryName: string;
  mainUse: string;
  useNo: string;
  detailUse: string;
  index: number;
};

type CalculateResult = {
  estimateId: string;
  result: {
    estimatedFineKrw: number;
    estimatedFineMinKrw: number;
    estimatedFineMaxKrw: number;
    standardPriceKrwPerM2: number;
    buildingStandardValueKrw: number;
    formulaType: string;
    violationLabel: string;
    warnings: string[];
  };
  calculationBasis: Record<string, any>;
};

type AreaUnit = 'm2' | 'pyeong';
type ManualAdjustmentKey =
  | ''
  | 'commercial_1f'
  | 'commercial_2f'
  | 'commercial_basement_1f'
  | 'commercial_basement_2f_lower'
  | 'commercial_5f_plus'
  | 'parking_lot_2f_plus'
  | 'residential_garage'
  | 'no_wall_25_to_50_percent'
  | 'no_wall_50_to_75_percent'
  | 'no_wall_75_plus_percent'
  | 'steel_structure_wall_material'
  | 'container_temp_under_30m2';

const CURRENT_YEAR = new Date().getFullYear();
const COMMON_VIOLATION_STRUCTURE_NAMES = [
  '철근콘크리트조',
  '철골조',
  '경량철골조',
  '조립식패널조',
  '시멘트벽돌조',
  '시멘트블록조',
  '보강블록조',
  '목조',
  '컨테이너',
  '철파이프조',
  '철파이프건물(강파이프천막등)'
];

const MANUAL_ADJUSTMENT_OPTIONS: Array<{ value: ManualAdjustmentKey; label: string }> = [
  { value: '', label: '해당 없음' },
  { value: 'commercial_1f', label: '1층 상가부분' },
  { value: 'commercial_2f', label: '2층 상가부분' },
  { value: 'commercial_basement_1f', label: '지하1층 상가부분' },
  { value: 'commercial_basement_2f_lower', label: '지하2층 이하 상가부분' },
  { value: 'commercial_5f_plus', label: '5층 이상 상가부분' },
  { value: 'parking_lot_2f_plus', label: '2층 이상 주차장' },
  { value: 'residential_garage', label: '주택 차고' },
  { value: 'no_wall_25_to_50_percent', label: '무벽 1/4 이상 2/4 미만' },
  { value: 'no_wall_50_to_75_percent', label: '무벽 2/4 이상 3/4 미만' },
  { value: 'no_wall_75_plus_percent', label: '무벽 3/4 이상' },
  { value: 'steel_structure_wall_material', label: '철골조 벽면 특례' },
  { value: 'container_temp_under_30m2', label: '컨테이너 30㎡ 이하' }
];

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatArea(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Number(value.toFixed(2)).toLocaleString('ko-KR')}㎡`;
}

function formatRate(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Number((value * 100).toFixed(1)).toLocaleString('ko-KR')}%`;
}

function formatDecimal(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return Number(value.toFixed(4)).toLocaleString('ko-KR');
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getExtensionConstructionLabel(value: string) {
  if (value === 'with_foundation') return '기초공사 있음';
  if (value === 'without_foundation_multilevel') return '기초 없음 + 복층';
  return '기초공사 없음';
}

function getManualAdjustmentCodes(value: ManualAdjustmentKey, groundFloorCount: number | null | undefined) {
  const floors = Number(groundFloorCount || 0);

  if (!value) return [];
  if (value === 'commercial_1f') {
    if (floors < 5) return ['commercial_1f_under_5_floors'];
    if (floors <= 10) return ['commercial_1f_5_to_10_floors'];
    if (floors <= 20) return ['commercial_1f_11_to_20_floors'];
    if (floors <= 30) return ['commercial_1f_21_to_30_floors'];
    return ['commercial_1f_over_30_floors'];
  }
  if (value === 'commercial_2f') {
    if (floors >= 11 && floors <= 20) return ['commercial_2f_11_to_20_floors'];
    if (floors >= 21 && floors <= 30) return ['commercial_2f_21_to_30_floors'];
    if (floors > 30) return ['commercial_2f_over_30_floors'];
    return [];
  }
  if (value === 'commercial_basement_1f') {
    return [floors > 10 ? 'commercial_basement_1_over_10_floors' : 'commercial_basement_1_under_10_floors'];
  }
  if (value === 'commercial_basement_2f_lower') return ['commercial_basement_2_or_lower'];
  if (value === 'commercial_5f_plus') {
    if (floors >= 5 && floors <= 10) return ['commercial_5f_plus_5_to_10_floors'];
    if (floors >= 11 && floors <= 20) return ['commercial_5f_plus_11_to_20_floors'];
    if (floors >= 21 && floors <= 30) return ['commercial_5f_plus_21_to_30_floors'];
    if (floors > 30) return ['commercial_5f_plus_over_30_floors'];
    return [];
  }
  return [value];
}

const CALC_CONSULT_KEY = 'calc_consultation_prefill';

function buildCalcConsultMessage(result: CalculateResult, preparedData: PreparedData): string {
  const r = result.result;
  const sp = result.calculationBasis?.standardPrice;
  const ref = preparedData?.reference;
  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const lines: string[] = [
    '이행강제금 계산기로 예상 금액을 확인하고 양성화 절차 상담을 요청드립니다.',
    '',
    '[계산 결과]',
    `위반유형: ${r.violationLabel}`,
  ];

  const areaM2 = result.calculationBasis?.area?.violationAreaM2;
  if (areaM2) lines.push(`위반면적: ${Number(areaM2).toLocaleString('ko-KR', { maximumFractionDigits: 2 })}㎡`);

  lines.push(`예상 이행강제금: ${fmt(r.estimatedFineKrw)}원`);

  const hasRange = r.estimatedFineMinKrw !== r.estimatedFineKrw || r.estimatedFineMaxKrw !== r.estimatedFineKrw;
  if (hasRange) {
    lines.push(`예상범위: ${fmt(r.estimatedFineMinKrw)}원 ~ ${fmt(r.estimatedFineMaxKrw)}원`);
  }

  lines.push('', '[산정 기준]');

  const structureName = sp?.structureName || ref?.structure?.name;
  const structureIndex = sp?.structureIndex ?? ref?.structure?.index;
  if (structureName) lines.push(`구조: ${structureName} (${structureIndex})`);

  const useName = sp?.useName || ref?.use?.detailUse || ref?.use?.mainUse;
  const useIndex = sp?.useIndex ?? ref?.use?.index;
  if (useName) lines.push(`용도: ${useName} (${useIndex})`);

  if (sp?.locationIndex != null) lines.push(`위치지수: ${sp.locationIndex}`);
  if (sp?.depreciationRate != null) lines.push(`잔가율: ${sp.depreciationRate}`);
  if (sp?.adjustmentRate != null && sp.adjustmentRate !== 1) lines.push(`가감산계수: ${sp.adjustmentRate}`);

  lines.push('', '이행강제금 납부 및 양성화 절차 전반에 대해 상담 부탁드립니다.');

  return lines.join('\n').slice(0, 1000);
}

function formatUseOptionLabel(item: UseOption) {
  return `${item.categoryName} · ${item.mainUse} · ${item.detailUse} (${formatDecimal(item.index)})`;
}

function abbreviateDetailUse(detail: string): string {
  if (detail.length <= 22) return detail;
  const colonIdx = detail.indexOf(' : ');
  if (colonIdx > 0 && colonIdx <= 18) return detail.slice(0, colonIdx);
  const commaIdx = detail.indexOf(',');
  if (commaIdx > 0 && commaIdx <= 18) return detail.slice(0, commaIdx).trim() + ' 등';
  const parenIdx = detail.indexOf('(');
  if (parenIdx > 2 && parenIdx <= 16) return detail.slice(0, parenIdx).trim() + ' 등';
  return detail.slice(0, 20).trim() + '…';
}

function formatUseOptionLabelShort(item: UseOption) {
  return `${abbreviateDetailUse(item.detailUse)} (${formatDecimal(item.index)})`;
}

function sanitizeAreaInput(value: string) {
  const cleaned = value.replace(/[^\d.]/g, '');
  const [integerPart, ...decimalParts] = cleaned.split('.');
  const limitedIntegerPart = integerPart.slice(0, 5);
  const decimalPart = decimalParts.join('').slice(0, 2);

  if (cleaned.startsWith('.')) {
    return decimalPart ? `0.${decimalPart}` : '0.';
  }
  if (decimalParts.length > 0) {
    return `${limitedIntegerPart}.${decimalPart}`;
  }
  return limitedIntegerPart;
}

function sanitizeYearInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

async function parseJsonResponse<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof json?.error === 'string' ? json.error : '요청 처리 중 오류가 발생했습니다.';
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return json as T;
}

export function EnforcementFineCalculatorClient() {
  const session = useSession();
  const resultCardRef = useRef<HTMLDivElement | null>(null);
  const [address, setAddress] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<AddressSearchResult | null>(null);
  const [dongName, setDongName] = useState('');
  const [hoName, setHoName] = useState('');
  const [areaUnit, setAreaUnit] = useState<AreaUnit>('m2');
  const [violationArea, setViolationArea] = useState('');
  const [violationType, setViolationType] = useState('');
  const [violationCompletedYear, setViolationCompletedYear] = useState('');
  const [violationStructureIndexId, setViolationStructureIndexId] = useState('');
  const [violationUseIndexId, setViolationUseIndexId] = useState('');
  const [violationUseCategoryKey, setViolationUseCategoryKey] = useState<'I' | 'II' | 'other' | ''>('');
  const [extensionConstructionType, setExtensionConstructionType] = useState('without_foundation');
  const [majorRepairApprovalType, setMajorRepairApprovalType] = useState('report');
  const [majorRepairRoofReductionApplied, setMajorRepairRoofReductionApplied] = useState(false);
  const [manualAdjustmentKey, setManualAdjustmentKey] = useState<ManualAdjustmentKey>('');
  const [acquiredAfterViolation, setAcquiredAfterViolation] = useState(false);
  const [forProfitPurpose, setForProfitPurpose] = useState(false);
  const [repeatedViolation, setRepeatedViolation] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [structureOptions, setStructureOptions] = useState<StructureOption[]>([]);
  const [useOptions, setUseOptions] = useState<UseOption[]>([]);
  const [preparedData, setPreparedData] = useState<PreparedData | null>(null);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [loadingUses, setLoadingUses] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [shareToast, setShareToast] = useState('');

  useEffect(() => {
    if (!shareToast) return;
    const timer = window.setTimeout(() => setShareToast(''), 3000);
    return () => window.clearTimeout(timer);
  }, [shareToast]);

  const initializeKakaoSdk = () => {
    if (!KAKAO_JAVASCRIPT_KEY || !window.Kakao || window.Kakao.isInitialized()) return;
    window.Kakao.init(KAKAO_JAVASCRIPT_KEY);
  };

  const fallbackShareCalcLink = async (shareUrl: string) => {
    if (navigator.share) {
      await navigator.share({ title: '이행강제금 계산기', url: shareUrl });
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setShareToast('링크가 복사되었습니다.');
  };

  const shareCalcLink = async () => {
    const shareUrl = `${CALC_SHARE_ORIGIN}/calc`;

    try {
      initializeKakaoSdk();

      if (window.Kakao?.Share && window.Kakao.isInitialized()) {
        window.Kakao.Share.sendDefault({
          objectType: 'feed',
          content: {
            title: '이행강제금 계산기',
            description: '위반건축물 이행강제금을 공식 기준으로 직접 계산해보세요.',
            imageUrl: CALC_SHARE_IMAGE_URL,
            imageWidth: 800,
            imageHeight: 800,
            link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
          },
          buttons: [
            {
              title: '계산기 바로가기',
              link: { mobileWebUrl: shareUrl, webUrl: shareUrl }
            }
          ]
        });
        return;
      }

      await fallbackShareCalcLink(shareUrl);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      try {
        await fallbackShareCalcLink(shareUrl);
      } catch {
        setShareToast('공유를 지원하지 않는 브라우저입니다. 주소창의 링크를 복사해주세요.');
      }
    }
  };

  const building = preparedData?.building;
  const selectedUnit = preparedData?.selectedUnit;
  const reference = preparedData?.reference;

  const selectedViolationType = useMemo(
    () => violationTypes.find(item => item.code === violationType) || null,
    [violationType, violationTypes]
  );
  const selectedStructureOption = useMemo(
    () => structureOptions.find(item => item.id === violationStructureIndexId) || null,
    [structureOptions, violationStructureIndexId]
  );
  const visibleStructureOptions = useMemo(() => {
    const commonOptions = COMMON_VIOLATION_STRUCTURE_NAMES
      .map(name => structureOptions.find(item => item.name === name))
      .filter((item): item is StructureOption => Boolean(item));
    const selectedOption = structureOptions.find(item => item.id === violationStructureIndexId);
    const merged = selectedOption
      ? [selectedOption, ...commonOptions]
      : commonOptions;
    return Array.from(new Map(merged.map(item => [item.id, item])).values());
  }, [structureOptions, violationStructureIndexId]);
  const isExtensionType = selectedViolationType?.formulaType === 'extension_area';
  const isMajorRepairType = selectedViolationType?.code === 'unauthorized_major_repair';
  const isUseChangeType = selectedViolationType?.code === 'unauthorized_use_change';
  const calculationBasis = result?.calculationBasis;
  const standardBasis = calculationBasis?.standardPrice;
  const violationBasis = calculationBasis?.violation;
  const yearsBasis = calculationBasis?.years;
  const specialConditionItems = calculationBasis?.specialConditions?.items || [];
  const adjustmentItems = calculationBasis?.adjustments || [];
  const hasEstimatedRange = Boolean(
    result &&
    (
      result.result.estimatedFineMinKrw !== result.result.estimatedFineKrw ||
      result.result.estimatedFineMaxKrw !== result.result.estimatedFineKrw
    )
  );

  useEffect(() => {
    if (!result || typeof window === 'undefined' || window.innerWidth >= 1024) return;

    window.requestAnimationFrame(() => {
      resultCardRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    });
  }, [result]);

  const areaNumber = Number(violationArea);
  const appliedAdjustmentCodes = useMemo(() => (
    new Set(
      ((preparedData?.adjustmentCandidates?.applied || []) as Array<{ code?: string }>)
        .map(item => item.code)
        .filter((code): code is string => Boolean(code))
    )
  ), [preparedData]);
  const manualAdjustmentCodes = useMemo(() => (
    getManualAdjustmentCodes(manualAdjustmentKey, building?.groundFloorCount)
      .filter(code => !appliedAdjustmentCodes.has(code))
  ), [appliedAdjustmentCodes, building?.groundFloorCount, manualAdjustmentKey]);
  const filteredUseOptionGroups = useMemo(() => {
    if (!violationUseCategoryKey) return [];
    const filtered = violationUseCategoryKey === 'other'
      ? useOptions.filter(item => item.categoryCode !== 'I' && item.categoryCode !== 'II')
      : useOptions.filter(item => item.categoryCode === violationUseCategoryKey);
    const map = new Map<string, UseOption[]>();
    filtered.forEach(item => {
      const key = violationUseCategoryKey === 'other'
        ? `${item.categoryName} · ${item.mainUse}`
        : item.mainUse;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [useOptions, violationUseCategoryKey]);

  const shouldShowManualAdjustmentSelector = Boolean(preparedData && !selectedUnit);
  const canPrepare = address.trim().length >= 2 && !preparing;
  const canCalculate =
    Boolean(preparedData) &&
    Boolean(violationType) &&
    Number.isFinite(areaNumber) &&
    areaNumber > 0 &&
    Boolean(violationStructureIndexId || preparedData?.reference?.structure?.id) &&
    (!isUseChangeType || Boolean(violationUseIndexId)) &&
    !calculating;

  const requireLogin = () => {
    if (session?.user) return false;
    setErrorMessage('');
    setLoginOpen(true);
    return true;
  };

  const resetViolationInputs = (nextStructureIndexId = '') => {
    setResult(null);
    setViolationArea('');
    setViolationCompletedYear('');
    setViolationStructureIndexId(nextStructureIndexId);
    setViolationUseIndexId('');
    setViolationUseCategoryKey('');
    setExtensionConstructionType('without_foundation');
    setMajorRepairApprovalType('report');
    setMajorRepairRoofReductionApplied(false);
    setManualAdjustmentKey('');
    setAcquiredAfterViolation(false);
    setForProfitPurpose(false);
    setRepeatedViolation(false);
  };

  const clearPreparedCalculation = () => {
    setPreparedData(null);
    setLookupOpen(false);
    resetViolationInputs('');
  };

  const handleAddressSelect = (nextAddress: AddressSearchResult) => {
    setSelectedAddress(nextAddress);
    setAddress(nextAddress.roadAddr);
    setDongName('');
    setHoName('');
    clearPreparedCalculation();
    setAddressSearchOpen(false);
  };

  const openAddressSearch = () => {
    if (requireLogin()) return;
    setAddressSearchOpen(true);
  };

  const handleUnauthorized = (error: Error & { status?: number }) => {
    if (error.status === 401) {
      setLoginOpen(true);
      return true;
    }
    return false;
  };

  const loadViolationTypes = async () => {
    setLoadingTypes(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/violation-types', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: ViolationType[] }>(response);
      setViolationTypes(data.items || []);
      setViolationType(current => current || data.items?.[0]?.code || '');
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '위반유형을 불러오지 못했습니다.'));
      }
    } finally {
      setLoadingTypes(false);
    }
  };

  const loadStructureOptions = async () => {
    setLoadingStructures(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/structure-options', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: StructureOption[] }>(response);
      setStructureOptions(data.items || []);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '구조지수 목록을 불러오지 못했습니다.'));
      }
    } finally {
      setLoadingStructures(false);
    }
  };

  const loadUseOptions = async () => {
    setLoadingUses(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/use-options', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: UseOption[] }>(response);
      setUseOptions(data.items || []);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '용도지수 목록을 불러오지 못했습니다.'));
      }
    } finally {
      setLoadingUses(false);
    }
  };

  const prepareBuilding = async () => {
    if (requireLogin()) return;

    setPreparing(true);
    setErrorMessage('');
    setResult(null);

    try {
      if (violationTypes.length === 0) {
        await loadViolationTypes();
      }
      if (structureOptions.length === 0) {
        await loadStructureOptions();
      }
      if (useOptions.length === 0) {
        await loadUseOptions();
      }

      const response = await fetch('/api/enforcement-fine/prepare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          address: selectedAddress?.roadAddr || address.trim(),
          roadAddress: selectedAddress?.roadAddr,
          jibunAddress: selectedAddress?.jibunAddr,
          addressCode: selectedAddress?.addressCode,
          dongName: dongName.trim() || undefined,
          hoName: hoName.trim() || undefined
        })
      });
      const data = await parseJsonResponse<PreparedData>(response);
      setPreparedData(data);
      resetViolationInputs(data.reference?.structure?.id || '');
      setLookupOpen(false);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '건축물 정보를 조회하지 못했습니다.'));
      }
    } finally {
      setPreparing(false);
    }
  };

  const calculateFine = async () => {
    if (!preparedData) return;

    if (!session?.user) {
      setLoginOpen(true);
      return;
    }

    setCalculating(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          preparedData,
          violationType,
          violationCompletedYear: violationCompletedYear ? Number(violationCompletedYear) : undefined,
          violationStructureIndexId: violationStructureIndexId || preparedData.reference?.structure?.id,
          violationUseIndexId: isUseChangeType ? violationUseIndexId : undefined,
          extensionConstructionType,
          majorRepairApprovalType,
          majorRepairRoofReductionApplied,
          selectedAdjustmentCodes: manualAdjustmentCodes,
          specialConditionFlags: {
            acquiredAfterViolation,
            forProfitPurpose,
            repeatedViolation
          },
          ...(areaUnit === 'm2'
            ? { violationAreaM2: areaNumber }
            : { violationAreaPyeong: areaNumber })
        })
      });
      const data = await parseJsonResponse<CalculateResult>(response);
      setResult(data);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '이행강제금을 계산하지 못했습니다.'));
      }
    } finally {
      setCalculating(false);
    }
  };

  const reset = () => {
    setPreparedData(null);
    setErrorMessage('');
    setLookupOpen(false);
    resetViolationInputs(preparedData?.reference?.structure?.id || '');
  };

  return (
    <main className="calc-root min-h-screen bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="sticky top-2 z-30 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:top-4 sm:px-4 dark:border-slate-800 dark:bg-slate-900/90">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 text-inherit no-underline" aria-label="양성화.com 홈페이지로 이동">
            <span className="calc-brand-mark flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-white shadow-sm dark:border-transparent dark:bg-primary">
              <Image src="/docu/archlegal-fa-p-transparent.png" alt="ArchLegal" width={30} height={30} />
            </span>
            <span className="flex min-w-0 flex-col leading-tight">
              <strong className="truncate text-sm font-extrabold text-slate-950 dark:text-slate-50">양성화.com</strong>
              <span className="truncate text-[11px] text-slate-500 dark:text-slate-300">공식 기준 기반 이행강제금 계산</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle className="h-10 min-h-10 w-10 shrink-0 rounded-full border-slate-200 bg-white/80 p-0 shadow-none hover:border-primary/40 hover:bg-blue-50 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-50 dark:hover:border-primary/50 dark:hover:bg-slate-800" />
            {KAKAO_JAVASCRIPT_KEY ? (
              <button
                type="button"
                onClick={shareCalcLink}
                aria-label="카카오톡으로 공유하기"
                className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-sm transition-opacity hover:opacity-80"
                style={{ backgroundColor: '#FEE500' }}
              >
                <span
                  className="relative flex items-center justify-center rounded-full text-[7px] font-black leading-none tracking-tight"
                  style={{ width: 26, height: 17, backgroundColor: '#111', color: '#FEE500' }}
                >
                  TALK
                  <span
                    aria-hidden="true"
                    className="absolute"
                    style={{ bottom: -3, left: 5, width: 7, height: 7, backgroundColor: '#111', borderRadius: 1, transform: 'rotate(35deg)' }}
                  />
                </span>
              </button>
            ) : null}
            <Button type="button" className="h-10 w-auto px-3 text-sm sm:px-4" asChild>
              <Link href="/check">1분 자가진단</Link>
            </Button>
          </div>
        </header>

        {errorMessage ? (
          <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : null}

        {shareToast ? (
          <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-900 px-5 py-2.5 text-sm text-white shadow-lg">
            {shareToast}
          </div>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold text-slate-950">건축물 조회</h2>
              </div>

              <div className="grid gap-3">
                <div className="grid grid-cols-[42px_minmax(0,1fr)] items-start gap-2 sm:block sm:space-y-2">
                  <Label htmlFor="enforcement-address" required className="whitespace-nowrap pt-3 sm:pt-0">
                    주소
                  </Label>
                  <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2 sm:grid-cols-[minmax(0,1fr)_120px]">
                    <Input
                      id="enforcement-address"
                      value={address}
                      readOnly
                      placeholder="주소 검색 버튼을 클릭해주세요"
                      className={!selectedAddress ? 'border-amber-200 bg-amber-50' : ''}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-1 px-2 sm:gap-2 sm:px-4"
                      onClick={openAddressSearch}
                    >
                      <Search className="h-4 w-4" />
                      검색
                    </Button>
                  </div>
                  {selectedAddress ? (
                    <div className="col-start-2 grid gap-1 text-xs text-slate-500 sm:block sm:space-y-1">
                      <span>지번: {selectedAddress.jibunAddr}</span>
                      {selectedAddress.buildingName ? <span>건물명: {selectedAddress.buildingName}</span> : null}
                    </div>
                  ) : null}
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                    <Label htmlFor="enforcement-dong" className="whitespace-nowrap">동</Label>
                    <Input
                      id="enforcement-dong"
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
                  <div className="grid grid-cols-[42px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                    <Label htmlFor="enforcement-ho" className="whitespace-nowrap">호수</Label>
                    <Input
                      id="enforcement-ho"
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
                <Button type="button" className="gap-2 sm:w-auto" onClick={prepareBuilding} disabled={!canPrepare}>
                  {preparing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  조회하기
                </Button>
              </div>
            </div>

            {preparedData ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 text-left"
                  onClick={() => setLookupOpen(open => !open)}
                  aria-expanded={lookupOpen}
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    <span className="text-base font-semibold text-slate-950">조회 결과</span>
                  </span>
                  {lookupOpen ? (
                    <ChevronUp className="h-4 w-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  )}
                </button>

                {lookupOpen ? (
                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-slate-500">도로명주소</dt>
                      <dd className="mt-1 font-medium text-slate-950">{preparedData.address?.roadAddress || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">건물명</dt>
                      <dd className="mt-1 font-medium text-slate-950">{building?.buildingName || '-'}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">용도</dt>
                      <dd className="mt-1 font-medium text-slate-950">
                        {selectedUnit?.detailUse || building?.detailUse || building?.mainUse || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">구조</dt>
                      <dd className="mt-1 font-medium text-slate-950">
                        {selectedUnit?.structure || building?.structure || '-'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">전유면적</dt>
                      <dd className="mt-1 font-medium text-slate-950">{formatArea(selectedUnit?.exclusiveAreaM2)}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">사용승인일</dt>
                      <dd className="mt-1 font-medium text-slate-950">{building?.useApprovalDate || '-'}</dd>
                    </div>
                  </dl>
                ) : null}
              </div>
            ) : null}

            {preparedData ? (
              <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold text-slate-950">위반 정보</h2>
                </div>

                <div className="grid gap-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_100px_minmax(180px,240px)_160px]">
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                      <Label htmlFor="violation-area" required className="whitespace-nowrap">
                        위반면적
                      </Label>
                      <Input
                        id="violation-area"
                        type="number"
                        min="0"
                        max="99999.99"
                        step="0.01"
                        inputMode="decimal"
                        value={violationArea}
                        onChange={event => setViolationArea(sanitizeAreaInput(event.target.value))}
                        placeholder="예: 4"
                      />
                    </div>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2 lg:block">
                      <Label htmlFor="area-unit" className="whitespace-nowrap">단위</Label>
                      <select
                        id="area-unit"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={areaUnit}
                        onChange={event => setAreaUnit(event.target.value as AreaUnit)}
                      >
                        <option value="pyeong">평</option>
                        <option value="m2">㎡</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                      <Label htmlFor="violation-type" required className="whitespace-nowrap">
                        위반유형
                      </Label>
                      <select
                        id="violation-type"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={violationType}
                        onFocus={() => {
                          if (violationTypes.length === 0 && !loadingTypes) void loadViolationTypes();
                        }}
                        onChange={event => {
                          setViolationType(event.target.value);
                          setViolationUseIndexId('');
                          setResult(null);
                        }}
                      >
                        {violationTypes.length === 0 ? (
                          <option value="">위반유형 불러오기</option>
                        ) : (
                          violationTypes.map(item => (
                            <option key={item.code} value={item.code}>
                              {item.label}
                            </option>
                          ))
                        )}
                      </select>
                    </div>
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                      <Label htmlFor="violation-year" className="whitespace-nowrap">위반완료연도</Label>
                      <Input
                        id="violation-year"
                        type="text"
                        inputMode="numeric"
                        min="1900"
                        max={CURRENT_YEAR}
                        maxLength={4}
                        value={violationCompletedYear}
                        onChange={event => setViolationCompletedYear(sanitizeYearInput(event.target.value))}
                        placeholder="예: 2019"
                      />
                    </div>
                  </div>

                  {isUseChangeType ? (
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-start gap-2 sm:block sm:space-y-2">
                      <Label required className="whitespace-nowrap pt-2.5 sm:pt-0">
                        변경 후 용도
                      </Label>
                      <div className="space-y-2">
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
                                violationUseCategoryKey === key
                                  ? 'border-primary bg-primary text-white'
                                  : 'border-input bg-background text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                              }`}
                              onClick={() => {
                                setViolationUseCategoryKey(key);
                                setViolationUseIndexId('');
                                setResult(null);
                                if (useOptions.length === 0 && !loadingUses) void loadUseOptions();
                              }}
                            >
                              {label}
                            </button>
                          ))}
                        </div>
                        {violationUseCategoryKey ? (
                          <select
                            id="violation-use"
                            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            value={violationUseIndexId}
                            onChange={event => {
                              setViolationUseIndexId(event.target.value);
                              setResult(null);
                            }}
                          >
                            <option value="">
                              {loadingUses ? '불러오는 중…' : '세부 용도 선택'}
                            </option>
                            {filteredUseOptionGroups.map(([groupLabel, items]) => (
                              <optgroup key={groupLabel} label={groupLabel}>
                                {items.map(item => (
                                  <option key={item.id} value={item.id}>
                                    {formatUseOptionLabelShort(item)}
                                  </option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        ) : null}
                      </div>
                    </div>
                  ) : null}

                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_100px_minmax(180px,240px)_160px]">
                    <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2 lg:col-span-2">
                      <Label htmlFor="violation-structure" required className="whitespace-nowrap">
                        위반구조
                      </Label>
                      <select
                        id="violation-structure"
                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={violationStructureIndexId}
                        onFocus={() => {
                          if (structureOptions.length === 0 && !loadingStructures) void loadStructureOptions();
                        }}
                        onChange={event => setViolationStructureIndexId(event.target.value)}
                      >
                        {visibleStructureOptions.length === 0 ? (
                          <option value={preparedData.reference?.structure?.id || ''}>
                            {preparedData.reference?.structure?.name || '구조 불러오기'}
                          </option>
                        ) : (
                          visibleStructureOptions.map(item => (
                            <option key={item.id} value={item.id}>
                              {item.name}
                            </option>
                          ))
                        )}
                      </select>
                    </div>

                    {isExtensionType ? (
                      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                        <Label htmlFor="extension-construction-type" className="whitespace-nowrap">
                          증축기준
                        </Label>
                        <select
                          id="extension-construction-type"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={extensionConstructionType}
                          onChange={event => setExtensionConstructionType(event.target.value)}
                        >
                          <option value="without_foundation">기초공사 없음</option>
                          <option value="with_foundation">기초공사 있음</option>
                          <option value="without_foundation_multilevel">기초 없음 + 복층</option>
                        </select>
                      </div>
                    ) : null}

                    {isMajorRepairType ? (
                      <div className="grid grid-cols-[88px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                        <Label htmlFor="major-repair-approval-type" className="whitespace-nowrap">
                          대수선
                        </Label>
                        <select
                          id="major-repair-approval-type"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={majorRepairApprovalType}
                          onChange={event => setMajorRepairApprovalType(event.target.value)}
                        >
                          <option value="report">신고 대상</option>
                          <option value="permit">허가 대상</option>
                        </select>
                      </div>
                    ) : null}
                  </div>

                  {isMajorRepairType ? (
                    <label className="flex items-center gap-2 text-sm text-slate-700">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-slate-300"
                        checked={majorRepairRoofReductionApplied}
                        onChange={event => setMajorRepairRoofReductionApplied(event.target.checked)}
                      />
                      노후 건축물 지붕 수선 또는 덮개 추가에 해당
                    </label>
                  ) : null}

                  {shouldShowManualAdjustmentSelector ? (
                    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                      <div className="grid grid-cols-[104px_minmax(0,1fr)] items-center gap-2 sm:block sm:space-y-2">
                        <Label htmlFor="manual-adjustment" className="whitespace-nowrap">
                          위반 부분 위치
                        </Label>
                        <select
                          id="manual-adjustment"
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={manualAdjustmentKey}
                          onChange={event => setManualAdjustmentKey(event.target.value as ManualAdjustmentKey)}
                        >
                          {MANUAL_ADJUSTMENT_OPTIONS.map(option => (
                            <option key={option.value || 'none'} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <p className="mt-2 text-xs text-slate-500">
                        동/호수로 전유부 위치를 확인할 수 없을 때만 선택합니다.
                      </p>
                    </div>
                  ) : null}

                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-3">
                    <div className="text-sm font-medium text-slate-950">추가 조건</div>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <label className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700 sm:gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300"
                          checked={acquiredAfterViolation}
                          onChange={event => setAcquiredAfterViolation(event.target.checked)}
                        />
                        <span className="truncate">위반 후 취득</span>
                      </label>
                      <label className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700 sm:gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300"
                          checked={forProfitPurpose}
                          onChange={event => setForProfitPurpose(event.target.checked)}
                        />
                        <span className="truncate">영리 목적</span>
                      </label>
                      <label className="flex min-w-0 items-center gap-1.5 text-sm text-slate-700 sm:gap-2">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-slate-300"
                          checked={repeatedViolation}
                          onChange={event => setRepeatedViolation(event.target.checked)}
                        />
                        <span className="truncate">반복 위반</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button type="button" className="gap-2 sm:w-auto" onClick={calculateFine} disabled={!canCalculate}>
                      {calculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                      계산하기
                    </Button>
                    <Button type="button" variant="outline" className="gap-2 sm:w-auto" onClick={reset}>
                      <RotateCcw className="h-4 w-4" />
                      다시 입력
                    </Button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <aside className="space-y-4">
            {result ? (
              <div ref={resultCardRef} className="rounded-lg border border-primary/30 bg-white p-4 shadow-sm">
                <div className="text-sm font-semibold text-primary">예상 이행강제금</div>
                <div className="mt-2 text-3xl font-bold text-slate-950">
                  {formatCurrency(result.result.estimatedFineKrw)}
                </div>
                {hasEstimatedRange ? (
                  <div className="mt-2 rounded-md bg-primary/5 px-3 py-2 text-sm text-primary">
                    예상범위 {formatCurrency(result.result.estimatedFineMinKrw)} ~ {formatCurrency(result.result.estimatedFineMaxKrw)}
                  </div>
                ) : null}
                <dl className="mt-4 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">위반유형</dt>
                    <dd className="text-right font-medium">{result.result.violationLabel}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">1㎡당 시가표준액</dt>
                    <dd className="font-medium">{formatCurrency(result.result.standardPriceKrwPerM2)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">위반부분 시가표준액</dt>
                    <dd className="font-medium">{formatCurrency(result.result.buildingStandardValueKrw)}</dd>
                  </div>
                  {result.calculationBasis?.standardPrice?.specialStandardValueRatio ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">산정비율</dt>
                      <dd className="font-medium">
                        {formatRate(result.calculationBasis.standardPrice.specialStandardValueRatio)}
                      </dd>
                    </div>
                  ) : null}
                </dl>

                {result.result.warnings.length > 0 ? (
                  <div className="mt-4 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
                    <div className="font-medium">확인 필요</div>
                    <ul className="mt-2 space-y-1">
                      {result.result.warnings.slice(0, 4).map(item => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <Button
                  className="mt-4"
                  onClick={() => {
                    if (result && preparedData) {
                      try {
                        const detailParts = [dongName.trim(), hoName.trim()].filter(Boolean);
                        window.sessionStorage.setItem(CALC_CONSULT_KEY, JSON.stringify({
                          address: selectedAddress,
                          addressDetail: detailParts.join(' '),
                          message: buildCalcConsultMessage(result, preparedData)
                        }));
                      } catch {}
                    }
                    window.location.href = '/?consultation=open';
                  }}
                >
                  무료상담 신청하기
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
                주소를 조회한 뒤 위반 정보를 입력하면 예상 금액이 표시됩니다.
              </div>
            )}

            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 text-left"
                onClick={() => setCriteriaOpen(open => !open)}
                aria-expanded={criteriaOpen}
              >
                <span className="text-sm font-semibold text-slate-950">계산 기준</span>
                {criteriaOpen ? (
                  <ChevronUp className="h-4 w-4 text-slate-500" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                )}
              </button>
              {criteriaOpen ? (
                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">위반구조</dt>
                    <dd className="text-right font-medium">
                      {standardBasis?.structureName || selectedStructureOption?.name || reference?.structure?.name || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">구조지수</dt>
                    <dd className="font-medium">{formatDecimal(standardBasis?.structureIndex ?? selectedStructureOption?.index ?? reference?.structure?.index)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">
                      {standardBasis?.changedUseApplied ? '변경 후 용도' : '용도'}
                    </dt>
                    <dd className="text-right font-medium">
                      {standardBasis?.useName || reference?.use?.detailUse || reference?.use?.mainUse || '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">용도지수</dt>
                    <dd className="font-medium">{formatDecimal(standardBasis?.useIndex ?? reference?.use?.index)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">위치지수</dt>
                    <dd className="font-medium">{formatDecimal(standardBasis?.locationIndex ?? reference?.location?.index)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">개별공시지가</dt>
                    <dd className="font-medium">{formatCurrency(reference?.landPrice?.landPriceKrwPerM2)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="text-slate-500">기준가격</dt>
                    <dd className="font-medium">{formatCurrency(standardBasis?.basePriceKrwPerM2 ?? reference?.basePrice?.krwPerM2)}</dd>
                  </div>
                  {standardBasis?.depreciationRate ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">잔가율</dt>
                      <dd className="font-medium">{formatRate(standardBasis.depreciationRate)}</dd>
                    </div>
                  ) : null}
                  {standardBasis?.majorRepairRatio?.changedConstructionYear ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">대수선 보정연도</dt>
                      <dd className="font-medium">{standardBasis.majorRepairRatio.changedConstructionYear}</dd>
                    </div>
                  ) : null}
                  {isExtensionType ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">증축 산정</dt>
                      <dd className="text-right font-medium">
                        {standardBasis?.extensionRatio?.label || getExtensionConstructionLabel(extensionConstructionType)}
                      </dd>
                    </div>
                  ) : null}
                  {isMajorRepairType ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">대수선 구분</dt>
                      <dd className="font-medium">
                        {standardBasis?.majorRepairRatio?.label || (majorRepairApprovalType === 'permit' ? '허가 대상' : '신고 대상')}
                      </dd>
                    </div>
                  ) : null}
                  {standardBasis?.specialStandardValueRatio ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">산정비율</dt>
                      <dd className="font-medium">{formatRate(standardBasis.specialStandardValueRatio)}</dd>
                    </div>
                  ) : null}
                  {standardBasis?.adjustmentRate ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">가감산계수</dt>
                      <dd className="font-medium">{formatDecimal(standardBasis.adjustmentRate)}</dd>
                    </div>
                  ) : null}
                  {adjustmentItems.length > 0 ? (
                    <div className="border-t border-slate-100 pt-3">
                      <dt className="text-slate-500">가감산 항목</dt>
                      <dd className="mt-2 space-y-1">
                        {adjustmentItems.map((item: any) => (
                          <div key={item.code} className="flex justify-between gap-3 text-slate-800">
                            <span>{item.label}</span>
                            <span className="shrink-0 font-medium">
                              {item.sourceType === 'user_selected' ? '사용자 선택' : '자동 적용'}
                            </span>
                          </div>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                  {violationBasis?.baseFineRate !== undefined && violationBasis?.baseFineRate !== null ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">기본 부과율</dt>
                      <dd className="font-medium">{formatRate(violationBasis.baseFineRate)}</dd>
                    </div>
                  ) : null}
                  {violationBasis?.violationRate !== undefined ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">위반요율</dt>
                      <dd className="font-medium">{formatRate(violationBasis.violationRate)}</dd>
                    </div>
                  ) : null}
                  {yearsBasis?.appliedCompletionYear ? (
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">적용연도</dt>
                      <dd className="font-medium">{yearsBasis.appliedCompletionYear}</dd>
                    </div>
                  ) : null}
                  {specialConditionItems.length > 0 ? (
                    <div className="border-t border-slate-100 pt-3">
                      <dt className="text-slate-500">추가 조건</dt>
                      <dd className="mt-2 space-y-1">
                        {specialConditionItems.map((item: any) => (
                          <div key={item.code} className="flex justify-between gap-3 text-slate-800">
                            <span>{item.label}</span>
                            <span className="font-medium">
                              {item.type === 'reduction' ? '감경 후보' : '가중 후보'}
                            </span>
                          </div>
                        ))}
                      </dd>
                    </div>
                  ) : null}
                  {calculationBasis?.formula ? (
                    <div className="border-t border-slate-100 pt-3">
                      <dt className="text-slate-500">산식</dt>
                      <dd className="mt-1 text-slate-800">{calculationBasis.formula}</dd>
                    </div>
                  ) : null}
                </dl>
              ) : null}
            </div>
          </aside>
        </section>
      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} nextPath="/calc" />
      <AddressSearchModal
        isOpen={addressSearchOpen}
        onClose={() => setAddressSearchOpen(false)}
        onSelect={handleAddressSelect}
      />

      {KAKAO_JAVASCRIPT_KEY ? (
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.5/kakao.min.js"
          strategy="afterInteractive"
          onLoad={initializeKakaoSdk}
        />
      ) : null}
    </main>
  );
}
