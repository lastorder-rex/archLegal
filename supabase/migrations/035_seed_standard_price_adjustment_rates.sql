-- Migration: Seed 2026 standard price adjustment rates
-- Created: 2026-06-10
-- Description: Adds apply strategy metadata and 2026 increase/decrease catalog for statutory standard value calculations.

alter table public.standard_price_adjustment_rates
  add column if not exists apply_strategy text not null default 'candidate',
  add column if not exists condition_summary text,
  add column if not exists user_question text,
  add column if not exists sort_order integer not null default 1000,
  add column if not exists source_detail text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'standard_price_adjustment_rates_apply_strategy_check'
  ) then
    alter table public.standard_price_adjustment_rates
      add constraint standard_price_adjustment_rates_apply_strategy_check
      check (apply_strategy in ('auto', 'candidate', 'manual', 'deferred'));
  end if;
end $$;

comment on column public.standard_price_adjustment_rates.apply_strategy is 'auto: apply from reliable API data, candidate: ask user when likely, manual: user-only, deferred: out of MVP';
comment on column public.standard_price_adjustment_rates.condition_summary is 'Human-readable rule condition for applying the adjustment';
comment on column public.standard_price_adjustment_rates.user_question is 'Short confirmation question shown when the rule cannot be safely auto-applied';
comment on column public.standard_price_adjustment_rates.source_detail is 'Source page or section detail inside the referenced guide';

insert into public.standard_price_adjustment_rates (
  year,
  adjustment_type,
  code,
  label,
  rate,
  applies_to,
  excluded_cases,
  auto_apply,
  apply_strategy,
  condition_summary,
  user_question,
  sort_order,
  source,
  source_detail
)
values
  -- Increase rates.
  (2026, 'increase', 'intelligent_system_4_elements', '특수설비: 인텔리전트 빌딩시스템 빌딩관리요소 4가지', 0.05, '특수설비가 설치되어 있는 건물', '공동주택(기숙사 제외), 복합건물 내 주택, 생산설비를 설치한 공장용 건물, 주차전용건축물', false, 'candidate', '인텔리전트 빌딩시스템 빌딩관리요소 4가지가 설치된 경우', '건물에 인텔리전트 빌딩시스템 빌딩관리요소 4가지가 설치되어 있나요?', 100, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'intelligent_system_5_plus_elements', '특수설비: 인텔리전트 빌딩시스템 빌딩관리요소 5가지 이상', 0.10, '특수설비가 설치되어 있는 건물', '공동주택(기숙사 제외), 복합건물 내 주택, 생산설비를 설치한 공장용 건물, 주차전용건축물', false, 'candidate', '인텔리전트 빌딩시스템 빌딩관리요소 5가지 이상이 설치된 경우', '건물에 인텔리전트 빌딩시스템 빌딩관리요소가 5가지 이상 설치되어 있나요?', 110, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'floor_height_double', '층고 가산: 1개층 높이가 다른 층보다 2배 이상', 0.05, '해당 층 부분', '동일건물 내 복층 구조가 병존할 경우 당해 복층 부분', false, 'candidate', '건물의 1개층 높이가 다른 층의 높이보다 2배 이상 되는 경우', '위반 부분 층 높이가 다른 층보다 2배 이상 높나요?', 120, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'floor_height_8m_plus', '층고 가산: 1개층 높이 8m 이상', 0.05, '해당 층 부분', '8m 이상 규정 적용 시 2배 이상 층고 가산은 중복 적용하지 않음', false, 'candidate', '건물의 1개층 높이가 8m 이상인 경우. 4m 추가될 때마다 0.05 추가 가산', '위반 부분 층 높이가 8m 이상인가요?', 130, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_1f_under_5_floors', '1층 상가부분 가산: 5층 미만 건물', 0.17, '1층 상가부분', '단층건물, 건설공사 현장의 임시 사무소용 가설건축물 등', true, 'auto', '위반 부분이 지상 1층 상가이고 전체 지상층수가 5층 미만인 경우', null, 200, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_1f_5_to_10_floors', '1층 상가부분 가산: 5층 이상 10층 이하 건물', 0.27, '1층 상가부분', '단층건물, 건설공사 현장의 임시 사무소용 가설건축물 등', true, 'auto', '위반 부분이 지상 1층 상가이고 전체 지상층수가 5층 이상 10층 이하인 경우', null, 210, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_1f_11_to_20_floors', '1층 상가부분 가산: 11층 이상 20층 이하 건물', 0.32, '1층 상가부분', '주거용/사무용 오피스텔, 제조시설 지원 공장구내 사무실, 일부 숙박시설 구분등기 등', true, 'auto', '위반 부분이 지상 1층 상가이고 전체 지상층수가 11층 이상 20층 이하인 경우', null, 220, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_1f_21_to_30_floors', '1층 상가부분 가산: 21층 이상 30층 이하 건물', 0.36, '1층 상가부분', '주거용/사무용 오피스텔, 제조시설 지원 공장구내 사무실, 일부 숙박시설 구분등기 등', true, 'auto', '위반 부분이 지상 1층 상가이고 전체 지상층수가 21층 이상 30층 이하인 경우', null, 230, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_1f_over_30_floors', '1층 상가부분 가산: 30층 초과 건물', 0.46, '1층 상가부분', '주거용/사무용 오피스텔, 제조시설 지원 공장구내 사무실, 일부 숙박시설 구분등기 등', true, 'auto', '위반 부분이 지상 1층 상가이고 전체 지상층수가 30층 초과인 경우', null, 240, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_2f_11_to_20_floors', '2층 상가부분 가산: 11층 이상 20층 이하 건물', 0.04, '2층 상가부분', '주거용/사무용 오피스텔, 제조시설 지원 공장구내 사무실, 일부 숙박시설 구분등기 등', true, 'auto', '위반 부분이 지상 2층 상가이고 전체 지상층수가 11층 이상 20층 이하인 경우', null, 250, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_2f_21_to_30_floors', '2층 상가부분 가산: 21층 이상 30층 이하 건물', 0.05, '2층 상가부분', '주거용/사무용 오피스텔, 제조시설 지원 공장구내 사무실, 일부 숙박시설 구분등기 등', true, 'auto', '위반 부분이 지상 2층 상가이고 전체 지상층수가 21층 이상 30층 이하인 경우', null, 260, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'commercial_2f_over_30_floors', '2층 상가부분 가산: 30층 초과 건물', 0.06, '2층 상가부분', '주거용/사무용 오피스텔, 제조시설 지원 공장구내 사무실, 일부 숙박시설 구분등기 등', true, 'auto', '위반 부분이 지상 2층 상가이고 전체 지상층수가 30층 초과인 경우', null, 270, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'high_rise_building', '고층건축물 가산', 0.01, '고층건축물', null, true, 'auto', '전체 층수 등으로 고층건축물 요건이 확인되는 경우', null, 300, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'super_high_rise_under_60_floors', '초고층 건축물 가산: 59층 이하', 0.06, '초고층 건축물', null, true, 'auto', '초고층 건축물 중 59층 이하인 경우', null, 310, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'super_high_rise_60_to_79_floors', '초고층 건축물 가산: 60층 이상 80층 미만', 0.07, '초고층 건축물', null, true, 'auto', '초고층 건축물 중 60층 이상 80층 미만인 경우', null, 320, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),
  (2026, 'increase', 'super_high_rise_80_plus_floors', '초고층 건축물 가산: 80층 이상', 0.08, '초고층 건축물', null, true, 'auto', '초고층 건축물 중 80층 이상인 경우', null, 330, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제5절 가산율 표'),

  -- Decrease rates.
  (2026, 'decrease', 'single_house_area_60_to_85', '단독주택 감산: 1구 연면적 60㎡ 초과 85㎡ 이하', 0.03, '단독주택', '다가구주택', true, 'auto', '다가구주택이 아닌 단독주택의 1구 연면적이 60㎡ 초과 85㎡ 이하인 경우', null, 400, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'single_house_area_60_or_less', '단독주택 감산: 1구 연면적 60㎡ 이하', 0.05, '단독주택', '다가구주택', true, 'auto', '다가구주택이 아닌 단독주택의 1구 연면적이 60㎡ 이하인 경우', null, 410, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'residential_garage', '주택의 차고 감산', 0.45, '주택의 차고', '주택과 주택 외 용도가 혼재된 복합건축물의 주택 외 용도 차고 면적', false, 'candidate', '위반 부분이 주택의 차고로 사용되는 경우', '위반 부분이 주택의 차고로 사용되는 공간인가요?', 420, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'no_wall_25_to_50_percent', '무벽감산: 무벽 면적비율 1/4 이상 2/4 미만', 0.20, '무벽 건축물', '농수산용 건축물 일부', false, 'candidate', '무벽 면적비율이 1/4 이상 2/4 미만인 경우', '위반 부분의 무벽 면적비율이 1/4 이상 2/4 미만인가요?', 430, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'no_wall_50_to_75_percent', '무벽감산: 무벽 면적비율 2/4 이상 3/4 미만', 0.30, '무벽 건축물', '농수산용 건축물 일부', false, 'candidate', '무벽 면적비율이 2/4 이상 3/4 미만인 경우', '위반 부분의 무벽 면적비율이 2/4 이상 3/4 미만인가요?', 440, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'no_wall_75_plus_percent', '무벽감산: 무벽 면적비율 3/4 이상', 0.40, '무벽 건축물', '농수산용 건축물 일부', false, 'candidate', '무벽 면적비율이 3/4 이상인 경우', '위반 부분의 무벽 면적비율이 3/4 이상인가요?', 450, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_basement_2_or_lower', '지하2층 이상 상가부분 감산', 0.40, '지하2층 이하 상가부분 및 지식산업센터 공장', null, true, 'auto', '위반 부분이 지하2층 이하 상가부분인 경우', null, 500, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_basement_1_under_10_floors', '지하1층 상가부분 감산: 10층 이하 건물', 0.25, '지하1층 상가부분 및 지식산업센터 공장', null, true, 'auto', '위반 부분이 지하1층 상가이고 전체 지상층수가 10층 이하인 경우', null, 510, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_basement_1_over_10_floors', '지하1층 상가부분 감산: 10층 초과 건물', 0.20, '지하1층 상가부분 및 지식산업센터 공장', null, true, 'auto', '위반 부분이 지하1층 상가이고 전체 지상층수가 10층 초과인 경우', null, 520, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_5f_plus_5_to_10_floors', '5층 이상 상가부분 감산: 5층 이상 10층 이하 건물', 0.12, '5층 이상 상가부분', '주거용/사무용 오피스텔 등', true, 'auto', '위반 부분이 지상 5층 이상 상가이고 전체 지상층수가 5층 이상 10층 이하인 경우', null, 530, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_5f_plus_11_to_20_floors', '5층 이상 상가부분 감산: 11층 이상 20층 이하 건물', 0.05, '5층 이상 상가부분', '주거용/사무용 오피스텔 등', true, 'auto', '위반 부분이 지상 5층 이상 상가이고 전체 지상층수가 11층 이상 20층 이하인 경우', null, 540, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_5f_plus_21_to_30_floors', '5층 이상 상가부분 감산: 21층 이상 30층 이하 건물', 0.02, '5층 이상 상가부분', '주거용/사무용 오피스텔 등', true, 'auto', '위반 부분이 지상 5층 이상 상가이고 전체 지상층수가 21층 이상 30층 이하인 경우', null, 550, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'commercial_5f_plus_over_30_floors', '5층 이상 상가부분 감산: 30층 초과 건물', 0.01, '5층 이상 상가부분', '주거용/사무용 오피스텔 등', true, 'auto', '위반 부분이 지상 5층 이상 상가이고 전체 지상층수가 30층 초과인 경우', null, 560, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'parking_lot_2f_plus', '주차장 감산: 2층 이상 건축물', 0.10, '주차장으로 사용되고 있는 2층 이상 건축물', '지하층, 주택의 차고', true, 'auto', '건축물대장상 차량 관련 시설 또는 주차장이고 지하층이 아닌 2층 이상인 경우', null, 600, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'steel_structure_wall_material', '철골조 벽면 감산', 0.10, '철골조 건축물', null, false, 'candidate', '철골조 건축물의 벽면이 조립식패널, 칼라강판, 시멘트블록, 슬레이트벽인 경우', '철골조 건축물의 벽면이 조립식패널, 칼라강판, 시멘트블록, 슬레이트벽인가요?', 610, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표'),
  (2026, 'decrease', 'container_temp_under_30m2', '컨테이너 구조 가설건축물 감산: 연면적 30㎡ 이하', 0.20, '컨테이너 구조 가설건축물', null, false, 'candidate', '연면적 30㎡ 이하 컨테이너 구조 가설건축물인 경우', '위반 부분이 연면적 30㎡ 이하 컨테이너 구조 가설건축물인가요?', 620, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md', '제3장 제6절 감산율 표')
on conflict (year, adjustment_type, code) do update set
  label = excluded.label,
  rate = excluded.rate,
  applies_to = excluded.applies_to,
  excluded_cases = excluded.excluded_cases,
  auto_apply = excluded.auto_apply,
  apply_strategy = excluded.apply_strategy,
  condition_summary = excluded.condition_summary,
  user_question = excluded.user_question,
  sort_order = excluded.sort_order,
  source = excluded.source,
  source_detail = excluded.source_detail;
