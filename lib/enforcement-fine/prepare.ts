import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

const STANDARD_PRICE_YEAR = 2026;
const USER_AGENT = 'archLegal/1.0';

type AddressCode = {
  sigunguCd: string;
  bjdongCd: string;
  platGbCd: string;
  bun: string;
  ji: string;
  sigunguName?: string;
  bjdongName?: string;
};

type PrepareInput = {
  address?: string;
  addressCode?: AddressCode;
  roadAddress?: string;
  jibunAddress?: string;
  dongName?: string;
  hoName?: string;
};

type JusoAddress = {
  roadAddr: string;
  jibunAddr: string;
  buildingName: string | null;
  detailBuildingName: string | null;
  addressCode: AddressCode;
};

type BuildingTitleItem = Record<string, any>;
type UnitItem = Record<string, any>;
type ReferenceRow = Record<string, any>;

function parseNumber(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function padLotNumber(value: string | undefined) {
  if (!value || value === '' || value === '0') return '0000';
  return value.padStart(4, '0');
}

function normalizeText(value: unknown) {
  return String(value ?? '')
    .replace(/\s+/g, '')
    .toUpperCase();
}

function normalizeHo(value: unknown) {
  return normalizeText(value).replace(/호$/, '');
}

function normalizeDong(value: unknown) {
  return normalizeText(value);
}

function buildPnu(code: AddressCode) {
  const pnuLandType = code.platGbCd === '1' ? '2' : '1';
  return `${code.sigunguCd}${code.bjdongCd}${pnuLandType}${code.bun}${code.ji}`;
}

async function fetchJson<T>(url: URL, timeoutMs = 7000): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { 'User-Agent': USER_AGENT },
      signal: controller.signal,
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const text = await response.text();
    return JSON.parse(text) as T;
  } finally {
    clearTimeout(timeoutId);
  }
}

function getHubItems(data: any): any[] {
  const rawItems = data?.response?.body?.items;
  if (Array.isArray(rawItems)) return rawItems;
  if (Array.isArray(rawItems?.item)) return rawItems.item;
  if (rawItems?.item) return [rawItems.item];
  return [];
}

async function resolveAddress(input: PrepareInput): Promise<JusoAddress> {
  if (input.addressCode) {
    return {
      roadAddr: input.roadAddress || input.address || '',
      jibunAddr: input.jibunAddress || input.address || '',
      buildingName: null,
      detailBuildingName: null,
      addressCode: input.addressCode
    };
  }

  if (!input.address) {
    throw new Error('주소 또는 주소코드가 필요합니다.');
  }

  const apiKey = process.env.JUSO_API_KEY;
  if (!apiKey) {
    throw new Error('주소 검색 API 설정이 없습니다.');
  }

  const url = new URL('https://business.juso.go.kr/addrlink/addrLinkApi.do');
  url.searchParams.set('confmKey', apiKey);
  url.searchParams.set('keyword', input.address.trim());
  url.searchParams.set('resultType', 'json');
  url.searchParams.set('countPerPage', '1');
  url.searchParams.set('currentPage', '1');

  const data = await fetchJson<any>(url);
  const common = data?.results?.common;
  if (common?.errorCode !== '0') {
    throw new Error(common?.errorMessage || '주소 검색에 실패했습니다.');
  }

  const item = data?.results?.juso?.[0];
  if (!item?.admCd) {
    throw new Error('주소 검색 결과가 없습니다.');
  }

  return {
    roadAddr: item.roadAddr,
    jibunAddr: item.jibunAddr,
    buildingName: item.bdNm || null,
    detailBuildingName: item.detBdNmList || null,
    addressCode: {
      sigunguCd: item.admCd.slice(0, 5),
      bjdongCd: item.admCd.slice(5),
      platGbCd: item.mtYn ?? '0',
      bun: padLotNumber(item.lnbrMnnm),
      ji: padLotNumber(item.lnbrSlno),
      sigunguName: item.sggNm || '',
      bjdongName: item.emdNm || ''
    }
  };
}

async function fetchBuildingHub(endpoint: string, code: AddressCode, numOfRows = '100') {
  const apiKey = process.env.BLD_RGST_API_KEY;
  if (!apiKey) {
    throw new Error('건축물대장 API 설정이 없습니다.');
  }

  const url = new URL(`https://apis.data.go.kr/1613000/BldRgstHubService/${endpoint}`);
  url.searchParams.set('serviceKey', apiKey);
  url.searchParams.set('sigunguCd', code.sigunguCd);
  url.searchParams.set('bjdongCd', code.bjdongCd);
  url.searchParams.set('platGbCd', code.platGbCd);
  url.searchParams.set('bun', code.bun);
  url.searchParams.set('ji', code.ji);
  url.searchParams.set('_type', 'json');
  url.searchParams.set('numOfRows', numOfRows);
  url.searchParams.set('pageNo', '1');

  const data = await fetchJson<any>(url);
  const header = data?.response?.header;
  if (header?.resultCode !== '00') {
    throw new Error(header?.resultMsg || '건축물대장 조회에 실패했습니다.');
  }

  return getHubItems(data);
}

function selectTitleItem(items: BuildingTitleItem[], dongName?: string) {
  if (!items.length) return null;
  if (!dongName) return items[0];

  const normalizedDong = normalizeDong(dongName);
  return items.find(item => normalizeDong(item.dongNm) === normalizedDong) || items[0];
}

function simplifyTitle(item: BuildingTitleItem | null) {
  if (!item) return null;

  return {
    registerPk: item.mgmBldrgstPk ? String(item.mgmBldrgstPk) : null,
    platPlc: item.platPlc || null,
    newPlatPlc: item.newPlatPlc || null,
    buildingName: item.bldNm || null,
    dongName: item.dongNm || null,
    registerKind: item.regstrKindCdNm || null,
    mainUse: item.mainPurpsCdNm || null,
    detailUse: item.etcPurps || item.etcPurpsCdNm || null,
    structure: item.strctCdNm || item.etcStrct || null,
    roof: item.roofCdNm || item.etcRoof || null,
    useApprovalDate: formatYyyymmdd(item.useAprDay),
    permitDate: formatYyyymmdd(item.pmsDay),
    totalAreaM2: parseNumber(item.totArea),
    farCalculatedAreaM2: parseNumber(item.vlRatEstmTotArea),
    landAreaM2: parseNumber(item.platArea),
    groundFloorCount: parseInteger(item.grndFlrCnt ?? item.groundFloorCnt),
    undergroundFloorCount: parseInteger(item.ugrndFlrCnt ?? item.ugrndFloorCnt),
    householdCount: parseInteger(item.hhldCnt),
    familyCount: parseInteger(item.fmlyCnt ?? item.fmlyNum),
    heightM: parseNumber(item.heit),
    raw: item
  };
}

function simplifyUnit(item: UnitItem) {
  return {
    registerPk: item.mgmBldrgstPk ? String(item.mgmBldrgstPk) : null,
    buildingName: item.bldNm || null,
    dongName: item.dongNm || null,
    hoName: item.hoNm ? String(item.hoNm) : null,
    floorDivision: item.flrGbCdNm || null,
    floorNo: parseInteger(item.flrNo),
    floorName: item.flrNoNm || null,
    mainUse: item.mainPurpsCdNm || null,
    detailUse: item.etcPurps || null,
    structure: item.strctCdNm || item.etcStrct || null,
    createdDate: formatYyyymmdd(item.crtnDay),
    raw: item
  };
}

function simplifyUnitArea(item: UnitItem) {
  return {
    ...simplifyUnit(item),
    exposureType: item.exposPubuseGbCdNm || null,
    exposureCode: item.exposPubuseGbCd || null,
    areaM2: parseNumber(item.area)
  };
}

function formatYyyymmdd(value: unknown) {
  const raw = String(value ?? '');
  if (!/^\d{8}$/.test(raw)) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6)}`;
}

function selectUnitAreas(items: UnitItem[], dongName?: string, hoName?: string) {
  if (!hoName) return [];
  const normalizedDong = dongName ? normalizeDong(dongName) : null;
  const normalizedHo = normalizeHo(hoName);

  return items.filter(item => (
    (!normalizedDong || normalizeDong(item.dongNm) === normalizedDong) &&
    normalizeHo(item.hoNm) === normalizedHo
  ));
}

type FetchLandPriceResult =
  | { ok: true; data: { pnu: string; standardYear: number | null; standardMonth: number | null; landPriceKrwPerM2: number | null; address: string | null; raw: any } }
  | { ok: false; reason: string };

async function fetchLandPrice(pnu: string): Promise<FetchLandPriceResult> {
  const apiKey = process.env.VWORLD_API_KEY;
  if (!apiKey) {
    console.error('[VWorld] VWORLD_API_KEY is not set');
    return { ok: false, reason: 'API 키 미설정 (VWORLD_API_KEY)' };
  }

  const domain = process.env.NEXT_PUBLIC_SITE_URL || 'localhost:3002';
  const resolvedDomain = domain.replace(/^https?:\/\//, '');
  const url = new URL('https://api.vworld.kr/req/data');
  url.searchParams.set('service', 'data');
  url.searchParams.set('request', 'GetFeature');
  url.searchParams.set('data', 'LP_PA_CBND_BUBUN');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('domain', resolvedDomain);
  url.searchParams.set('attrFilter', `pnu:=:${pnu}`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('size', '10');
  url.searchParams.set('page', '1');

  let data: any;
  try {
    data = await fetchJson<any>(url);
  } catch (err) {
    const reason = `VWorld 요청 실패 (domain=${resolvedDomain}, ${err instanceof Error ? err.message : err})`;
    console.error('[VWorld] fetch failed', { resolvedDomain, pnu, err });
    return { ok: false, reason };
  }

  if (data?.response?.status !== 'OK') {
    const reason = `VWorld 응답 오류 (status=${data?.response?.status}, domain=${resolvedDomain})`;
    console.error('[VWorld] API error', { status: data?.response?.status, resolvedDomain });
    return { ok: false, reason };
  }

  const feature = data?.response?.result?.featureCollection?.features?.[0];
  if (!feature?.properties?.jiga) {
    console.error('[VWorld] No jiga found for PNU', pnu);
    return { ok: false, reason: `해당 필지 공시지가 없음 (PNU=${pnu})` };
  }

  return {
    ok: true,
    data: {
      pnu,
      standardYear: parseInteger(feature.properties.gosi_year),
      standardMonth: parseInteger(feature.properties.gosi_month),
      landPriceKrwPerM2: parseInteger(feature.properties.jiga),
      address: feature.properties.addr || null,
      raw: feature.properties
    }
  };
}

async function findStructureReference(structureName: string | null) {
  if (!structureName) return null;

  const supabase = getSupabaseAdminClient();
  const [{ data: structures }, { data: aliases }] = await Promise.all([
    supabase
      .from('standard_price_structure_indices')
      .select('*')
      .eq('year', STANDARD_PRICE_YEAR),
    supabase
      .from('standard_price_structure_aliases')
      .select('*')
  ]);

  const normalized = normalizeText(structureName);
  const structureRows = (structures || []) as ReferenceRow[];
  const aliasRows = (aliases || []) as ReferenceRow[];

  const direct = structureRows.find(row => normalizeText(row.structure_name) === normalized);
  if (direct) return direct;

  const exactAlias = aliasRows.find(row => normalizeText(row.alias_name) === normalized);
  if (exactAlias) {
    return structureRows.find(row => row.id === exactAlias.structure_index_id) || null;
  }

  const alias = aliasRows
    .slice()
    .sort((a, b) => normalizeText(b.alias_name).length - normalizeText(a.alias_name).length)
    .find(row => {
    const aliasText = normalizeText(row.alias_name);
    return aliasText.length >= 2 && normalized.includes(aliasText);
  });

  return alias
    ? structureRows.find(row => row.id === alias.structure_index_id) || null
    : null;
}

async function findUseReference(candidates: Array<{ mainUse: string | null; detailUse: string | null }>) {
  const supabase = getSupabaseAdminClient();
  const [{ data: useRows }, { data: aliasRows }] = await Promise.all([
    supabase
      .from('standard_price_use_indices')
      .select('*')
      .eq('year', STANDARD_PRICE_YEAR),
    supabase
      .from('standard_price_use_aliases')
      .select('*')
      .order('priority', { ascending: true })
  ]);

  const uses = (useRows || []) as ReferenceRow[];
  const aliases = (aliasRows || []) as ReferenceRow[];

  for (const candidate of candidates) {
    const main = normalizeText(candidate.mainUse);
    const detail = normalizeText(candidate.detailUse);
    const combined = `${main} ${detail}`;

    const matchedAlias = aliases.find(alias => {
      const aliasMain = normalizeText(alias.api_main_use);
      const pattern = normalizeText(alias.api_detail_use_pattern);
      const aliasName = normalizeText(alias.alias_name);

      const mainMatches = !aliasMain || main === aliasMain || main.includes(aliasMain);
      const patternMatches = !pattern || combined.includes(pattern);
      const aliasMatches = !aliasName || combined.includes(aliasName);
      const strongAliasMatch = Boolean(aliasName && combined.includes(aliasName))
        || Boolean(pattern && combined.includes(pattern));

      return (mainMatches && patternMatches && aliasMatches) || strongAliasMatch;
    });

    if (matchedAlias) {
      const matchedUse = uses.find(row => row.id === matchedAlias.use_index_id);
      if (matchedUse) return matchedUse;
    }

    const direct = uses.find(row => {
      const text = normalizeText(`${row.main_use} ${row.detail_use}`);
      return (detail && text.includes(detail)) || (main && text.includes(main));
    });
    if (direct) return direct;
  }

  return null;
}

async function findBasePrice(categoryCode: string | null) {
  if (!categoryCode) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('standard_price_base_prices')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .eq('category_code', categoryCode)
    .limit(1)
    .maybeSingle();

  return data || null;
}

async function findLocationReference(landPriceKrwPerM2: number | null) {
  if (!landPriceKrwPerM2) return null;

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('standard_price_location_indices')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .order('location_no', { ascending: true });

  return ((data || []) as ReferenceRow[]).find(row => {
    const min = row.min_land_price_krw_per_m2 as number | null;
    const max = row.max_land_price_krw_per_m2 as number | null;
    const minOk = min === null || (row.min_exclusive ? landPriceKrwPerM2 > min : landPriceKrwPerM2 >= min);
    const maxOk = max === null || (row.max_inclusive ? landPriceKrwPerM2 <= max : landPriceKrwPerM2 < max);
    return minOk && maxOk;
  }) || null;
}

function isCommercialUse(useRef: ReferenceRow | null, mainUse: string | null, detailUse: string | null) {
  const text = normalizeText(`${mainUse || ''} ${detailUse || ''} ${useRef?.category_name || ''} ${useRef?.main_use || ''} ${useRef?.detail_use || ''}`);
  if (text.includes('오피스텔')) return false;
  return useRef?.category_code === 'II' || text.includes('상가') || text.includes('근린생활') || text.includes('판매') || text.includes('영업');
}

function isParkingUse(useRef: ReferenceRow | null, mainUse: string | null, detailUse: string | null) {
  const text = normalizeText(`${mainUse || ''} ${detailUse || ''} ${useRef?.detail_use || ''}`);
  return text.includes('주차장') || text.includes('자동차관련시설');
}

async function buildAdjustmentCandidates({
  title,
  unit,
  useRef
}: {
  title: ReturnType<typeof simplifyTitle>;
  unit: ReturnType<typeof simplifyUnitArea> | null;
  useRef: ReferenceRow | null;
}) {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from('standard_price_adjustment_rates')
    .select('*')
    .eq('year', STANDARD_PRICE_YEAR)
    .order('sort_order', { ascending: true });

  const rows = (data || []) as ReferenceRow[];
  const applied: ReferenceRow[] = [];
  const pending: ReferenceRow[] = [];

  const mainUse = unit?.mainUse || title?.mainUse || null;
  const detailUse = unit?.detailUse || title?.detailUse || null;
  const commercial = isCommercialUse(useRef, mainUse, detailUse);
  const parking = isParkingUse(useRef, mainUse, detailUse);
  const groundFloors = title?.groundFloorCount || 0;
  const floorNo = unit?.floorNo ?? null;
  const floorDivision = normalizeText(unit?.floorDivision);
  const isBasement = floorDivision.includes('지하');
  const isGround = floorDivision.includes('지상') || (!isBasement && floorNo !== null && floorNo > 0);
  const totalArea = title?.totalAreaM2 || 0;
  const mainUseText = normalizeText(`${title?.mainUse || ''} ${title?.detailUse || ''}`);
  const isSingleHouse = mainUseText.includes('단독주택') && !mainUseText.includes('다가구');
  const structureText = normalizeText(unit?.structure || title?.structure || '');

  for (const row of rows) {
    const code = row.code as string;
    let shouldApply = false;
    let shouldAsk = row.apply_strategy === 'candidate';

    if (code === 'single_house_area_60_to_85') {
      shouldApply = isSingleHouse && totalArea > 60 && totalArea <= 85;
    } else if (code === 'single_house_area_60_or_less') {
      shouldApply = isSingleHouse && totalArea > 0 && totalArea <= 60;
    } else if (commercial && isGround && floorNo === 1) {
      shouldApply =
        (code === 'commercial_1f_under_5_floors' && groundFloors < 5) ||
        (code === 'commercial_1f_5_to_10_floors' && groundFloors >= 5 && groundFloors <= 10) ||
        (code === 'commercial_1f_11_to_20_floors' && groundFloors >= 11 && groundFloors <= 20) ||
        (code === 'commercial_1f_21_to_30_floors' && groundFloors >= 21 && groundFloors <= 30) ||
        (code === 'commercial_1f_over_30_floors' && groundFloors > 30);
    } else if (commercial && isGround && floorNo === 2) {
      shouldApply =
        (code === 'commercial_2f_11_to_20_floors' && groundFloors >= 11 && groundFloors <= 20) ||
        (code === 'commercial_2f_21_to_30_floors' && groundFloors >= 21 && groundFloors <= 30) ||
        (code === 'commercial_2f_over_30_floors' && groundFloors > 30);
    } else if (commercial && isBasement) {
      shouldApply =
        (code === 'commercial_basement_2_or_lower' && (floorNo || 0) >= 2) ||
        (code === 'commercial_basement_1_under_10_floors' && floorNo === 1 && groundFloors <= 10) ||
        (code === 'commercial_basement_1_over_10_floors' && floorNo === 1 && groundFloors > 10);
    } else if (commercial && isGround && floorNo !== null && floorNo >= 5) {
      shouldApply =
        (code === 'commercial_5f_plus_5_to_10_floors' && groundFloors >= 5 && groundFloors <= 10) ||
        (code === 'commercial_5f_plus_11_to_20_floors' && groundFloors >= 11 && groundFloors <= 20) ||
        (code === 'commercial_5f_plus_21_to_30_floors' && groundFloors >= 21 && groundFloors <= 30) ||
        (code === 'commercial_5f_plus_over_30_floors' && groundFloors > 30);
    } else if (parking && isGround && floorNo !== null && floorNo >= 2) {
      shouldApply = code === 'parking_lot_2f_plus';
    } else if (groundFloors >= 30 && groundFloors < 50) {
      shouldApply = code === 'high_rise_building';
    } else if (groundFloors >= 50 && groundFloors < 60) {
      shouldApply = code === 'super_high_rise_under_60_floors';
    } else if (groundFloors >= 60 && groundFloors < 80) {
      shouldApply = code === 'super_high_rise_60_to_79_floors';
    } else if (groundFloors >= 80) {
      shouldApply = code === 'super_high_rise_80_plus_floors';
    }

    if (code === 'steel_structure_wall_material') {
      shouldAsk = structureText.includes('철골');
    }
    if (code === 'container_temp_under_30m2') {
      shouldAsk = structureText.includes('컨테이너');
    }

    if (shouldApply) {
      applied.push(row);
    } else if (shouldAsk) {
      pending.push(row);
    }
  }

  const simplifyAdjustment = (row: ReferenceRow) => ({
    code: row.code,
    type: row.adjustment_type,
    label: row.label,
    rate: Number(row.rate),
    applyStrategy: row.apply_strategy,
    conditionSummary: row.condition_summary,
    userQuestion: row.user_question,
    excludedCases: row.excluded_cases
  });

  return {
    applied: applied.map(simplifyAdjustment),
    pending: pending.map(simplifyAdjustment)
  };
}

export async function prepareEnforcementFine(input: PrepareInput) {
  const address = await resolveAddress(input);
  const pnu = buildPnu(address.addressCode);

  const [titleItems, unitListItems, landPriceResult] = await Promise.all([
    fetchBuildingHub('getBrTitleInfo', address.addressCode, '50'),
    fetchBuildingHub('getBrExposInfo', address.addressCode, '200').catch(() => []),
    fetchLandPrice(pnu)
  ]);
  const landPrice = landPriceResult.ok ? landPriceResult.data : null;
  const landPriceFailReason = landPriceResult.ok ? null : landPriceResult.reason;

  if (!titleItems.length) {
    throw new Error('건축물대장 표제부 정보를 찾을 수 없습니다.');
  }

  const selectedTitleRaw = selectTitleItem(titleItems, input.dongName);
  const selectedTitle = simplifyTitle(selectedTitleRaw);
  const unitList = unitListItems.map(simplifyUnit);

  const unitAreaItems = input.hoName
    ? await fetchBuildingHub('getBrExposPubuseAreaInfo', address.addressCode, '300').catch(() => [])
    : [];
  const selectedUnitAreas = selectUnitAreas(unitAreaItems, input.dongName, input.hoName).map(simplifyUnitArea);
  const exclusiveUnit = selectedUnitAreas.find(item => item.exposureType === '전유') || selectedUnitAreas[0] || null;
  const publicUnit = selectedUnitAreas.find(item => item.exposureType === '공용') || null;

  const structureName = exclusiveUnit?.structure || selectedTitle?.structure || null;
  const useCandidates = [
    { mainUse: exclusiveUnit?.mainUse || null, detailUse: exclusiveUnit?.detailUse || null },
    { mainUse: selectedTitle?.mainUse || null, detailUse: selectedTitle?.detailUse || null }
  ];

  const [structureRef, useRef, locationRef] = await Promise.all([
    findStructureReference(structureName),
    findUseReference(useCandidates),
    findLocationReference(landPrice?.landPriceKrwPerM2 || null)
  ]);
  const basePrice = await findBasePrice(useRef?.category_code || null);
  const adjustments = await buildAdjustmentCandidates({
    title: selectedTitle,
    unit: exclusiveUnit,
    useRef
  });

  return {
    address: {
      inputAddress: input.address || null,
      roadAddress: address.roadAddr,
      jibunAddress: address.jibunAddr,
      buildingName: address.buildingName,
      detailBuildingName: address.detailBuildingName,
      pnu,
      ...address.addressCode
    },
    building: selectedTitle,
    titleItems: titleItems.map(simplifyTitle),
    units: unitList,
    selectedUnit: exclusiveUnit
      ? {
          dongName: exclusiveUnit.dongName,
          hoName: exclusiveUnit.hoName,
          floorDivision: exclusiveUnit.floorDivision,
          floorNo: exclusiveUnit.floorNo,
          floorName: exclusiveUnit.floorName,
          exclusiveAreaM2: exclusiveUnit.areaM2,
          publicAreaM2: publicUnit?.areaM2 || null,
          mainUse: exclusiveUnit.mainUse,
          detailUse: exclusiveUnit.detailUse,
          structure: exclusiveUnit.structure,
          registerPk: exclusiveUnit.registerPk,
          areaRows: selectedUnitAreas
        }
      : null,
    reference: {
      standardPriceYear: STANDARD_PRICE_YEAR,
      structure: structureRef
        ? {
            id: structureRef.id,
            structureNo: structureRef.structure_no,
            name: structureRef.structure_name,
            index: Number(structureRef.structure_index),
            usefulLifeYears: structureRef.useful_life_years
          }
        : null,
      use: useRef
        ? {
            id: useRef.id,
            categoryCode: useRef.category_code,
            categoryName: useRef.category_name,
            mainUse: useRef.main_use,
            useNo: useRef.use_no,
            detailUse: useRef.detail_use,
            index: Number(useRef.use_index)
          }
        : null,
      basePrice: basePrice
        ? {
            id: basePrice.id,
            categoryCode: basePrice.category_code,
            categoryName: basePrice.category_name,
            krwPerM2: basePrice.base_price_krw_per_m2
          }
        : null,
      landPrice,
      location: locationRef
        ? {
            id: locationRef.id,
            locationNo: locationRef.location_no,
            minLandPriceKrwPerM2: locationRef.min_land_price_krw_per_m2,
            maxLandPriceKrwPerM2: locationRef.max_land_price_krw_per_m2,
            index: Number(locationRef.location_index)
          }
        : null
    },
    adjustmentCandidates: {
      applied: adjustments.applied,
      pendingQuestions: adjustments.pending
    },
    warnings: [
      ...(!landPrice ? [`VWorld 개별공시지가 조회 실패: ${landPriceFailReason || '알 수 없는 오류'}`] : []),
      ...(!structureRef ? ['구조지수 매핑이 필요합니다.'] : []),
      ...(!useRef ? ['용도지수 매핑이 필요합니다.'] : []),
      ...(!locationRef ? ['위치지수 매핑이 필요합니다.'] : []),
      '위반건축물 여부와 변동사항은 상담단계에서 확인이 필요합니다.'
    ]
  };
}
