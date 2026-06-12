import type { SupabaseClient } from '@supabase/supabase-js';
import { prepareEnforcementFine } from '@/lib/enforcement-fine/prepare';

const STANDARD_PRICE_YEAR = 2026;
const CALCULATION_VERSION = '2026-v1';
const PYEONG_TO_M2 = 3.305785;

export class UnsupportedCalculationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsupportedCalculationError';
  }
}

type AddressCode = {
  sigunguCd: string;
  bjdongCd: string;
  platGbCd: string;
  bun: string;
  ji: string;
  sigunguName?: string;
  bjdongName?: string;
};

type CalculateInput = {
  address?: string;
  addressCode?: AddressCode;
  roadAddress?: string;
  jibunAddress?: string;
  dongName?: string;
  hoName?: string;
  preparedData?: Record<string, any>;
  violationAreaM2?: number;
  violationAreaPyeong?: number;
  violationType: string;
  violationCompletedYear?: number;
  violationCompletedYearUnknown?: boolean;
  violationStructureIndexId?: string;
  violationUseIndexId?: string;
  extensionConstructionType?: 'with_foundation' | 'without_foundation' | 'without_foundation_multilevel';
  majorRepairApprovalType?: 'permit' | 'report';
  majorRepairRoofReductionApplied?: boolean;
  specialConditionFlags?: {
    acquiredAfterViolation?: boolean;
    forProfitPurpose?: boolean;
    repeatedViolation?: boolean;
  };
  selectedAdjustmentCodes?: string[];
  excludedAppliedAdjustmentCodes?: string[];
  reductionFlags?: Record<string, unknown>;
  increaseFlags?: Record<string, unknown>;
  consultationId?: string;
};

type CalculateContext = {
  supabase: SupabaseClient;
  userId: string;
};

type ReferenceRow = Record<string, any>;

function roundWon(value: number) {
  return Math.floor(value / 1000) * 1000;
}

function parseYearFromDate(value: unknown) {
  const match = String(value ?? '').match(/^(\d{4})/);
  return match ? Number(match[1]) : null;
}

function toDateOrNull(value: unknown) {
  const text = String(value ?? '');
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeArea(input: CalculateInput) {
  if (input.violationAreaM2 && input.violationAreaM2 > 0) {
    return {
      violationAreaM2: input.violationAreaM2,
      violationAreaPyeong: input.violationAreaM2 / PYEONG_TO_M2
    };
  }

  if (input.violationAreaPyeong && input.violationAreaPyeong > 0) {
    return {
      violationAreaM2: input.violationAreaPyeong * PYEONG_TO_M2,
      violationAreaPyeong: input.violationAreaPyeong
    };
  }

  throw new Error('위반면적을 입력해주세요.');
}

function calculateMajorRepairChangedConstructionYear(
  originalConstructionYear: number | null,
  violationCompletedYear: number,
  approvalType: NonNullable<CalculateInput['majorRepairApprovalType']>
) {
  if (!originalConstructionYear) return null;

  const elapsedYears = Math.max(0, violationCompletedYear - originalConstructionYear);
  const elapsedRatio = approvalType === 'permit' ? 0.4 : 0.4 * 0.7;

  return Math.floor(originalConstructionYear + elapsedYears * elapsedRatio);
}

async function getViolationRate(supabase: SupabaseClient, violationType: string) {
  const { data, error } = await supabase
    .from('enforcement_fine_violation_rates')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('code', violationType)
    .maybeSingle();

  if (error) {
    throw new Error(`위반유형 기준 조회에 실패했습니다: ${error.message}`);
  }
  if (!data) {
    throw new Error('지원하지 않는 위반유형입니다.');
  }

  return data as ReferenceRow;
}

async function getDepreciationRate(supabase: SupabaseClient, usefulLifeYears: number, completionYear: number) {
  const { data, error } = await supabase
    .from('standard_price_depreciation_rates')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('useful_life_years', usefulLifeYears)
    .lte('construction_year', completionYear)
    .order('construction_year', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`잔가율 조회에 실패했습니다: ${error.message}`);
  }

  if (data) {
    return data as ReferenceRow;
  }

  const { data: terminalData, error: terminalError } = await supabase
    .from('standard_price_depreciation_rates')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('useful_life_years', usefulLifeYears)
    .order('construction_year', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (terminalError) {
    throw new Error(`잔가율 조회에 실패했습니다: ${terminalError.message}`);
  }
  if (!terminalData) {
    throw new Error('해당 연도와 구조에 맞는 잔가율 기준을 찾지 못했습니다.');
  }

  return terminalData as ReferenceRow;
}

async function getAdjustmentRows(supabase: SupabaseClient, codes: string[]) {
  if (!codes.length) return [];

  const { data, error } = await supabase
    .from('standard_price_adjustment_rates')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .in('code', codes);

  if (error) {
    throw new Error(`가감산율 조회에 실패했습니다: ${error.message}`);
  }

  return (data || []) as ReferenceRow[];
}

async function getStructureById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('standard_price_structure_indices')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`위반부분 구조지수 조회에 실패했습니다: ${error.message}`);
  }

  return data as ReferenceRow | null;
}

async function getUseById(supabase: SupabaseClient, id: string) {
  const { data, error } = await supabase
    .from('standard_price_use_indices')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new Error(`위반부분 용도지수 조회에 실패했습니다: ${error.message}`);
  }

  return data as ReferenceRow | null;
}

async function getBasePriceByCategory(supabase: SupabaseClient, categoryCode: string | null) {
  if (!categoryCode) return null;

  const { data, error } = await supabase
    .from('standard_price_base_prices')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('category_code', categoryCode)
    .maybeSingle();

  if (error) {
    throw new Error(`건물신축가격기준액 조회에 실패했습니다: ${error.message}`);
  }

  return data as ReferenceRow | null;
}

async function getExtensionRatio(
  supabase: SupabaseClient,
  structureNo: number,
  constructionType: NonNullable<CalculateInput['extensionConstructionType']>
) {
  const { data, error } = await supabase
    .from('standard_price_extension_ratios')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('structure_no', structureNo)
    .eq('construction_type', constructionType)
    .maybeSingle();

  if (error) {
    throw new Error(`증축 산정비율 조회에 실패했습니다: ${error.message}`);
  }
  if (!data) {
    throw new Error('해당 구조에 맞는 증축 산정비율을 찾지 못했습니다.');
  }

  return data as ReferenceRow;
}

async function getMajorRepairRatio(
  supabase: SupabaseClient,
  structureNo: number,
  approvalType: NonNullable<CalculateInput['majorRepairApprovalType']>
) {
  const { data, error } = await supabase
    .from('standard_price_major_repair_ratios')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('structure_no', structureNo)
    .eq('approval_type', approvalType)
    .maybeSingle();

  if (error) {
    throw new Error(`대수선 산정비율 조회에 실패했습니다: ${error.message}`);
  }
  if (!data) {
    throw new Error('해당 구조에 맞는 대수선 산정비율을 찾지 못했습니다.');
  }

  return data as ReferenceRow;
}

async function getSpecialConditionRates(supabase: SupabaseClient, codes: string[]) {
  if (!codes.length) return [];

  const { data, error } = await supabase
    .from('enforcement_fine_special_condition_rates')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .in('code', codes);

  if (error) {
    throw new Error(`추가 조건 기준 조회에 실패했습니다: ${error.message}`);
  }

  return (data || []) as ReferenceRow[];
}

function getPreparedAdjustmentCodes(input: CalculateInput, preparedData: Record<string, any>) {
  const excluded = new Set(input.excludedAppliedAdjustmentCodes || []);
  const autoCodes = ((preparedData.adjustmentCandidates?.applied || []) as Array<{ code?: string }>)
    .map(row => row.code)
    .filter((code): code is string => Boolean(code && !excluded.has(code)));
  const selectedCodes = input.selectedAdjustmentCodes || [];
  return Array.from(new Set([...autoCodes, ...selectedCodes]));
}

function buildAdjustmentRate(adjustmentRows: ReferenceRow[]) {
  const increaseRate = adjustmentRows
    .filter(row => row.adjustment_type === 'increase')
    .reduce((sum, row) => sum + Number(row.rate || 0), 0);
  const decreaseRate = adjustmentRows
    .filter(row => row.adjustment_type === 'decrease')
    .reduce((sum, row) => sum + Number(row.rate || 0), 0);

  return {
    increaseRate,
    decreaseRate,
    adjustmentRate: Math.max(0, 1 + increaseRate - decreaseRate)
  };
}

function requireNumber(value: unknown, message: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(message);
  }
  return parsed;
}

function isForProfitIncreaseApplicable(input: CalculateInput, violationAreaM2: number) {
  if (!input.specialConditionFlags?.forProfitPurpose) return false;
  if (input.specialConditionFlags?.acquiredAfterViolation) return false;
  if (violationAreaM2 <= 50) return false;

  return [
    'unauthorized_extension',
    'unreported_extension',
    'unauthorized_use_change'
  ].includes(input.violationType);
}

function isOfficetel(preparedData: Record<string, any>) {
  const useRef = preparedData.reference?.use;
  const useText = [
    useRef?.categoryName,
    useRef?.mainUse,
    useRef?.detailUse,
    preparedData.selectedUnit?.mainUse,
    preparedData.selectedUnit?.detailUse,
    preparedData.building?.mainUse,
    preparedData.building?.detailUse
  ].filter(Boolean).join(' ');

  return String(useRef?.detailUse || '').includes('오피스텔') ||
    String(useRef?.mainUse || '').includes('오피스텔') ||
    String(useText).includes('오피스텔') ||
    (useRef?.categoryCode === 'I' && String(useRef?.useNo) === '7') ||
    (useRef?.categoryCode === 'II' && String(useRef?.useNo) === '21');
}

function getSelectedSpecialConditionCodes(input: CalculateInput, violationAreaM2: number) {
  const flags = input.specialConditionFlags || {};
  return [
    ...(flags.acquiredAfterViolation ? ['acquired_after_violation'] : []),
    ...(isForProfitIncreaseApplicable(input, violationAreaM2) ? ['for_profit_purpose'] : []),
    ...(flags.repeatedViolation && !flags.acquiredAfterViolation ? ['repeated_violation'] : [])
  ];
}

function isResidentialBuilding(preparedData: Record<string, any>) {
  const useText = [
    preparedData.selectedUnit?.mainUse,
    preparedData.selectedUnit?.detailUse,
    preparedData.building?.mainUse,
    preparedData.building?.detailUse
  ].filter(Boolean).join(' ');

  return /주택|공동주택|단독주택|다가구|다세대|연립|아파트|주거용/.test(useText);
}

function isBuildingActAppendixResidentialGroup(preparedData: Record<string, any>) {
  const useText = [
    preparedData.selectedUnit?.mainUse,
    preparedData.selectedUnit?.detailUse,
    preparedData.building?.mainUse,
    preparedData.building?.detailUse
  ].filter(Boolean).join(' ');

  return /단독주택|공동주택|다가구|다세대|연립|아파트|기숙사|다중생활시설|노인복지주택|주거용/.test(useText);
}

function isCollectiveBuilding(preparedData: Record<string, any>) {
  const registerKind = String(preparedData.building?.registerKind || '');
  return Boolean(preparedData.selectedUnit) || registerKind.includes('집합');
}

function getSmallResidentialArea(preparedData: Record<string, any>) {
  return preparedData.selectedUnit?.exclusiveAreaM2 || preparedData.building?.totalAreaM2 || null;
}

function getAutoSpecialConditionCodes(input: CalculateInput, preparedData: Record<string, any>, violationAreaM2: number) {
  const codes: string[] = [];
  const residential = isResidentialBuilding(preparedData);
  const residentialGroup = isBuildingActAppendixResidentialGroup(preparedData);
  const smallResidentialArea = getSmallResidentialArea(preparedData);
  const collective = isCollectiveBuilding(preparedData);

  if (residential && smallResidentialArea && Number(smallResidentialArea) <= 60) {
    codes.push('article80_small_residential_half');
  }
  if (residentialGroup && !collective && violationAreaM2 <= 30) {
    codes.push('article80_2_violation_area_30_or_less');
  }
  if (residentialGroup && collective && violationAreaM2 <= 5) {
    codes.push('article80_2_collective_owner_area_5_or_less');
  }
  if (residential && input.violationType === 'use_without_approval') {
    codes.push('article80_use_without_approval_residential_half');
  }
  if (residential && input.violationType === 'landscape_violation') {
    codes.push('article80_landscape_residential_half');
  }
  if (residential && input.violationType === 'height_limit_violation') {
    codes.push('article80_height_residential_half');
  }
  if (residential && input.violationType === 'sunlight_height_violation') {
    codes.push('article80_sunlight_residential_half');
  }
  if (residential && input.violationCompletedYear && input.violationCompletedYear < 1992) {
    codes.push(
      smallResidentialArea && Number(smallResidentialArea) <= 85
        ? 'article80_2_pre_19920601_residential_85_or_less'
        : 'article80_2_pre_19920601_residential_over_85'
    );
  }

  return codes;
}

function isArticle80SpecialCase(code: string) {
  return [
    'article80_small_residential_half',
    'article80_use_without_approval_residential_half',
    'article80_landscape_residential_half',
    'article80_height_residential_half',
    'article80_sunlight_residential_half',
    'article80_ordinance_residential_half'
  ].includes(code);
}

function buildSpecialConditionBasis(
  input: CalculateInput,
  specialConditionRows: ReferenceRow[],
  baseFine: number,
  autoCodes: string[],
  violationAreaM2: number
) {
  const selectedCodes = new Set([...getSelectedSpecialConditionCodes(input, violationAreaM2), ...autoCodes]);
  const userSelectedCodes = new Set(getSelectedSpecialConditionCodes(input, violationAreaM2));
  const selectedRows = specialConditionRows.filter(row => selectedCodes.has(String(row.code)));

  const reductionRows = selectedRows.filter(row => (
    row.condition_type === 'reduction' && !isArticle80SpecialCase(String(row.code))
  ));
  const specialCaseRows = selectedRows.filter(row => (
    row.condition_type === 'reduction' && isArticle80SpecialCase(String(row.code))
  ));
  const reductionMultipliers = reductionRows
    .map(row => Number(row.multiplier || 1));
  const specialCaseMultipliers = specialCaseRows
    .map(row => Number(row.multiplier || 1));
  const increaseRates = selectedRows
    .filter(row => row.condition_type === 'increase')
    .map(row => Number(row.rate || 0));
  const reductionMultiplier = reductionMultipliers.length
    ? Math.min(...reductionMultipliers)
    : 1;
  const specialCaseMultiplier = specialCaseMultipliers.length
    ? Math.min(...specialCaseMultipliers)
    : 1;
  const combinedReductionMultiplier = reductionMultiplier * specialCaseMultiplier;
  const combinedIncreaseRate = Math.min(
    1,
    increaseRates.reduce((sum, rate) => sum + rate, 0)
  );
  const increaseMultiplier = 1 + combinedIncreaseRate;

  return {
    flags: {
      acquiredAfterViolation: selectedCodes.has('acquired_after_violation'),
      forProfitPurpose: selectedCodes.has('for_profit_purpose'),
      forProfitPurposeRequested: Boolean(input.specialConditionFlags?.forProfitPurpose),
      forProfitPurposeApplicable: isForProfitIncreaseApplicable(input, violationAreaM2),
      repeatedViolation: selectedCodes.has('repeated_violation'),
      smallResidentialHalf: selectedCodes.has('article80_small_residential_half'),
      useWithoutApprovalResidentialHalf: selectedCodes.has('article80_use_without_approval_residential_half'),
      landscapeResidentialHalf: selectedCodes.has('article80_landscape_residential_half'),
      heightResidentialHalf: selectedCodes.has('article80_height_residential_half'),
      sunlightResidentialHalf: selectedCodes.has('article80_sunlight_residential_half'),
      ordinanceResidentialHalf: selectedCodes.has('article80_ordinance_residential_half'),
      violationArea30OrLess: selectedCodes.has('article80_2_violation_area_30_or_less'),
      collectiveOwnerArea5OrLess: selectedCodes.has('article80_2_collective_owner_area_5_or_less'),
      pre19920601Residential: selectedCodes.has('article80_2_pre_19920601_residential_85_or_less') ||
        selectedCodes.has('article80_2_pre_19920601_residential_over_85')
    },
    selectedCodes: Array.from(selectedCodes),
    autoCodes,
    reductionMultiplier,
    specialCaseMultiplier,
    combinedReductionMultiplier,
    combinedIncreaseRate,
    increaseMultiplier,
    reductionCandidateFineKrw: combinedReductionMultiplier < 1
      ? roundWon(baseFine * combinedReductionMultiplier)
      : null,
    increaseCandidateFineKrw: increaseMultiplier > 1
      ? roundWon(baseFine * increaseMultiplier)
      : null,
    items: selectedRows
      .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0))
      .map(row => ({
        id: row.id,
        code: row.code,
        label: row.label,
        type: row.condition_type,
        rate: Number(row.rate),
        multiplier: Number(row.multiplier),
        sourceType: userSelectedCodes.has(String(row.code)) ? 'user_selected' : 'auto',
        note: row.description,
        source: row.source,
        sourceDetail: row.source_detail
      }))
  };
}

export async function calculateEnforcementFine(input: CalculateInput, context: CalculateContext) {
  const preparedData = input.preparedData || await prepareEnforcementFine({
    address: input.address,
    addressCode: input.addressCode,
    roadAddress: input.roadAddress,
    jibunAddress: input.jibunAddress,
    dongName: input.dongName,
    hoName: input.hoName
  });

  const { violationAreaM2, violationAreaPyeong } = normalizeArea(input);
  const warnings = [...((preparedData.warnings || []) as string[])];

  if (isOfficetel(preparedData)) {
    throw new UnsupportedCalculationError(
      '오피스텔은 별도 시가표준액 산식이 적용되어 현재 이행강제금 계산 대상에서 제외됩니다.'
    );
  }

  const violationRate = await getViolationRate(context.supabase, input.violationType);
  const structure = preparedData.reference?.structure;
  const use = preparedData.reference?.use;
  const location = preparedData.reference?.location;
  const basePrice = preparedData.reference?.basePrice;

  if (input.violationType === 'unauthorized_use_change' && !input.violationUseIndexId) {
    throw new Error('무단 용도변경은 변경 후 용도를 선택해야 계산할 수 있습니다.');
  }

  const selectedViolationStructure = input.violationStructureIndexId
    ? await getStructureById(context.supabase, input.violationStructureIndexId)
    : null;
  const selectedViolationUse = input.violationUseIndexId
    ? await getUseById(context.supabase, input.violationUseIndexId)
    : null;
  const appliedUse = input.violationType === 'unauthorized_use_change' && selectedViolationUse
    ? {
        id: selectedViolationUse.id,
        categoryCode: selectedViolationUse.category_code,
        categoryName: selectedViolationUse.category_name,
        mainUse: selectedViolationUse.main_use,
        useNo: selectedViolationUse.use_no,
        detailUse: selectedViolationUse.detail_use,
        index: Number(selectedViolationUse.use_index)
      }
    : use;
  const appliedBasePrice = appliedUse?.categoryCode && appliedUse.categoryCode !== basePrice?.categoryCode
    ? await getBasePriceByCategory(context.supabase, appliedUse.categoryCode)
    : null;
  const basePriceKrwPerM2 = requireNumber(
    appliedBasePrice?.base_price_krw_per_m2 ?? basePrice?.krwPerM2,
    '건물신축가격기준액을 찾지 못했습니다.'
  );
  const violationStructure = selectedViolationStructure
    ? {
        id: selectedViolationStructure.id,
        structure_no: selectedViolationStructure.structure_no,
        structure_name: selectedViolationStructure.structure_name,
        structure_index: selectedViolationStructure.structure_index,
        useful_life_years: selectedViolationStructure.useful_life_years
      }
    : {
        id: structure?.id,
        structure_no: structure?.structureNo,
        structure_name: structure?.name,
        structure_index: structure?.index,
        useful_life_years: structure?.usefulLifeYears
      };

  const structureIndex = requireNumber(violationStructure.structure_index, '구조지수를 찾지 못했습니다.');
  const useIndex = requireNumber(appliedUse?.index, '용도지수를 찾지 못했습니다.');
  const locationIndex = requireNumber(location?.index, '위치지수를 찾지 못했습니다.');
  const usefulLifeYears = requireNumber(violationStructure.useful_life_years, '구조별 내용연수를 찾지 못했습니다.');
  const violationStructureNo = requireNumber(violationStructure.structure_no, '구조번호를 찾지 못했습니다.');

  const buildingApprovalYear = parseYearFromDate(preparedData.building?.useApprovalDate);
  const completionYear = input.violationCompletedYear || buildingApprovalYear || STANDARD_PRICE_YEAR;

  if (!input.violationCompletedYear) {
    warnings.push(
      buildingApprovalYear
        ? '위반완료연도를 입력하지 않아 건물 사용승인연도를 잔가율 산정에 임시 적용했습니다.'
        : '위반완료연도와 사용승인연도를 확인하지 못해 현재 기준연도를 잔가율 산정에 임시 적용했습니다.'
    );
  }

  if (violationRate.requires_local_ordinance) {
    warnings.push('해당 위반유형은 지자체 조례에 따라 실제 부과율 또는 감경률이 달라질 수 있습니다.');
  }
  if (violationRate.requires_user_confirmation) {
    warnings.push('해당 위반유형은 건축물대장 변동사항 또는 담당자 확인이 필요한 추정 계산입니다.');
  }

  const adjustmentCodes = getPreparedAdjustmentCodes(input, preparedData);
  const autoAdjustmentCodes = ((preparedData.adjustmentCandidates?.applied || []) as Array<{ code?: string }>)
    .map(row => row.code)
    .filter((code): code is string => Boolean(code));
  const selectedAdjustmentCodes = input.selectedAdjustmentCodes || [];
  const autoSpecialConditionCodes = getAutoSpecialConditionCodes(input, preparedData, violationAreaM2);
  const selectedSpecialConditionCodes = getSelectedSpecialConditionCodes(input, violationAreaM2);
  const specialConditionCodes = Array.from(new Set([
    ...selectedSpecialConditionCodes,
    ...autoSpecialConditionCodes
  ]));
  const [adjustmentRows, specialConditionRows] = await Promise.all([
    getAdjustmentRows(context.supabase, adjustmentCodes),
    getSpecialConditionRates(context.supabase, specialConditionCodes)
  ]);
  const { increaseRate, decreaseRate, adjustmentRate } = buildAdjustmentRate(adjustmentRows);
  const formulaType = String(violationRate.formula_type);
  const extensionConstructionType = input.extensionConstructionType || 'without_foundation';
  const majorRepairApprovalType = input.majorRepairApprovalType || 'report';

  const extensionRatio = formulaType === 'extension_area'
    ? await getExtensionRatio(context.supabase, violationStructureNo, extensionConstructionType)
    : null;
  const majorRepairRatio = input.violationType === 'unauthorized_major_repair'
    ? await getMajorRepairRatio(context.supabase, violationStructureNo, majorRepairApprovalType)
    : null;
  const majorRepairChangedConstructionYear = majorRepairRatio
    ? calculateMajorRepairChangedConstructionYear(buildingApprovalYear, completionYear, majorRepairApprovalType)
    : null;
  const depreciationYear = majorRepairChangedConstructionYear || completionYear;
  const depreciation = await getDepreciationRate(context.supabase, usefulLifeYears, depreciationYear);

  if (formulaType === 'extension_area' && !input.extensionConstructionType) {
    warnings.push('증축 산정비율은 기본값으로 기초공사를 하지 않은 건축물 기준을 적용했습니다.');
  }
  if (input.violationType === 'unauthorized_major_repair' && !input.majorRepairApprovalType) {
    warnings.push('대수선 산정비율은 기본값으로 대수선 신고 대상 기준을 적용했습니다.');
  }
  if (majorRepairRatio && !buildingApprovalYear) {
    warnings.push('대수선 변경 잔가율 산정에 필요한 건물 사용승인연도를 확인하지 못해 위반완료연도를 잔가율 산정에 적용했습니다.');
  }

  const standardPriceRawPerM2 =
    basePriceKrwPerM2 *
    structureIndex *
    useIndex *
    locationIndex *
    Number(depreciation.depreciation_rate) *
    adjustmentRate;
  const standardPriceKrwPerM2 = roundWon(standardPriceRawPerM2);
  const specialStandardValueRatio = extensionRatio
    ? Number(extensionRatio.ratio)
    : majorRepairRatio
      ? Number(majorRepairRatio.ratio) * (input.majorRepairRoofReductionApplied
        ? 1 - Number(majorRepairRatio.roof_repair_reduction_rate || 0)
        : 1)
      : 1;
  // Excel formula: ROUNDDOWN(ROUNDDOWN(perM2 × area × majorRepairRatio, -3) × extensionRatio, -3)
  // Inner ROUNDDOWN covers (perM2 × area × AD13), outer ROUNDDOWN covers (× C8 extensionRatio).
  // Per-m² is NOT rounded before multiplying by area.
  const buildingStandardValueKrw = extensionRatio
    ? roundWon(roundWon(standardPriceRawPerM2 * violationAreaM2) * Number(extensionRatio.ratio))
    : roundWon(standardPriceRawPerM2 * violationAreaM2 * specialStandardValueRatio);

  const baseFineRate = violationRate.base_fine_rate === null ? null : Number(violationRate.base_fine_rate);
  const contentRate = Number(violationRate.violation_rate);

  const estimatedFineKrw = formulaType === 'extension_area'
    ? roundWon(buildingStandardValueKrw * Number(baseFineRate) * contentRate)
    : roundWon(buildingStandardValueKrw * contentRate);

  const statutoryFineMinKrw = violationRate.min_violation_rate !== null
    ? roundWon(buildingStandardValueKrw * Number(violationRate.min_violation_rate))
    : estimatedFineKrw;
  const statutoryFineMaxKrw = violationRate.max_violation_rate !== null
    ? roundWon(buildingStandardValueKrw * Number(violationRate.max_violation_rate))
    : estimatedFineKrw;
  const specialConditions = buildSpecialConditionBasis(
    input,
    specialConditionRows,
    estimatedFineKrw,
    autoSpecialConditionCodes,
    violationAreaM2
  );
  const estimatedFineMinKrw = Math.min(
    statutoryFineMinKrw,
    specialConditions.reductionCandidateFineKrw ?? statutoryFineMinKrw
  );
  const estimatedFineMaxKrw = Math.max(
    statutoryFineMaxKrw,
    specialConditions.increaseCandidateFineKrw ?? statutoryFineMaxKrw
  );

  if (specialConditions.items.length > 0) {
    warnings.push('추가 조건은 감경·가중 후보로 반영했으며, 실제 적용은 상담 단계에서 확인이 필요합니다.');
  }
  if (input.specialConditionFlags?.forProfitPurpose && !specialConditions.flags.forProfitPurposeApplicable) {
    warnings.push('영리 목적 가중은 공식 계산기 기준상 위반면적 50㎡ 초과의 불법 용도변경 또는 불법 신축·증축 등에서 적용 후보로 봅니다. 현재 입력값에서는 예상범위에 반영하지 않았습니다.');
  }
  if (input.specialConditionFlags?.acquiredAfterViolation && (
    input.specialConditionFlags?.forProfitPurpose ||
    input.specialConditionFlags?.repeatedViolation
  )) {
    warnings.push('위반 후 소유권이 변경된 경우 공식 기준상 가중 적용 제외 대상이므로 영리 목적·반복 위반 가중 후보는 예상범위에 반영하지 않았습니다.');
  }

  const calculationBasis = {
    calculationVersion: CALCULATION_VERSION,
    formulaType,
    formula: formulaType === 'extension_area'
      ? '1㎡ 시가표준액 × 증축 산정비율 × 위반면적 × 50% × 위반유형 비율'
      : majorRepairRatio
        ? '1㎡ 시가표준액 × 대수선 산정비율 × 위반면적 × 위반유형 비율'
        : '위반부분 시가표준액 × 위반유형 비율',
    violation: {
      code: violationRate.code,
      label: violationRate.label,
      baseFineRate,
      violationRate: contentRate,
      minViolationRate: violationRate.min_violation_rate,
      maxViolationRate: violationRate.max_violation_rate
    },
    standardPrice: {
      year: STANDARD_PRICE_YEAR,
      basePriceKrwPerM2,
      structureIndex,
      structureName: violationStructure.structure_name || null,
      structureNo: violationStructureNo || null,
      useIndex,
      useName: appliedUse?.detailUse || appliedUse?.mainUse || null,
      useCategoryCode: appliedUse?.categoryCode || null,
      useCategoryName: appliedUse?.categoryName || null,
      changedUseApplied: input.violationType === 'unauthorized_use_change',
      locationIndex,
      depreciationRate: Number(depreciation.depreciation_rate),
      depreciationYear,
      adjustmentRate,
      increaseRate,
      decreaseRate,
      specialStandardValueRatio,
      extensionRatio: extensionRatio
        ? {
            id: extensionRatio.id,
            constructionType: extensionRatio.construction_type,
            label: extensionRatio.label,
            ratio: Number(extensionRatio.ratio)
          }
        : null,
      majorRepairRatio: majorRepairRatio
        ? {
            id: majorRepairRatio.id,
            approvalType: majorRepairRatio.approval_type,
            label: majorRepairRatio.label,
            ratio: Number(majorRepairRatio.ratio),
            changedConstructionYear: majorRepairChangedConstructionYear,
            roofRepairReductionApplied: Boolean(input.majorRepairRoofReductionApplied),
            roofRepairReductionRate: Number(majorRepairRatio.roof_repair_reduction_rate || 0)
          }
        : null,
      standardPriceKrwPerM2,
      buildingStandardValueKrw
    },
    area: {
      violationAreaM2,
      violationAreaPyeong
    },
    years: {
      violationCompletedYear: input.violationCompletedYear || null,
      appliedCompletionYear: completionYear,
      appliedDepreciationYear: depreciationYear,
      majorRepairChangedConstructionYear,
      buildingApprovalYear
    },
    adjustments: adjustmentRows.map(row => ({
      code: row.code,
      type: row.adjustment_type,
      label: row.label,
      rate: Number(row.rate),
      sourceType: selectedAdjustmentCodes.includes(String(row.code))
        ? 'user_selected'
        : autoAdjustmentCodes.includes(String(row.code))
          ? 'auto'
          : 'system'
    })),
    adjustmentSource: {
      autoAppliedCodes: autoAdjustmentCodes,
      userSelectedCodes: selectedAdjustmentCodes,
      appliedCodes: adjustmentCodes
    },
    specialConditions,
    warnings
  };

  const apiSnapshot = {
    preparedData,
    selectedAdjustmentCodes: input.selectedAdjustmentCodes || [],
    excludedAppliedAdjustmentCodes: input.excludedAppliedAdjustmentCodes || [],
    violationStructureIndexId: input.violationStructureIndexId || null,
    violationUseIndexId: input.violationUseIndexId || null,
    extensionConstructionType,
    majorRepairApprovalType,
    majorRepairRoofReductionApplied: Boolean(input.majorRepairRoofReductionApplied),
    specialConditionFlags: specialConditions.flags
  };

  const row = {
    user_id: context.userId,
    consultation_id: input.consultationId || null,
    address: preparedData.address?.roadAddress || preparedData.address?.jibunAddress || input.address || '',
    road_address: preparedData.address?.roadAddress || input.roadAddress || null,
    jibun_address: preparedData.address?.jibunAddress || input.jibunAddress || null,
    pnu: preparedData.address?.pnu || null,
    sigungu_cd: preparedData.address?.sigunguCd || input.addressCode?.sigunguCd || null,
    bjdong_cd: preparedData.address?.bjdongCd || input.addressCode?.bjdongCd || null,
    plat_gb_cd: preparedData.address?.platGbCd || input.addressCode?.platGbCd || null,
    bun: preparedData.address?.bun || input.addressCode?.bun || null,
    ji: preparedData.address?.ji || input.addressCode?.ji || null,
    violation_area_m2: violationAreaM2,
    violation_area_pyeong: violationAreaPyeong,
    violation_type: input.violationType,
    violation_completed_year: input.violationCompletedYear || null,
    violation_completed_year_unknown: Boolean(input.violationCompletedYearUnknown || !input.violationCompletedYear),
    building_main_use: preparedData.selectedUnit?.mainUse || preparedData.building?.mainUse || null,
    building_detail_use: preparedData.selectedUnit?.detailUse || preparedData.building?.detailUse || null,
    building_structure: preparedData.selectedUnit?.structure || preparedData.building?.structure || null,
    building_use_approval_date: toDateOrNull(preparedData.building?.useApprovalDate),
    building_total_area_m2: preparedData.building?.totalAreaM2 || null,
    building_household_count: preparedData.building?.householdCount || null,
    structure_index_id: structure?.id || null,
    use_index_id: use?.id || null,
    location_index_id: location?.id || null,
    depreciation_rate_id: depreciation.id,
    violation_rate_id: violationRate.id,
    violation_structure_index_id: violationStructure.id || null,
    violation_use_index_id: appliedUse?.id || null,
    extension_ratio_id: extensionRatio?.id || null,
    major_repair_ratio_id: majorRepairRatio?.id || null,
    formula_type: formulaType,
    calculation_version: CALCULATION_VERSION,
    structure_name: violationStructure.structure_name || null,
    structure_index: structureIndex,
    useful_life_years: usefulLifeYears,
    use_name: use?.detailUse || use?.mainUse || null,
    use_index: use?.index || null,
    violation_structure_no: violationStructureNo || null,
    violation_structure_name: violationStructure.structure_name || null,
    violation_structure_index: structureIndex,
    violation_use_name: appliedUse?.detailUse || appliedUse?.mainUse || null,
    violation_use_index: useIndex,
    extension_construction_type: extensionRatio ? extensionConstructionType : null,
    extension_standard_value_ratio: extensionRatio ? Number(extensionRatio.ratio) : null,
    major_repair_approval_type: majorRepairRatio ? majorRepairApprovalType : null,
    major_repair_standard_value_ratio: majorRepairRatio ? Number(majorRepairRatio.ratio) : null,
    major_repair_changed_construction_year: majorRepairChangedConstructionYear,
    major_repair_roof_reduction_applied: Boolean(input.majorRepairRoofReductionApplied && majorRepairRatio),
    small_residential_reduction_applied: adjustmentCodes.some(code => (
      code === 'single_house_area_60_to_85' ||
      code === 'single_house_area_60_or_less'
    )),
    small_residential_reduction_rate: adjustmentRows
      .filter(row => row.code === 'single_house_area_60_to_85' || row.code === 'single_house_area_60_or_less')
      .reduce((sum, row) => sum + Number(row.rate || 0), 0) || null,
    land_price_krw_per_m2: preparedData.reference?.landPrice?.landPriceKrwPerM2 || null,
    location_index: locationIndex,
    depreciation_rate: Number(depreciation.depreciation_rate),
    base_price_krw_per_m2: basePriceKrwPerM2,
    adjustment_rate: adjustmentRate,
    standard_price_krw_per_m2: standardPriceKrwPerM2,
    building_standard_value_krw: buildingStandardValueKrw,
    base_fine_rate: baseFineRate,
    violation_rate: contentRate,
    estimated_fine_krw: estimatedFineKrw,
    estimated_fine_min_krw: estimatedFineMinKrw,
    estimated_fine_max_krw: estimatedFineMaxKrw,
    reduction_flags: {
      ...(input.reductionFlags || {}),
      acquiredAfterViolation: specialConditions.flags.acquiredAfterViolation,
      ownershipChangeReductionRate: specialConditions.flags.acquiredAfterViolation
        ? specialConditions.items.find(item => item.code === 'acquired_after_violation')?.rate ?? null
        : null
    },
    increase_flags: {
      ...(input.increaseFlags || {}),
      forProfitPurpose: specialConditions.flags.forProfitPurpose,
      repeatedViolation: specialConditions.flags.repeatedViolation,
      profitPurposeIncreaseRate: specialConditions.flags.forProfitPurpose
        ? specialConditions.items.find(item => item.code === 'for_profit_purpose')?.rate ?? null
        : null,
      repeatedViolationIncreaseRate: specialConditions.flags.repeatedViolation
        ? specialConditions.items.find(item => item.code === 'repeated_violation')?.rate ?? null
        : null
    },
    calculation_basis: calculationBasis,
    api_snapshot: apiSnapshot
  };

  const { data: savedEstimate, error: insertError } = await context.supabase
    .from('enforcement_fine_estimates')
    .insert(row)
    .select('*')
    .single();

  if (insertError) {
    throw new Error(`계산 결과 저장에 실패했습니다: ${insertError.message}`);
  }

  return {
    estimateId: savedEstimate.id,
    result: {
      estimatedFineKrw,
      estimatedFineMinKrw,
      estimatedFineMaxKrw,
      standardPriceKrwPerM2,
      buildingStandardValueKrw,
      formulaType,
      violationLabel: violationRate.label,
      warnings
    },
    calculationBasis,
    savedEstimate
  };
}
