-- Migration: Create enforcement fine violation rate catalog
-- Created: 2026-06-10
-- Description: Stores statutory violation-type rates separately from calculated estimate rows.

create table if not exists public.enforcement_fine_violation_rates (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  code text not null,
  label text not null,
  formula_type text not null,
  base_fine_rate numeric(8,4),
  violation_rate numeric(8,4) not null,
  min_violation_rate numeric(8,4),
  max_violation_rate numeric(8,4),
  user_selectable boolean not null default true,
  requires_local_ordinance boolean not null default false,
  requires_user_confirmation boolean not null default false,
  sort_order integer not null default 1000,
  description text,
  source text,
  source_detail text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, code),
  check (formula_type in ('extension_area', 'standard_value', 'range', 'manual')),
  check (base_fine_rate is null or base_fine_rate >= 0),
  check (violation_rate >= 0),
  check (min_violation_rate is null or min_violation_rate >= 0),
  check (max_violation_rate is null or max_violation_rate >= 0),
  check (
    min_violation_rate is null
    or max_violation_rate is null
    or min_violation_rate <= max_violation_rate
  )
);

comment on table public.enforcement_fine_violation_rates is 'Statutory rate catalog by violation type for enforcement fine calculations';
comment on column public.enforcement_fine_violation_rates.formula_type is 'extension_area: 1m2 standard price * violation area * base_fine_rate * violation_rate, standard_value: violation-part standard value * violation_rate, range/manual: needs user or admin confirmation';
comment on column public.enforcement_fine_violation_rates.base_fine_rate is 'Usually 0.5 for Building Act Article 80(1)(1) new/extension violations; null for Article 80(1)(2) standard-value based violations';
comment on column public.enforcement_fine_violation_rates.violation_rate is 'Rate applied by violation content. For range rows this stores the recommended/default upper rate.';

alter table public.enforcement_fine_estimates
  add column if not exists violation_rate_id uuid references public.enforcement_fine_violation_rates (id) on delete set null,
  add column if not exists formula_type text,
  add column if not exists calculation_version text not null default '2026-v1';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'enforcement_fine_estimates_formula_type_check'
  ) then
    alter table public.enforcement_fine_estimates
      add constraint enforcement_fine_estimates_formula_type_check
      check (formula_type is null or formula_type in ('extension_area', 'standard_value', 'range', 'manual'));
  end if;
end $$;

alter table public.enforcement_fine_estimates
  alter column base_fine_rate drop not null,
  alter column base_fine_rate drop default;

comment on column public.enforcement_fine_estimates.violation_rate_id is 'Reference to the statutory violation rate row used for the estimate';
comment on column public.enforcement_fine_estimates.formula_type is 'Formula family used for this estimate';
comment on column public.enforcement_fine_estimates.calculation_version is 'Calculator ruleset version used for this estimate';
comment on column public.enforcement_fine_estimates.base_fine_rate is 'Article 80(1)(1) base rate when applicable. Null for standard-value based violations such as major repair or use change.';

create index if not exists idx_enforcement_fine_violation_rates_lookup
  on public.enforcement_fine_violation_rates (year, code);

create index if not exists idx_enforcement_fine_violation_rates_sort
  on public.enforcement_fine_violation_rates (year, user_selectable, sort_order);

create index if not exists idx_enforcement_fine_estimates_violation_rate
  on public.enforcement_fine_estimates (violation_rate_id)
  where violation_rate_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_enforcement_fine_violation_rates_updated_at'
  ) then
    create trigger update_enforcement_fine_violation_rates_updated_at
      before update on public.enforcement_fine_violation_rates
      for each row
      execute procedure update_updated_at_column();
  end if;
end $$;

alter table public.enforcement_fine_violation_rates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'enforcement_fine_violation_rates'
      and policyname = 'enforcement_fine_violation_rates_select_authenticated'
  ) then
    create policy "enforcement_fine_violation_rates_select_authenticated"
      on public.enforcement_fine_violation_rates
      for select
      to authenticated
      using (true);
  end if;
end $$;

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
values
  (
    2026,
    'coverage_ratio_excess',
    '건폐율 초과 건축',
    'extension_area',
    0.5000,
    0.8000,
    null,
    null,
    false,
    true,
    false,
    100,
    '1㎡ 시가표준액의 50%에 위반면적을 곱한 금액 이하 범위에서 건폐율 초과 비율 80%를 적용합니다. 건축조례로 낮출 수 있으나 60% 이상이어야 합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금'
  ),
  (
    2026,
    'floor_area_ratio_excess',
    '용적률 초과 건축',
    'extension_area',
    0.5000,
    0.9000,
    null,
    null,
    false,
    true,
    false,
    110,
    '1㎡ 시가표준액의 50%에 위반면적을 곱한 금액 이하 범위에서 용적률 초과 비율 90%를 적용합니다. 건축조례로 낮출 수 있으나 60% 이상이어야 합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금'
  ),
  (
    2026,
    'unauthorized_extension',
    '허가 없이 신축/증축',
    'extension_area',
    0.5000,
    1.0000,
    null,
    null,
    true,
    true,
    false,
    200,
    '허가를 받지 않고 건축한 경우입니다. 1㎡ 시가표준액의 50%에 위반면적을 곱한 금액 이하 범위에서 100%를 적용합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금'
  ),
  (
    2026,
    'unreported_extension',
    '신고 없이 신축/증축',
    'extension_area',
    0.5000,
    0.7000,
    null,
    null,
    true,
    true,
    false,
    210,
    '신고를 하지 않고 건축한 경우입니다. 1㎡ 시가표준액의 50%에 위반면적을 곱한 금액 이하 범위에서 70%를 적용합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금'
  ),
  (
    2026,
    'unauthorized_major_repair',
    '무단 대수선',
    'standard_value',
    null,
    0.1000,
    null,
    null,
    true,
    true,
    true,
    300,
    '대수선 건축물에 적용되는 시가표준액의 10% 범위에서 별표 15로 정하는 금액을 적용합니다. 대수선 대상 시가표준액 산정 방식 확인이 필요합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=2&csmSeq=1406&popMenu=ov',
    '위법한 대수선 등의 유형 및 제재 > 대수선 위반 > 이행강제금 계산 방법'
  ),
  (
    2026,
    'unauthorized_use_change',
    '무단 용도변경',
    'standard_value',
    null,
    0.1000,
    null,
    null,
    true,
    true,
    true,
    310,
    '허가를 받지 않거나 신고를 하지 않고 용도변경한 부분의 시가표준액 10% 범위에서 별표 15로 정하는 금액을 적용합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=2&csmSeq=1406&popMenu=ov',
    '위법한 대수선 등의 유형 및 제재 > 용도변경 위반 > 이행강제금 계산 방법'
  ),
  (
    2026,
    'use_without_approval',
    '사용승인 없이 사용',
    'standard_value',
    null,
    0.0200,
    null,
    null,
    true,
    true,
    true,
    320,
    '사용승인을 받지 않고 사용한 경우 별표 15 기준에 따라 시가표준액에 2%를 적용합니다.',
    'https://www.law.go.kr/법령/건축법시행령/별표15',
    '건축법 시행령 별표 15'
  ),
  (
    2026,
    'other_building_act_violation_10',
    '그 밖의 주요 건축법 위반',
    'standard_value',
    null,
    0.1000,
    null,
    null,
    true,
    true,
    true,
    900,
    '조경, 건축선, 구조, 피난, 방화, 높이, 일조 등 별표 15에서 10% 계열로 보는 위반입니다. 세부 위반내용 확인이 필요합니다.',
    'https://www.law.go.kr/법령/건축법시행령/별표15',
    '건축법 시행령 별표 15'
  ),
  (
    2026,
    'other_violation_max_3',
    '기타 위반',
    'range',
    null,
    0.0300,
    0.0000,
    0.0300,
    true,
    true,
    true,
    990,
    '별표 15의 그 밖의 위반 유형입니다. 최대 3% 범위로 보되, 실제 적용률은 세부 위반내용과 조례 확인이 필요합니다.',
    'https://www.law.go.kr/법령/건축법시행령/별표15',
    '건축법 시행령 별표 15'
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
