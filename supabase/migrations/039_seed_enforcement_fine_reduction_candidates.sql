-- Migration: Seed additional enforcement fine reduction candidates
-- Created: 2026-06-11
-- Description: Adds automatic reduction candidate rates for Building Act Article 80 / 80-2 cases.

insert into public.enforcement_fine_special_condition_rates (
  year,
  code,
  label,
  condition_type,
  rate,
  multiplier,
  user_selectable,
  requires_user_confirmation,
  sort_order,
  description,
  source,
  source_detail
)
values
  (
    2026,
    'article80_small_residential_half',
    '60㎡ 이하 주거용',
    'reduction',
    0.5000,
    0.5000,
    false,
    true,
    110,
    '연면적(공동주택은 세대 면적) 60㎡ 이하 주거용 건축물은 건축법 제80조 제1항 단서에 따라 조례로 정하는 금액이 적용될 수 있는 감경 후보입니다.',
    'https://www.law.go.kr/법령/건축법/제80조',
    '건축법 제80조 제1항 단서'
  ),
  (
    2026,
    'article80_2_violation_area_30_or_less',
    '위반면적 30㎡ 이하',
    'reduction',
    0.7500,
    0.2500,
    false,
    true,
    120,
    '위반면적이 30㎡ 이하인 경우 건축법 제80조의2 및 건축법 시행령 제115조의4에 따른 감경 후보입니다. 실제 적용은 관할청과 조례 확인이 필요합니다.',
    'https://www.law.go.kr/법령/건축법시행령/제115조의4',
    '건축법 시행령 제115조의4 감경 사유'
  ),
  (
    2026,
    'article80_2_collective_owner_area_5_or_less',
    '집합건축물 5㎡ 이하',
    'reduction',
    0.7500,
    0.2500,
    false,
    true,
    130,
    '집합건축물 구분소유자의 위반면적이 5㎡ 이하인 경우 건축법 제80조의2 및 건축법 시행령 제115조의4에 따른 감경 후보입니다. 실제 적용은 관할청과 조례 확인이 필요합니다.',
    'https://www.law.go.kr/법령/건축법시행령/제115조의4',
    '건축법 시행령 제115조의4 감경 사유'
  ),
  (
    2026,
    'article80_2_pre_19920601_residential_85_or_less',
    '1992.6.1 이전 주거용 85㎡ 이하',
    'reduction',
    0.8000,
    0.2000,
    false,
    true,
    140,
    '1992년 6월 1일 이전 위반한 주거용 건축물 중 연면적 85㎡ 이하인 경우 건축법 시행령 제115조의4에 따른 감경 후보입니다. 위반일자와 면적 확인이 필요합니다.',
    'https://www.law.go.kr/법령/건축법시행령/제115조의4',
    '건축법 시행령 제115조의4 1992년 6월 1일 이전 위반 주거용 건축물'
  ),
  (
    2026,
    'article80_2_pre_19920601_residential_over_85',
    '1992.6.1 이전 주거용 85㎡ 초과',
    'reduction',
    0.6000,
    0.4000,
    false,
    true,
    150,
    '1992년 6월 1일 이전 위반한 주거용 건축물 중 연면적 85㎡ 초과인 경우 건축법 시행령 제115조의4에 따른 감경 후보입니다. 위반일자와 면적 확인이 필요합니다.',
    'https://www.law.go.kr/법령/건축법시행령/제115조의4',
    '건축법 시행령 제115조의4 1992년 6월 1일 이전 위반 주거용 건축물'
  )
on conflict (year, code) do update set
  label = excluded.label,
  condition_type = excluded.condition_type,
  rate = excluded.rate,
  multiplier = excluded.multiplier,
  user_selectable = excluded.user_selectable,
  requires_user_confirmation = excluded.requires_user_confirmation,
  sort_order = excluded.sort_order,
  description = excluded.description,
  source = excluded.source,
  source_detail = excluded.source_detail,
  updated_at = now();
