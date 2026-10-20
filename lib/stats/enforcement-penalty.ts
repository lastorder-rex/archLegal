import { getSupabaseAdminClient } from '@/lib/utils/supabase-admin';

// enforcement_penalty_annual_stats: 서울시 이행강제금 부과·징수 현황(2021~2025).
// region_scope: SEOUL_TOTAL(서울 전체) | DISTRICT(자치구), violation_type_code: TOTAL(합계) 포함.
// 금액 단위는 천원(thousand KRW).

export type PenaltyStatRow = {
  report_year: number;
  region_name: string;
  region_scope: 'SEOUL_TOTAL' | 'DISTRICT';
  violation_type_code: string;
  violation_type_name: string;
  assessment_count: number;
  assessment_amount_thousand_krw: number;
  collection_count: number;
  collection_amount_thousand_krw: number;
};

const COLUMNS =
  'report_year,region_name,region_scope,violation_type_code,violation_type_name,assessment_count,assessment_amount_thousand_krw,collection_count,collection_amount_thousand_krw';

/** 서울 전체 연도별 합계(TOTAL) — 연도 오름차순 */
export async function getSeoulYearlyTotals(): Promise<PenaltyStatRow[]> {
  const sb = getSupabaseAdminClient();
  const { data } = await sb
    .from('enforcement_penalty_annual_stats')
    .select(COLUMNS)
    .eq('region_scope', 'SEOUL_TOTAL')
    .eq('violation_type_code', 'TOTAL')
    .order('report_year');
  return (data ?? []) as PenaltyStatRow[];
}

/** 특정 연도 서울 전체 유형별(합계 제외) — 부과건수 내림차순 */
export async function getSeoulTypeBreakdown(year: number): Promise<PenaltyStatRow[]> {
  const sb = getSupabaseAdminClient();
  const { data } = await sb
    .from('enforcement_penalty_annual_stats')
    .select(COLUMNS)
    .eq('region_scope', 'SEOUL_TOTAL')
    .eq('report_year', year)
    .neq('violation_type_code', 'TOTAL')
    .order('assessment_count', { ascending: false });
  return (data ?? []) as PenaltyStatRow[];
}

/** 특정 연도 자치구별 합계 순위 — 부과건수 내림차순 */
export async function getDistrictRanking(year: number): Promise<PenaltyStatRow[]> {
  const sb = getSupabaseAdminClient();
  const { data } = await sb
    .from('enforcement_penalty_annual_stats')
    .select(COLUMNS)
    .eq('region_scope', 'DISTRICT')
    .eq('report_year', year)
    .eq('violation_type_code', 'TOTAL')
    .order('assessment_count', { ascending: false });
  return (data ?? []) as PenaltyStatRow[];
}

/** 특정 자치구의 연도별 합계 — 연도 오름차순 */
export async function getDistrictYearlyTotals(regionName: string): Promise<PenaltyStatRow[]> {
  const sb = getSupabaseAdminClient();
  const { data } = await sb
    .from('enforcement_penalty_annual_stats')
    .select(COLUMNS)
    .eq('region_scope', 'DISTRICT')
    .eq('region_name', regionName)
    .eq('violation_type_code', 'TOTAL')
    .order('report_year');
  return (data ?? []) as PenaltyStatRow[];
}

/** 특정 자치구·연도의 유형별(합계 제외) — 부과건수 내림차순 */
export async function getDistrictTypeBreakdown(regionName: string, year: number): Promise<PenaltyStatRow[]> {
  const sb = getSupabaseAdminClient();
  const { data } = await sb
    .from('enforcement_penalty_annual_stats')
    .select(COLUMNS)
    .eq('region_scope', 'DISTRICT')
    .eq('region_name', regionName)
    .eq('report_year', year)
    .neq('violation_type_code', 'TOTAL')
    .order('assessment_count', { ascending: false });
  return (data ?? []) as PenaltyStatRow[];
}

// ── 표기 헬퍼 ──────────────────────────────────────────────

/** 천원 → 억원 문자열 (10억 미만은 소수 1자리) */
export function formatEokKrw(thousandKrw: number): string {
  const eok = thousandKrw / 100_000;
  return eok >= 10 ? `${Math.round(eok).toLocaleString()}억원` : `${eok.toFixed(1)}억원`;
}

/** 건당 평균(천원, 건수) → 만원 정수 */
export function perCaseManKrw(amountThousandKrw: number, count: number): number {
  if (!count) return 0;
  return Math.round(amountThousandKrw / count / 10);
}

/** 부과액 대비 징수액 비율(%) */
export function collectionRatePct(row: PenaltyStatRow): number {
  if (!row.assessment_amount_thousand_krw) return 0;
  return Math.round((row.collection_amount_thousand_krw / row.assessment_amount_thousand_krw) * 100);
}
