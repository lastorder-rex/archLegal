-- Migration: Create enforcement fine special condition rates
-- Created: 2026-06-10
-- Description: Stores reduction/increase candidate rates for special enforcement fine conditions

create table if not exists public.enforcement_fine_special_condition_rates (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  code text not null,
  label text not null,
  condition_type text not null check (condition_type in ('reduction', 'increase')),
  rate numeric(8,4) not null check (rate >= 0),
  multiplier numeric(8,4) not null check (multiplier >= 0),
  user_selectable boolean not null default true,
  requires_user_confirmation boolean not null default true,
  sort_order integer not null default 1000,
  description text,
  source text,
  source_detail text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, code)
);

comment on table public.enforcement_fine_special_condition_rates is 'Reduction and increase candidate rates for special enforcement fine conditions';
comment on column public.enforcement_fine_special_condition_rates.condition_type is 'reduction lowers the fine candidate range, increase raises it';
comment on column public.enforcement_fine_special_condition_rates.rate is 'Rate stored as decimal, e.g. 0.75 for 75% reduction or 1.0 for 100% increase';
comment on column public.enforcement_fine_special_condition_rates.multiplier is 'Single-condition multiplier, e.g. 0.25 for 75% reduction or 2.0 for 100% increase. Increase conditions are capped at 100% combined in application logic.';

create index if not exists idx_enforcement_fine_special_condition_rates_lookup
  on public.enforcement_fine_special_condition_rates (year, code);

create index if not exists idx_enforcement_fine_special_condition_rates_sort
  on public.enforcement_fine_special_condition_rates (year, user_selectable, sort_order);

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_enforcement_fine_special_condition_rates_updated_at'
  ) then
    create trigger update_enforcement_fine_special_condition_rates_updated_at
      before update on public.enforcement_fine_special_condition_rates
      for each row
      execute procedure update_updated_at_column();
  end if;
end $$;

alter table public.enforcement_fine_special_condition_rates enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'enforcement_fine_special_condition_rates'
      and policyname = 'enforcement_fine_special_condition_rates_select_authenticated'
  ) then
    create policy "enforcement_fine_special_condition_rates_select_authenticated"
      on public.enforcement_fine_special_condition_rates
      for select
      to authenticated
      using (true);
  end if;
end $$;

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
    'acquired_after_violation',
    '위반 후 취득',
    'reduction',
    0.7500,
    0.2500,
    true,
    true,
    100,
    '위반행위 후 소유권이 변경된 경우 적용 가능성이 있는 감경 후보입니다. 실제 적용은 등기부등본, 위반시점, 관할청 판단 및 조례 제한 확인이 필요합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금 감경 사유'
  ),
  (
    2026,
    'for_profit_purpose',
    '영리 목적',
    'increase',
    1.0000,
    2.0000,
    true,
    true,
    200,
    '임대 등 영리 목적으로 위반한 경우 적용 가능성이 있는 가중 후보입니다. 다른 가중 후보와 동시에 해당하더라도 계산기 예상범위에서는 가중률 합계 100%를 상한으로 봅니다. 실제 적용은 위반유형, 면적, 세대·가구 증가 여부 및 소유권 변경 여부 확인이 필요합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금 가중 사유'
  ),
  (
    2026,
    'repeated_violation',
    '최근 3년 내 반복 위반',
    'increase',
    1.0000,
    2.0000,
    true,
    true,
    300,
    '최근 3년 내 2회 이상 건축법 또는 명령·처분을 위반한 경우 적용 가능성이 있는 가중 후보입니다. 다른 가중 후보와 동시에 해당하더라도 계산기 예상범위에서는 가중률 합계 100%를 상한으로 봅니다. 실제 적용은 위반 이력 확인이 필요합니다.',
    'https://easylaw.go.kr/CSP/CnpClsMain.laf?ccfNo=3&cciNo=2&cnpClsNo=1&csmSeq=1406',
    '위법한 건축행위의 유형 및 제재 > 이행강제금 가중 사유'
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
