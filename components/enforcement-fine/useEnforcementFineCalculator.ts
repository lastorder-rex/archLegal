'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSession } from '@supabase/auth-helpers-react';
import type { AddressSearchResult } from '@/lib/validations/consultation';
import {
  EXTENSION_VIOLATION_GROUP_CODE,
  MITIGATION_CONDITION_CODES,
  RESIDENTIAL_SPECIAL_CODES,
  VIOLATION_CATEGORY_CODES,
  VIOLATION_CATEGORY_OPTIONS,
  type ManualAdjustmentKey
} from '@/lib/enforcement-fine/calculator-constants';
import {
  formatArea,
  formatCurrencyPerM2,
  formatDecimal,
  getErrorMessage,
  getManualAdjustmentCodes,
  getUseCategorySelectionKey,
  parseJsonResponse,
  type CalculateResult,
  type PreparedData
} from '@/lib/enforcement-fine/calculator-helpers';

export type ViolationType = {
  code: string;
  label: string;
  formulaType: string;
  baseFineRate: number | null;
  violationRate: number;
  requiresLocalOrdinance: boolean;
  requiresUserConfirmation: boolean;
  description?: string | null;
};

export type StructureOption = {
  id: string;
  structureNo: number;
  name: string;
  index: number;
  usefulLifeYears: number;
};

export type UseOption = {
  id: string;
  categoryCode: string;
  categoryName: string;
  mainUse: string;
  useNo: string;
  detailUse: string;
  index: number;
};

export type AdjustmentOption = {
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

export type SpecialConditionOption = {
  code: string;
  label: string;
  conditionType: 'increase' | 'reduction';
  rate: number;
  multiplier: number;
  requiresUserConfirmation: boolean;
  sortOrder: number;
  description?: string | null;
};

export type ExtensionConstructionOption = {
  code: string;
  label: string;
  sortOrder: number;
};

export type AreaUnit = 'm2' | 'pyeong';

export function useEnforcementFineCalculator() {
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
  const [useCategoryManuallyChanged, setUseCategoryManuallyChanged] = useState(false);
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
  const [authError, setAuthError] = useState<string | null>(null);
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

  useEffect(() => {
    const url = new URL(window.location.href);
    const authErrorCode = url.searchParams.get('auth_error');

    if (!authErrorCode) return;

    setAuthError(authErrorCode);
    setLoginOpen(true);
    url.searchParams.delete('auth_error');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

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
  const automaticUseCategoryKey = getUseCategorySelectionKey(reference?.use?.categoryCode);
  const displayedUseCategoryKey = useCategoryManuallyChanged
    ? violationUseCategoryKey
    : automaticUseCategoryKey || violationUseCategoryKey;
  const displayedUseIndexId = violationUseIndexId || (!useCategoryManuallyChanged ? reference?.use?.id || '' : '');
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
    if (!displayedUseCategoryKey) return [];
    const filtered = displayedUseCategoryKey === 'other'
      ? useOptions.filter(item => item.categoryCode !== 'I' && item.categoryCode !== 'II')
      : useOptions.filter(item => item.categoryCode === displayedUseCategoryKey);
    const map = new Map<string, UseOption[]>();
    filtered.forEach(item => {
      const key = displayedUseCategoryKey === 'other'
        ? `${item.categoryName} · ${item.mainUse}`
        : item.mainUse;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    });
    return Array.from(map.entries());
  }, [useOptions, displayedUseCategoryKey]);

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
    setUseCategoryManuallyChanged(false);
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
    setDongName(nextAddress.dongName || '');
    setHoName(nextAddress.hoName || '');
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

  const loadOptions = async <T,>({
    url,
    setLoading,
    setItems,
    errorMessage
  }: {
    url: string;
    setLoading: (loading: boolean) => void;
    setItems: (items: T[]) => void;
    errorMessage: string;
  }) => {
    setLoading(true);
    setErrorMessage('');

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include'
      });
      const data = await parseJsonResponse<{ items: T[] }>(response);
      setItems(data.items || []);
    } catch (error) {
      if (!handleUnauthorized(error as Error & { status?: number })) {
        setErrorMessage(getErrorMessage(error, errorMessage));
      }
    } finally {
      setLoading(false);
    }
  };

  const loadViolationTypes = () =>
    loadOptions<ViolationType>({
      url: '/api/enforcement-fine/violation-types',
      setLoading: setLoadingTypes,
      setItems: setViolationTypes,
      errorMessage: '위반유형을 불러오지 못했습니다.'
    });

  const loadStructureOptions = () =>
    loadOptions<StructureOption>({
      url: '/api/enforcement-fine/structure-options',
      setLoading: setLoadingStructures,
      setItems: setStructureOptions,
      errorMessage: '구조지수 목록을 불러오지 못했습니다.'
    });

  const loadUseOptions = () =>
    loadOptions<UseOption>({
      url: '/api/enforcement-fine/use-options',
      setLoading: setLoadingUses,
      setItems: setUseOptions,
      errorMessage: '용도지수 목록을 불러오지 못했습니다.'
    });

  const loadAdjustmentOptions = () =>
    loadOptions<AdjustmentOption>({
      url: '/api/enforcement-fine/adjustment-options',
      setLoading: setLoadingAdjustments,
      setItems: setAdjustmentOptions,
      errorMessage: '가산·감산 항목을 불러오지 못했습니다.'
    });

  const loadSpecialConditionOptions = () =>
    loadOptions<SpecialConditionOption>({
      url: '/api/enforcement-fine/special-condition-options',
      setLoading: setLoadingSpecialConditions,
      setItems: setSpecialConditionOptions,
      errorMessage: '가중·감경 항목을 불러오지 못했습니다.'
    });

  const loadExtensionConstructionOptions = () =>
    loadOptions<ExtensionConstructionOption>({
      url: '/api/enforcement-fine/extension-construction-options',
      setLoading: setLoadingExtensionConstructionOptions,
      setItems: setExtensionConstructionOptions,
      errorMessage: '무허가 증축 기초시공 항목을 불러오지 못했습니다.'
    });

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
      setUseCategoryManuallyChanged(false);
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

  return {
    // refs
    headerRef,
    resultCardRef,
    // session
    session,
    // address / building-info state
    address,
    selectedAddress,
    dongName,
    setDongName,
    hoName,
    setHoName,
    building,
    selectedUnit,
    reference,
    preparedData,
    // violation-info state + setters
    areaUnit,
    setAreaUnit,
    violationArea,
    setViolationArea,
    violationType,
    violationCompletedYear,
    setViolationCompletedYear,
    violationStructureIndexId,
    setViolationStructureIndexId,
    setViolationUseIndexId,
    setViolationUseCategoryKey,
    setUseCategoryManuallyChanged,
    extensionConstructionType,
    setExtensionConstructionType,
    majorRepairApprovalType,
    setMajorRepairApprovalType,
    majorRepairRoofReductionApplied,
    setMajorRepairRoofReductionApplied,
    selectedAdditionCodes,
    setSelectedAdditionCodes,
    selectedReductionCodes,
    setSelectedReductionCodes,
    aggravationId,
    setAggravationId,
    mitigationId,
    setMitigationId,
    residentialSpecialId,
    setResidentialSpecialId,
    setAcquiredAfterViolation,
    setResult,
    // options data
    structureOptions,
    useOptions,
    specialConditionOptions,
    extensionConstructionOptions,
    // loading flags
    loadingTypes,
    loadingStructures,
    loadingUses,
    loadingAdjustments,
    loadingSpecialConditions,
    loadingExtensionConstructionOptions,
    preparing,
    calculating,
    // result / errors / step
    result,
    errorMessage,
    currentStep,
    setCurrentStep,
    // derived values
    selectedViolationLabel,
    groupedViolationOptions,
    selectedUseOption,
    displayedUseCategoryKey,
    displayedUseIndexId,
    isMajorRepairType,
    isUseChangeType,
    resultViolationLabel,
    violationBasis,
    criteriaInputRows,
    criteriaIntermediateRows,
    adjustmentItems,
    specialConditionItems,
    hasEstimatedRange,
    additionOptions,
    reductionOptions,
    aggravationOptions,
    mitigationOptions,
    residentialSpecialOptions,
    filteredUseOptionGroups,
    canPrepare,
    canContinueBuildingInfo,
    canCalculate,
    // ui toggles
    loginOpen,
    setLoginOpen,
    authError,
    setAuthError,
    addressSearchOpen,
    setAddressSearchOpen,
    criteriaOpen,
    setCriteriaOpen,
    violationExamplesOpen,
    setViolationExamplesOpen,
    violationPickerOpen,
    setViolationPickerOpen,
    shareToast,
    setShareToast,
    // handlers
    requireLogin,
    clearPreparedCalculation,
    handleAddressSelect,
    openAddressSearch,
    handleViolationTypeChange,
    openViolationPicker,
    prepareBuilding,
    calculateFine,
    reset,
    // loaders (used by JSX onFocus)
    loadStructureOptions,
    loadUseOptions,
    loadSpecialConditionOptions,
    loadExtensionConstructionOptions,
    // scroll helper
    scrollResultCardIntoView
  };
}
