'use client';

import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import {
  AlertCircle,
  Calculator,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Info,
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

type AdjustmentOption = {
  adjustmentType: 'increase' | 'decrease';
  code: string;
  label: string;
  rate: number;
  appliesTo?: string | null;
  excludedCases?: string | null;
  autoApply: boolean;
  applyStrategy: string;
  conditionSummary?: string | null;
  userQuestion?: string | null;
  sortOrder: number;
};

type SpecialConditionOption = {
  code: string;
  label: string;
  conditionType: 'increase' | 'reduction';
  rate: number;
  multiplier: number;
  requiresUserConfirmation: boolean;
  sortOrder: number;
  description?: string | null;
};

type ExtensionConstructionOption = {
  code: string;
  label: string;
  sortOrder: number;
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
type ViolationCategoryKey =
  | 'extension'
  | 'use'
  | 'major_repair'
  | 'site_layout'
  | 'height_sunlight'
  | 'safety'
  | 'other';

const CURRENT_YEAR = new Date().getFullYear();
const EXTENSION_VIOLATION_GROUP_CODE = 'violation_1';
const EXTENSION_VIOLATION_GROUP_FALLBACK_LABEL = '허가를 받지 않거나, 신고를 하지 않고 신축, 증축한 건축물';
const VIOLATION_CATEGORY_OPTIONS: Array<{ key: ViolationCategoryKey; label: string }> = [
  { key: 'extension', label: EXTENSION_VIOLATION_GROUP_FALLBACK_LABEL },
  { key: 'use', label: '무단 용도·사용' },
  { key: 'major_repair', label: '무단 대수선' },
  { key: 'site_layout', label: '대지·배치 기준 위반' },
  { key: 'height_sunlight', label: '높이·일조 기준 위반' },
  { key: 'safety', label: '구조·피난·방화·안전 기준 위반' },
  { key: 'other', label: '기타 건축법령 위반' }
];
const VIOLATION_CATEGORY_CODES: Record<ViolationCategoryKey, string[]> = {
  extension: [
    'coverage_ratio_excess',
    'floor_area_ratio_excess',
    'unauthorized_extension',
    'unreported_extension'
  ],
  use: [
    'unauthorized_use_change',
    'use_without_approval'
  ],
  major_repair: [
    'unauthorized_major_repair'
  ],
  site_layout: [
    'landscape_violation',
    'building_line_violation'
  ],
  height_sunlight: [
    'height_limit_violation',
    'sunlight_height_violation'
  ],
  safety: [
    'structural_safety_violation',
    'evacuation_fire_compartment_violation',
    'fire_resistant_wall_violation',
    'fire_district_violation',
    'finish_material_violation',
    'building_equipment_violation'
  ],
  other: [
    'building_act_order_violation'
  ]
};

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

const MITIGATION_CONDITION_CODES = new Set([
  'acquired_after_violation',
  'tenant_correction_difficulty',
  'existing_at_use_approval'
]);

const RESIDENTIAL_SPECIAL_CODES = new Set([
  'article80_small_residential_half',
  'article80_use_without_approval_residential_half',
  'article80_landscape_residential_half',
  'article80_height_residential_half',
  'article80_sunlight_residential_half',
  'article80_ordinance_residential_half'
]);

const VIOLATION_EXAMPLE_TIPS = [
  {
    title: '불법 증축',
    description: '옥상방, 창고, 테라스, 점포 앞 확장, 필로티 막기처럼 면적이 늘어난 경우입니다.',
    mapsTo: '허가를 받지 않거나, 신고를 하지 않고 신축, 증축한 건축물 > 허가를 받지 아니하고 건축한 경우 / 신고를 하지 아니하고 건축한 경우 / 건폐율·용적률 초과'
  },
  {
    title: '무단 용도변경',
    description: '근린생활시설을 주거로 쓰거나, 주차장을 창고·상가로 쓰거나, 사무실을 음식점·카페로 쓰는 경우입니다.',
    mapsTo: '무단 용도·사용 > 허가·신고 없이 무단 용도변경한 건축물'
  },
  {
    title: '무단 대수선',
    description: '방쪼개기, 세대·가구 경계벽 변경, 계단 변경, 방화구획 변경, 내력벽·기둥·보 변경처럼 구조나 구획을 바꾸는 경우입니다.',
    mapsTo: '무단 대수선 > 허가·신고 없이 증설 또는 해체로 대수선을 한 건축물'
  },
  {
    title: '높이·일조·건축선 위반',
    description: '층을 올리거나 옥탑·다락·복층을 만들면서 높이 제한, 일조사선, 건축선 후퇴 기준을 넘긴 경우입니다.',
    mapsTo: '높이·일조 기준 위반 > 높이 제한을 위반한 건축물 / 일조 등의 확보를 위한 높이 제한을 위반한 건축물, 대지·배치 기준 위반 > 건축선에 적합하지 아니한 건축물'
  },
  {
    title: '조경·주차장·공용공간 훼손',
    description: '조경면적을 없애거나, 부설주차장·필로티·공용부분을 창고·방·점포로 쓰는 경우입니다.',
    mapsTo: '대지·배치 기준 위반 > 대지의 조경에 관한 사항을 위반한 건축물, 무단 용도·사용 > 허가·신고 없이 무단 용도변경한 건축물'
  },
  {
    title: '구조·피난·방화 안전 위반',
    description: '내력벽 철거, 기둥 제거, 보 변경, 피난계단 변경, 방화문·방화구획 훼손처럼 안전 기준을 건드린 경우입니다.',
    mapsTo: '구조·피난·방화·안전 기준 위반 > 구조내력기준에 적합하지 아니한 건축물 / 피난시설, 용도·구조 제한, 방화구획 등 기준에 적합하지 아니한 건축물 / 내화구조 및 방화벽 기준에 적합하지 아니한 건축물'
  }
];

function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

function formatCurrencyPerM2(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Math.round(value).toLocaleString('ko-KR')}원/㎡`;
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
  if (value === 'not_applicable') return '해당없음';
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

function buildCalcConsultMessage(
  result: CalculateResult,
  preparedData: PreparedData,
  violationDisplayLabel: string
): string {
  const r = result.result;
  const sp = result.calculationBasis?.standardPrice;
  const ref = preparedData?.reference;
  const fmt = (n: number) => n.toLocaleString('ko-KR');

  const lines: string[] = [
    '이행강제금 계산기로 예상 금액을 확인하고 양성화 절차 상담을 요청드립니다.',
    '',
    '[계산 결과]',
    `위반유형: ${violationDisplayLabel}`,
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
  return item.detailUse || item.mainUse;
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

function getUseCategorySelectionKey(categoryCode: string | null | undefined): 'I' | 'II' | 'other' | '' {
  if (categoryCode === 'I' || categoryCode === 'II') return categoryCode;
  return categoryCode ? 'other' : '';
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

type EnforcementFineCalculatorClientProps = {
  showInternalCalculationDetails?: boolean;
  loginNextPath?: string;
};

export function EnforcementFineCalculatorClient({
  showInternalCalculationDetails = false,
  loginNextPath = '/calc'
}: EnforcementFineCalculatorClientProps = {}) {
  const session = useSession();
  const headerRef = useRef<HTMLElement | null>(null);
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
  const [extensionConstructionType, setExtensionConstructionType] = useState('not_applicable');
  const [majorRepairApprovalType, setMajorRepairApprovalType] = useState('');
  const [majorRepairRoofReductionApplied, setMajorRepairRoofReductionApplied] = useState(false);
  const [manualAdjustmentKey, setManualAdjustmentKey] = useState<ManualAdjustmentKey>('');
  const [selectedAdditionCodes, setSelectedAdditionCodes] = useState<string[]>([]);
  const [selectedReductionCodes, setSelectedReductionCodes] = useState<string[]>([]);
  const [aggravationId, setAggravationId] = useState('');
  const [mitigationId, setMitigationId] = useState('');
  const [residentialSpecialId, setResidentialSpecialId] = useState('');
  const [acquiredAfterViolation, setAcquiredAfterViolation] = useState(false);
  const [forProfitPurpose, setForProfitPurpose] = useState(false);
  const [repeatedViolation, setRepeatedViolation] = useState(false);
  const [violationTypes, setViolationTypes] = useState<ViolationType[]>([]);
  const [structureOptions, setStructureOptions] = useState<StructureOption[]>([]);
  const [useOptions, setUseOptions] = useState<UseOption[]>([]);
  const [adjustmentOptions, setAdjustmentOptions] = useState<AdjustmentOption[]>([]);
  const [specialConditionOptions, setSpecialConditionOptions] = useState<SpecialConditionOption[]>([]);
  const [extensionConstructionOptions, setExtensionConstructionOptions] = useState<ExtensionConstructionOption[]>([]);
  const [preparedData, setPreparedData] = useState<PreparedData | null>(null);
  const [result, setResult] = useState<CalculateResult | null>(null);
  const [loadingTypes, setLoadingTypes] = useState(false);
  const [loadingStructures, setLoadingStructures] = useState(false);
  const [loadingUses, setLoadingUses] = useState(false);
  const [loadingAdjustments, setLoadingAdjustments] = useState(false);
  const [loadingSpecialConditions, setLoadingSpecialConditions] = useState(false);
  const [loadingExtensionConstructionOptions, setLoadingExtensionConstructionOptions] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [loginOpen, setLoginOpen] = useState(false);
  const [addressSearchOpen, setAddressSearchOpen] = useState(false);
  const [lookupOpen, setLookupOpen] = useState(false);
  const [criteriaOpen, setCriteriaOpen] = useState(false);
  const [violationExamplesOpen, setViolationExamplesOpen] = useState(false);
  const [violationPickerOpen, setViolationPickerOpen] = useState(false);
  const [shareToast, setShareToast] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

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
  const violationCode = violationType;

  const selectedViolationType = useMemo(
    () => violationTypes.find(item => item.code === violationCode) || null,
    [violationCode, violationTypes]
  );
  const selectedViolationLabel = selectedViolationType?.label || '';
  const groupedViolationOptions = useMemo(() => (
    VIOLATION_CATEGORY_OPTIONS
      .map(category => {
        const groupLabel = category.key === 'extension'
          ? violationTypes.find(item => item.code === EXTENSION_VIOLATION_GROUP_CODE)?.label || category.label
          : category.label;

        return {
          label: groupLabel,
          items: VIOLATION_CATEGORY_CODES[category.key]
            .map(code => violationTypes.find(item => item.code === code))
            .filter((item): item is ViolationType => Boolean(item))
        };
      })
      .filter(group => group.items.length > 0)
  ), [violationTypes]);
  const selectedStructureOption = useMemo(
    () => structureOptions.find(item => item.id === violationStructureIndexId) || null,
    [structureOptions, violationStructureIndexId]
  );
  const selectedUseOption = useMemo(
    () => useOptions.find(item => item.id === violationUseIndexId) || null,
    [useOptions, violationUseIndexId]
  );
  const isExtensionType = selectedViolationType?.formulaType === 'extension_area';
  const isMajorRepairType = selectedViolationType?.code === 'unauthorized_major_repair';
  const isUseChangeType = selectedViolationType?.code === 'unauthorized_use_change';
  const calculationBasis = result?.calculationBasis;
  const standardBasis = calculationBasis?.standardPrice;
  const violationBasis = calculationBasis?.violation;
  const resultViolationLabel = result
    ? selectedViolationType?.label || result.result.violationLabel
    : '';
  const yearsBasis = calculationBasis?.years;
  const specialConditionItems = calculationBasis?.specialConditions?.items || [];
  const adjustmentItems = calculationBasis?.adjustments || [];
  const calculationYear = standardBasis?.year ?? 2026;
  const depreciationYear = yearsBasis?.appliedDepreciationYear;
  const elapsedYears = typeof calculationYear === 'number' && typeof depreciationYear === 'number'
    ? Math.max(calculationYear - depreciationYear, 0)
    : null;
  const targetSummary = [
    preparedData?.selectedUnit?.dongName,
    preparedData?.selectedUnit?.hoName
  ].filter(Boolean).join(' ') || [dongName.trim(), hoName.trim()].filter(Boolean).join(' ') || '직접 입력';
  const violationReasonRate = violationBasis?.baseFineRate ?? violationBasis?.violationRate ?? 1;
  const violationTypeRate = violationBasis?.baseFineRate != null
    ? violationBasis?.violationRate ?? 1
    : 1;
  const majorRepairFactor = standardBasis?.majorRepairRatio
    ? standardBasis?.specialStandardValueRatio ?? standardBasis.majorRepairRatio.ratio
    : 1;
  const foundationFactor = standardBasis?.extensionRatio?.ratio ?? 1;
  const aggravationFactor = calculationBasis?.specialConditions?.increaseMultiplier ?? 1;
  const mitigationFactor = calculationBasis?.specialConditions?.reductionMultiplier ?? 1;
  const residentialSpecialFactor = calculationBasis?.specialConditions?.specialCaseMultiplier ?? 1;
  const criteriaInputRows = [
    ['대상', targetSummary],
    ['공시지가', formatCurrencyPerM2(reference?.landPrice?.landPriceKrwPerM2)],
    ['위반면적', formatArea(calculationBasis?.area?.violationAreaM2)],
    ['공사 완료연도', yearsBasis?.appliedCompletionYear ? `${yearsBasis.appliedCompletionYear}년` : '-'],
    ['부과 기준연도', calculationYear ? `${calculationYear}년` : '-']
  ];
  const criteriaIntermediateRows = [
    ['구조지수', formatDecimal(standardBasis?.structureIndex ?? selectedStructureOption?.index ?? reference?.structure?.index)],
    ['용도지수', formatDecimal(standardBasis?.useIndex ?? selectedUseOption?.index ?? reference?.use?.index)],
    ['위치지수', formatDecimal(standardBasis?.locationIndex ?? reference?.location?.index)],
    ['기준액', formatCurrencyPerM2(standardBasis?.basePriceKrwPerM2 ?? reference?.basePrice?.krwPerM2)],
    ['경과연수', elapsedYears === null ? '-' : `${elapsedYears}년`],
    ['잔가율', formatDecimal(standardBasis?.depreciationRate)],
    ['가감산율', formatDecimal(standardBasis?.adjustmentRate ?? 1)],
    ['대수선비율', formatDecimal(majorRepairFactor)],
    ['기초시공계수', formatDecimal(foundationFactor)],
    ['위반사유요율', formatDecimal(violationReasonRate)],
    ['위반 유형 요율', formatDecimal(violationTypeRate)],
    ['가중', formatDecimal(aggravationFactor)],
    ['감경', formatDecimal(mitigationFactor)],
    ['특례', formatDecimal(residentialSpecialFactor)]
  ];
  const hasEstimatedRange = Boolean(
    result &&
    (
      result.result.estimatedFineMinKrw !== result.result.estimatedFineKrw ||
      result.result.estimatedFineMaxKrw !== result.result.estimatedFineKrw
    )
  );

  const scrollResultCardIntoView = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (typeof window === 'undefined' || !resultCardRef.current) return;

    const headerBottom = headerRef.current?.getBoundingClientRect().bottom ?? 0;
    const targetTop = resultCardRef.current.getBoundingClientRect().top + window.scrollY;
    const offset = Math.max(headerBottom, 0) + 12;

    window.scrollTo({
      top: Math.max(targetTop - offset, 0),
      behavior
    });
  }, []);

  useEffect(() => {
    if (!result || typeof window === 'undefined' || window.innerWidth >= 1024) return;

    window.requestAnimationFrame(() => {
      scrollResultCardIntoView();
    });
  }, [result, scrollResultCardIntoView]);

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
  const selectedAdjustmentCodes = useMemo(() => (
    Array.from(new Set([
      ...selectedAdditionCodes,
      ...selectedReductionCodes,
      ...manualAdjustmentCodes
    ])).filter(code => !appliedAdjustmentCodes.has(code))
  ), [appliedAdjustmentCodes, manualAdjustmentCodes, selectedAdditionCodes, selectedReductionCodes]);
  const selectedSpecialConditionCodes = useMemo(() => (
    [mitigationId, residentialSpecialId]
      .filter((code): code is string => Boolean(code && code !== 'acquired_after_violation'))
  ), [mitigationId, residentialSpecialId]);
  const additionOptions = useMemo(
    () => adjustmentOptions.filter(option => option.adjustmentType === 'increase'),
    [adjustmentOptions]
  );
  const reductionOptions = useMemo(
    () => adjustmentOptions.filter(option => option.adjustmentType === 'decrease'),
    [adjustmentOptions]
  );
  const aggravationOptions = useMemo(
    () => specialConditionOptions.filter(option => option.conditionType === 'increase'),
    [specialConditionOptions]
  );
  const mitigationOptions = useMemo(
    () => specialConditionOptions.filter(option => (
      option.conditionType === 'reduction' && MITIGATION_CONDITION_CODES.has(option.code)
    )),
    [specialConditionOptions]
  );
  const residentialSpecialOptions = useMemo(
    () => specialConditionOptions.filter(option => RESIDENTIAL_SPECIAL_CODES.has(option.code)),
    [specialConditionOptions]
  );
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
  const canContinueBuildingInfo = Boolean(
    preparedData &&
    (violationStructureIndexId || preparedData?.reference?.structure?.id) &&
    (violationUseIndexId || preparedData?.reference?.use?.id)
  );
  const canContinueViolationInfo = Boolean(
    violationCode &&
    Number.isFinite(areaNumber) &&
    areaNumber > 0
  );
  const canCalculate =
    Boolean(preparedData) &&
    Boolean(violationCode) &&
    (violationCode !== 'unauthorized_major_repair' || Boolean(majorRepairApprovalType)) &&
    Number.isFinite(areaNumber) &&
    areaNumber > 0 &&
    Boolean(violationStructureIndexId || preparedData?.reference?.structure?.id) &&
    Boolean(violationUseIndexId || preparedData?.reference?.use?.id) &&
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
    setViolationType('');
    setViolationCompletedYear('');
    setViolationStructureIndexId(nextStructureIndexId);
    setViolationUseIndexId('');
    setViolationUseCategoryKey('');
    setExtensionConstructionType('not_applicable');
    setMajorRepairApprovalType('');
    setMajorRepairRoofReductionApplied(false);
    setManualAdjustmentKey('');
    setSelectedAdditionCodes([]);
    setSelectedReductionCodes([]);
    setAggravationId('');
    setMitigationId('');
    setResidentialSpecialId('');
    setAcquiredAfterViolation(false);
    setForProfitPurpose(false);
    setRepeatedViolation(false);
  };

  const clearPreparedCalculation = () => {
    setPreparedData(null);
    setLookupOpen(false);
    setCurrentStep(1);
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

  const handleViolationTypeChange = (nextCode: string) => {
    setViolationType(nextCode);
    setViolationPickerOpen(false);
    if (nextCode !== 'unauthorized_major_repair') {
      setMajorRepairApprovalType('');
      setMajorRepairRoofReductionApplied(false);
    }

    setResult(null);
  };

  const openViolationPicker = () => {
    if (violationTypes.length === 0 && !loadingTypes) void loadViolationTypes();
    setViolationPickerOpen(true);
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

  const loadAdjustmentOptions = async () => {
    setLoadingAdjustments(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/adjustment-options', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: AdjustmentOption[] }>(response);
      setAdjustmentOptions(data.items || []);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '가산·감산 항목을 불러오지 못했습니다.'));
      }
    } finally {
      setLoadingAdjustments(false);
    }
  };

  const loadSpecialConditionOptions = async () => {
    setLoadingSpecialConditions(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/special-condition-options', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: SpecialConditionOption[] }>(response);
      setSpecialConditionOptions(data.items || []);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '가중·감경 항목을 불러오지 못했습니다.'));
      }
    } finally {
      setLoadingSpecialConditions(false);
    }
  };

  const loadExtensionConstructionOptions = async () => {
    setLoadingExtensionConstructionOptions(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/enforcement-fine/extension-construction-options', {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: ExtensionConstructionOption[] }>(response);
      setExtensionConstructionOptions(data.items || []);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, '무허가 증축 기초시공 항목을 불러오지 못했습니다.'));
      }
    } finally {
      setLoadingExtensionConstructionOptions(false);
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
      if (adjustmentOptions.length === 0) {
        await loadAdjustmentOptions();
      }
      if (specialConditionOptions.length === 0) {
        await loadSpecialConditionOptions();
      }
      if (extensionConstructionOptions.length === 0) {
        await loadExtensionConstructionOptions();
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
      setViolationUseIndexId(data.reference?.use?.id || '');
      setViolationUseCategoryKey(getUseCategorySelectionKey(data.reference?.use?.categoryCode));
      setLookupOpen(false);
      setCurrentStep(2);
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
          violationType: violationCode,
          violationCompletedYear: violationCompletedYear ? Number(violationCompletedYear) : undefined,
          violationStructureIndexId: violationStructureIndexId || preparedData.reference?.structure?.id,
          violationUseIndexId: violationUseIndexId || preparedData.reference?.use?.id,
          extensionConstructionType,
          majorRepairApprovalType: majorRepairApprovalType || undefined,
          majorRepairRoofReductionApplied,
          selectedAdjustmentCodes,
          selectedSpecialConditionCodes,
          specialConditionFlags: {
            acquiredAfterViolation: acquiredAfterViolation || mitigationId === 'acquired_after_violation',
            forProfitPurpose: aggravationId === 'for_profit_purpose',
            repeatedViolation: aggravationId === 'repeated_violation'
          },
          ...(areaUnit === 'm2'
            ? { violationAreaM2: areaNumber }
            : { violationAreaPyeong: areaNumber })
        })
      });
      const data = await parseJsonResponse<CalculateResult>(response);
      setResult(data);
      setCurrentStep(4);
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
    setCurrentStep(1);
    resetViolationInputs('');
  };

  return (
    <main className="calc-root bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header ref={headerRef} className="sticky top-2 z-30 flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white/90 px-3 py-3 shadow-sm backdrop-blur sm:top-4 sm:px-4 dark:border-slate-800 dark:bg-slate-900/90">
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
          <div className="order-1 space-y-4">
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm sm:px-4">
              <ol className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  '주소/공시지가',
                  '건물 정보',
                  '추가 사항',
                  '위반 내용'
                ].map((label, index) => {
                  const step = index + 1;
                  const enabled = step === 1 || Boolean(preparedData);
                  return (
                    <li key={label}>
                      <button
                        type="button"
                        disabled={!enabled}
                        onClick={() => enabled && setCurrentStep(step)}
                        className={`group flex min-h-10 w-full items-center gap-2 rounded-md border px-2.5 text-left text-sm transition-colors ${
                          currentStep === step
                            ? 'border-primary bg-primary/5 text-primary'
                            : enabled
                              ? 'border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                              : 'border-transparent text-slate-300'
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                            currentStep === step
                              ? 'bg-primary text-white'
                              : enabled
                                ? 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                                : 'bg-slate-50 text-slate-300'
                          }`}
                        >
                          {step}
                        </span>
                        <span className="break-keep font-medium leading-snug">{label}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>

            {currentStep === 1 ? (
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
            ) : null}

            {currentStep === 2 && preparedData ? (
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
                            violationUseCategoryKey === key
                              ? 'border-primary bg-primary text-white'
                              : 'border-input bg-background text-slate-700 hover:bg-slate-50'
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
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-use" required>세부용도</Label>
                    <select
                      id="wizard-use"
                      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                      value={violationUseIndexId || preparedData.reference?.use?.id || ''}
                      onFocus={() => {
                        if (useOptions.length === 0 && !loadingUses) void loadUseOptions();
                      }}
                      onChange={event => {
                        setViolationUseIndexId(event.target.value);
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
            ) : null}

            {currentStep === 3 && preparedData ? (
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
            ) : null}

            {currentStep === 4 && preparedData ? (
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
            ) : null}
          </div>

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
        </section>

        {result ? (
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/20 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.12)] backdrop-blur lg:hidden">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-primary">예상 이행강제금</div>
                <div className="text-2xl font-bold leading-tight text-slate-950">{formatCurrency(result.result.estimatedFineKrw)}</div>
              </div>
              <button
                type="button"
                className="h-8 shrink-0 rounded-md border border-primary/30 px-2.5 text-xs font-semibold text-primary"
                onClick={() => {
                  setCurrentStep(4);
                  window.setTimeout(() => {
                    scrollResultCardIntoView();
                  }, 0);
                }}
              >
                보기
              </button>
            </div>
          </div>
        ) : null}

      </div>

      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} nextPath={loginNextPath} />
      {violationPickerOpen ? (
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

              <div className="space-y-4">
                {groupedViolationOptions.map(group => (
                  <section key={group.label}>
                    <h3 className="mb-2 rounded-md bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {group.items.map(option => {
                        const selected = violationType === option.code;

                        return (
                          <button
                            key={option.code}
                            type="button"
                            className={[
                              'flex w-full items-start justify-between gap-3 rounded-md border px-3 py-3 text-left text-sm leading-5 transition',
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
      ) : null}
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
