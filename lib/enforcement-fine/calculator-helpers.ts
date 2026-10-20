import type { ManualAdjustmentKey } from './calculator-constants';

export type PreparedData = Record<string, any>;

export type CalculateResult = {
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

export function formatCurrency(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Math.round(value).toLocaleString('ko-KR')}원`;
}

export function formatCurrencyPerM2(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Math.round(value).toLocaleString('ko-KR')}원/㎡`;
}

export function formatArea(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Number(value.toFixed(2)).toLocaleString('ko-KR')}㎡`;
}

export function formatRate(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return `${Number((value * 100).toFixed(1)).toLocaleString('ko-KR')}%`;
}

export function formatDecimal(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '-';
  return Number(value.toFixed(4)).toLocaleString('ko-KR');
}

export function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function getManualAdjustmentCodes(value: ManualAdjustmentKey, groundFloorCount: number | null | undefined) {
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

export const CALC_CONSULT_KEY = 'calc_consultation_prefill';

export function buildCalcConsultMessage(
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

export function getUseCategorySelectionKey(categoryCode: string | null | undefined): 'I' | 'II' | 'other' | '' {
  if (categoryCode === 'I' || categoryCode === 'II') return categoryCode;
  return categoryCode ? 'other' : '';
}

export function sanitizeAreaInput(value: string) {
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

export function sanitizeYearInput(value: string) {
  return value.replace(/\D/g, '').slice(0, 4);
}

export async function parseJsonResponse<T>(response: Response): Promise<T> {
  const json = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = typeof json?.error === 'string' ? json.error : '요청 처리 중 오류가 발생했습니다.';
    const error = new Error(message);
    (error as Error & { status?: number }).status = response.status;
    throw error;
  }

  return json as T;
}
