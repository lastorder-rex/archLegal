-- Migration: Seed grouped new/extension violation reason
-- Created: 2026-06-15
-- Description: Adds the legal parent row used by the UI before selecting the detailed charge rate.

insert into public.enforcement_fine_violation_rates (
  year,
  code,
  label,
  formula_type,
  base_fine_rate,
  violation_rate,
  min_violation_rate,
  max_violation_rate,
  user_selectable,
  requires_local_ordinance,
  requires_user_confirmation,
  sort_order,
  description,
  source,
  source_detail
)
values (
  2026,
  'violation_1',
  '허가를 받지 않거나, 신고를 하지 않고 신축, 증축한 건축물',
  'extension_area',
  0.5000,
  1.0000,
  null,
  null,
  true,
  false,
  false,
  90,
  '건폐율·용적률 초과 또는 허가·신고 없이 건축된 경우의 상위 위반사유입니다. 실제 계산은 위반행위별 적용율을 별도로 선택해 적용합니다.',
  'docs/enforcement-fine/이행강제금_산정_가이드라인.md',
  'Part 2 이행강제금 부과 > 경우 1'
)
on conflict (year, code) do update set
  label = excluded.label,
  formula_type = excluded.formula_type,
  base_fine_rate = excluded.base_fine_rate,
  violation_rate = excluded.violation_rate,
  min_violation_rate = excluded.min_violation_rate,
  max_violation_rate = excluded.max_violation_rate,
  user_selectable = excluded.user_selectable,
  requires_local_ordinance = excluded.requires_local_ordinance,
  requires_user_confirmation = excluded.requires_user_confirmation,
  sort_order = excluded.sort_order,
  description = excluded.description,
  source = excluded.source,
  source_detail = excluded.source_detail,
  updated_at = now();
