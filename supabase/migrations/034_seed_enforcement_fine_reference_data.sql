-- Migration: Seed enforcement fine calculator reference data
-- Created: 2026-06-09
-- Description: Initial 2026 Seoul/general statutory standard value reference data for MVP calculations

-- 1. 2026 base prices.
insert into public.standard_price_base_prices (
  year,
  effective_from,
  effective_to,
  category_code,
  category_name,
  base_price_krw_per_m2,
  source
)
values
  (2026, date '2026-06-01', date '2027-05-31', 'I', '주거용 건물', 860000, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md'),
  (2026, date '2026-06-01', date '2027-05-31', 'II', '상업용 건물', 860000, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md'),
  (2026, date '2026-06-01', date '2027-05-31', 'III', '공업용 건물', 840000, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md'),
  (2026, date '2026-06-01', date '2027-05-31', 'IV', '농수산용 건물', 640000, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md'),
  (2026, date '2026-06-01', date '2027-05-31', 'V', '문화·복지·교육용 건물', 860000, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md'),
  (2026, date '2026-06-01', date '2027-05-31', 'VI', '공공용 건물', 850000, 'docs/enforcement-fine/2026-standard-price-guide-1-75.md')
on conflict (year, category_code, effective_from) do update set
  effective_to = excluded.effective_to,
  category_name = excluded.category_name,
  base_price_krw_per_m2 = excluded.base_price_krw_per_m2,
  source = excluded.source;

-- 2. Structure indices. Rows are split by structure name because useful life can differ inside the same index group.
insert into public.standard_price_structure_indices (
  year,
  structure_no,
  structure_name,
  structure_index,
  useful_life_years,
  source
)
values
  (2026, 1, '통나무조', 1.35, 50, 'docs/enforcement-fine/structure-index.md'),
  (2026, 2, '목구조', 1.25, 40, 'docs/enforcement-fine/structure-index.md'),
  (2026, 3, '철골철근콘크리트조', 1.20, 50, 'docs/enforcement-fine/structure-index.md'),
  (2026, 3, '철골콘크리트조', 1.20, 50, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '철근콘크리트조', 1.00, 40, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '라멘조', 1.00, 40, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '석조', 1.00, 40, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '프리캐스트콘크리트조', 1.00, 40, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '스틸하우스조', 1.00, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '철골조', 1.00, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 4, '연와조', 1.00, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 5, '보강콘크리트조', 0.95, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 5, '보강블록조', 0.95, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 6, '황토조', 0.90, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 6, 'ALC조', 0.90, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 6, '시멘트벽돌조', 0.90, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 7, '목조', 0.83, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 8, '경량철골조', 0.65, 20, 'docs/enforcement-fine/structure-index.md'),
  (2026, 9, '시멘트블록조', 0.60, 20, 'docs/enforcement-fine/structure-index.md'),
  (2026, 9, '와이어패널조', 0.60, 30, 'docs/enforcement-fine/structure-index.md'),
  (2026, 10, '조립식패널조', 0.55, 20, 'docs/enforcement-fine/structure-index.md'),
  (2026, 10, 'FRP패널조', 0.55, 20, 'docs/enforcement-fine/structure-index.md'),
  (2026, 11, '석회및흙벽돌조', 0.35, 10, 'docs/enforcement-fine/structure-index.md'),
  (2026, 11, '돌담및토담조', 0.35, 10, 'docs/enforcement-fine/structure-index.md'),
  (2026, 12, '컨테이너', 0.30, 10, 'docs/enforcement-fine/structure-index.md'),
  (2026, 13, '철파이프조', 0.30, 10, 'docs/enforcement-fine/structure-index.md')
on conflict (year, structure_name) do update set
  structure_no = excluded.structure_no,
  structure_index = excluded.structure_index,
  useful_life_years = excluded.useful_life_years,
  source = excluded.source;

-- Common structure aliases from building registry names.
with aliases(structure_name, alias_name) as (
  values
    ('통나무조', '통나무구조'),
    ('목구조', '목구조'),
    ('철골철근콘크리트조', '철골철근콘크리트구조'),
    ('철골콘크리트조', '철골콘크리트구조'),
    ('철근콘크리트조', '철근콘크리트구조'),
    ('철근콘크리트조', '철근콘크리트조'),
    ('라멘조', '라멘구조'),
    ('석조', '석구조'),
    ('프리캐스트콘크리트조', '프리캐스트콘크리트구조'),
    ('스틸하우스조', '스틸하우스구조'),
    ('철골조', '철골구조'),
    ('연와조', '연와구조'),
    ('보강콘크리트조', '보강콘크리트구조'),
    ('보강블록조', '보강블록구조'),
    ('황토조', '황토구조'),
    ('ALC조', 'ALC구조'),
    ('시멘트벽돌조', '시멘트벽돌구조'),
    ('목조', '목조'),
    ('경량철골조', '경량철골구조'),
    ('시멘트블록조', '시멘트블록구조'),
    ('와이어패널조', '와이어패널구조'),
    ('조립식패널조', '조립식패널구조'),
    ('FRP패널조', 'FRP패널구조'),
    ('석회및흙벽돌조', '석회 및 흙벽돌조'),
    ('돌담및토담조', '돌담 및 토담조'),
    ('컨테이너', '컨테이너건물'),
    ('철파이프조', '철파이프구조')
)
insert into public.standard_price_structure_aliases (
  structure_index_id,
  alias_name
)
select si.id, aliases.alias_name
from aliases
join public.standard_price_structure_indices si
  on si.year = 2026
 and si.structure_name = aliases.structure_name
on conflict (structure_index_id, alias_name) do nothing;

-- 3. MVP use indices. Residential rows are complete; common commercial aliases support near-living cases.
insert into public.standard_price_use_indices (
  year,
  category_code,
  category_name,
  main_use,
  use_no,
  detail_use,
  use_index,
  source
)
values
  (2026, 'I', '주거용', '주거시설', '1', '공동주택 : 아파트', 1.00, 'docs/enforcement-fine/use-index.md'),
  (2026, 'I', '주거용', '주거시설', '2', '공동주택 : 연립주택, 다세대주택', 0.91, 'docs/enforcement-fine/use-index.md'),
  (2026, 'I', '주거용', '주거시설', '3', '단독주택 : 단독주택, 다중주택, 다가구주택', 0.91, 'docs/enforcement-fine/use-index.md'),
  (2026, 'I', '주거용', '주거시설', '4', '도시형 생활주택 : 소형주택, 단지형 연립주택, 단지형 다세대주택', 0.91, 'docs/enforcement-fine/use-index.md'),
  (2026, 'I', '주거용', '주거시설', '5', '전업농어가주택, 광산주택 등 기타 주거용건물', 0.87, 'docs/enforcement-fine/use-index.md'),
  (2026, 'I', '주거용', '준주택시설', '6', '기숙사, 다중생활시설, 노인복지주택', 0.91, 'docs/enforcement-fine/use-index.md'),
  (2026, 'I', '주거용', '준주택시설', '7', '주거용 오피스텔', 1.23, 'docs/enforcement-fine/use-index.md'),
  (2026, 'II', '상업용', '판매 및 영업시설', '3', '상점, 일반음식점, 휴게음식점, 제과점, 기타 판매 및 영업시설', 1.12, 'docs/enforcement-fine/use-index.md'),
  (2026, 'II', '상업용', '일반업무시설', '21', '사무용 오피스텔', 1.08, 'docs/enforcement-fine/use-index.md'),
  (2026, 'II', '상업용', '자동차시설', '23', '주차장', 0.71, 'docs/enforcement-fine/use-index.md'),
  (2026, 'III', '공업용', '창고시설', '7', '창고', 0.80, 'docs/enforcement-fine/use-index.md')
on conflict (year, category_code, use_no, detail_use) do update set
  category_name = excluded.category_name,
  main_use = excluded.main_use,
  use_index = excluded.use_index,
  source = excluded.source;

with use_aliases(detail_use, api_main_use, api_detail_use_pattern, alias_name, priority) as (
  values
    ('공동주택 : 아파트', '공동주택', '아파트', '아파트', 10),
    ('공동주택 : 연립주택, 다세대주택', '공동주택', '다세대', '다세대주택', 10),
    ('공동주택 : 연립주택, 다세대주택', '공동주택', '연립', '연립주택', 10),
    ('단독주택 : 단독주택, 다중주택, 다가구주택', '단독주택', '다가구', '다가구주택', 10),
    ('단독주택 : 단독주택, 다중주택, 다가구주택', '단독주택', '다중', '다중주택', 20),
    ('단독주택 : 단독주택, 다중주택, 다가구주택', '단독주택', null, '단독주택', 30),
    ('도시형 생활주택 : 소형주택, 단지형 연립주택, 단지형 다세대주택', '공동주택', '도시형', '도시형 생활주택', 15),
    ('주거용 오피스텔', '업무시설', '오피스텔', '주거용 오피스텔', 40),
    ('상점, 일반음식점, 휴게음식점, 제과점, 기타 판매 및 영업시설', '제1종근린생활시설', null, '제1종근린생활시설', 50),
    ('상점, 일반음식점, 휴게음식점, 제과점, 기타 판매 및 영업시설', '제2종근린생활시설', null, '제2종근린생활시설', 50),
    ('상점, 일반음식점, 휴게음식점, 제과점, 기타 판매 및 영업시설', '근린생활시설', null, '근린생활시설', 50),
    ('주차장', '자동차관련시설', '주차장', '주차장', 50),
    ('창고', '창고시설', null, '창고시설', 50)
)
insert into public.standard_price_use_aliases (
  use_index_id,
  api_main_use,
  api_detail_use_pattern,
  alias_name,
  priority
)
select ui.id, ua.api_main_use, ua.api_detail_use_pattern, ua.alias_name, ua.priority
from use_aliases ua
join public.standard_price_use_indices ui
  on ui.year = 2026
 and ui.detail_use = ua.detail_use
where not exists (
  select 1
  from public.standard_price_use_aliases existing
  where existing.use_index_id = ui.id
    and coalesce(existing.api_main_use, '') = coalesce(ua.api_main_use, '')
    and coalesce(existing.api_detail_use_pattern, '') = coalesce(ua.api_detail_use_pattern, '')
    and coalesce(existing.alias_name, '') = coalesce(ua.alias_name, '')
);

-- 4. Location index ranges. Source table unit is thousand KRW/m2; values below are stored as KRW/m2.
insert into public.standard_price_location_indices (
  year,
  location_no,
  min_land_price_krw_per_m2,
  max_land_price_krw_per_m2,
  min_exclusive,
  max_inclusive,
  location_index,
  source
)
values
  (2026, 1, null, 10000, false, true, 0.80, 'docs/enforcement-fine/location-index.md'),
  (2026, 2, 10000, 30000, true, true, 0.82, 'docs/enforcement-fine/location-index.md'),
  (2026, 3, 30000, 50000, true, true, 0.84, 'docs/enforcement-fine/location-index.md'),
  (2026, 4, 50000, 100000, true, true, 0.86, 'docs/enforcement-fine/location-index.md'),
  (2026, 5, 100000, 150000, true, true, 0.88, 'docs/enforcement-fine/location-index.md'),
  (2026, 6, 150000, 200000, true, true, 0.90, 'docs/enforcement-fine/location-index.md'),
  (2026, 7, 200000, 350000, true, true, 0.92, 'docs/enforcement-fine/location-index.md'),
  (2026, 8, 350000, 500000, true, true, 0.94, 'docs/enforcement-fine/location-index.md'),
  (2026, 9, 500000, 650000, true, true, 0.96, 'docs/enforcement-fine/location-index.md'),
  (2026, 10, 650000, 800000, true, true, 0.98, 'docs/enforcement-fine/location-index.md'),
  (2026, 11, 800000, 1000000, true, true, 1.00, 'docs/enforcement-fine/location-index.md'),
  (2026, 12, 1000000, 1200000, true, true, 1.03, 'docs/enforcement-fine/location-index.md'),
  (2026, 13, 1200000, 1600000, true, true, 1.06, 'docs/enforcement-fine/location-index.md'),
  (2026, 14, 1600000, 2000000, true, true, 1.09, 'docs/enforcement-fine/location-index.md'),
  (2026, 15, 2000000, 2500000, true, true, 1.12, 'docs/enforcement-fine/location-index.md'),
  (2026, 16, 2500000, 3000000, true, true, 1.15, 'docs/enforcement-fine/location-index.md'),
  (2026, 17, 3000000, 4000000, true, true, 1.18, 'docs/enforcement-fine/location-index.md'),
  (2026, 18, 4000000, 5000000, true, true, 1.21, 'docs/enforcement-fine/location-index.md'),
  (2026, 19, 5000000, 6000000, true, true, 1.24, 'docs/enforcement-fine/location-index.md'),
  (2026, 20, 6000000, 7000000, true, true, 1.27, 'docs/enforcement-fine/location-index.md'),
  (2026, 21, 7000000, 8000000, true, true, 1.30, 'docs/enforcement-fine/location-index.md'),
  (2026, 22, 8000000, 9000000, true, true, 1.33, 'docs/enforcement-fine/location-index.md'),
  (2026, 23, 9000000, 10000000, true, true, 1.36, 'docs/enforcement-fine/location-index.md'),
  (2026, 24, 10000000, 20000000, true, true, 1.40, 'docs/enforcement-fine/location-index.md'),
  (2026, 25, 20000000, 30000000, true, true, 1.45, 'docs/enforcement-fine/location-index.md'),
  (2026, 26, 30000000, 40000000, true, true, 1.50, 'docs/enforcement-fine/location-index.md'),
  (2026, 27, 40000000, 50000000, true, true, 1.55, 'docs/enforcement-fine/location-index.md'),
  (2026, 28, 50000000, 60000000, true, true, 1.60, 'docs/enforcement-fine/location-index.md'),
  (2026, 29, 60000000, 70000000, true, true, 1.63, 'docs/enforcement-fine/location-index.md'),
  (2026, 30, 70000000, 80000000, true, true, 1.66, 'docs/enforcement-fine/location-index.md'),
  (2026, 31, 80000000, null, true, true, 1.69, 'docs/enforcement-fine/location-index.md')
on conflict (year, location_no) do update set
  min_land_price_krw_per_m2 = excluded.min_land_price_krw_per_m2,
  max_land_price_krw_per_m2 = excluded.max_land_price_krw_per_m2,
  min_exclusive = excluded.min_exclusive,
  max_inclusive = excluded.max_inclusive,
  location_index = excluded.location_index,
  source = excluded.source;

-- 5. Depreciation rates generated from the official straight-line formulas.
with useful_life(useful_life_years, annual_depreciation_rate, terminal_year) as (
  values
    (50, 0.018::numeric, 1976),
    (40, 0.0225::numeric, 1986),
    (30, 0.030::numeric, 1996),
    (20, 0.045::numeric, 2006),
    (10, 0.090::numeric, 2016)
),
rates as (
  select
    2026 as year,
    useful_life.useful_life_years,
    construction_year,
    greatest(
      0.1000::numeric,
      round((1 - (useful_life.annual_depreciation_rate * (2026 - construction_year)))::numeric, 4)
    ) as depreciation_rate,
    construction_year = useful_life.terminal_year as is_terminal_rate
  from useful_life
  cross join lateral generate_series(2026, useful_life.terminal_year, -1) as construction_year
)
insert into public.standard_price_depreciation_rates (
  year,
  useful_life_years,
  construction_year,
  depreciation_rate,
  is_terminal_rate,
  source
)
select
  year,
  useful_life_years,
  construction_year,
  depreciation_rate,
  is_terminal_rate,
  'docs/enforcement-fine/depreciation-rate-by-year.md'
from rates
on conflict (year, useful_life_years, construction_year) do update set
  depreciation_rate = excluded.depreciation_rate,
  is_terminal_rate = excluded.is_terminal_rate,
  source = excluded.source;
