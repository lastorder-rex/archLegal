-- Migration: Create special standard price ratio tables
-- Created: 2026-06-10
-- Description: 2026 extension/reconstruction and major-repair standard value ratios for enforcement fine calculations

create table if not exists public.standard_price_extension_ratios (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  structure_no integer not null check (structure_no between 1 and 13),
  construction_type text not null check (
    construction_type in (
      'with_foundation',
      'without_foundation',
      'without_foundation_multilevel'
    )
  ),
  label text not null,
  ratio numeric(8,4) not null check (ratio > 0 and ratio <= 1),
  source text,
  source_detail text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, structure_no, construction_type)
);

comment on table public.standard_price_extension_ratios is 'Standard value calculation ratios for extension, reconstruction, and similar building portions';
comment on column public.standard_price_extension_ratios.construction_type is 'with_foundation, without_foundation, or without_foundation_multilevel';
comment on column public.standard_price_extension_ratios.ratio is 'Ratio from the statutory standard price guide. Stored as decimal, e.g. 0.85 for 85%.';

create table if not exists public.standard_price_major_repair_ratios (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  structure_no integer not null check (structure_no between 1 and 13),
  approval_type text not null check (approval_type in ('permit', 'report')),
  label text not null,
  ratio numeric(8,4) not null check (ratio > 0 and ratio <= 1),
  roof_repair_reduction_rate numeric(8,4) not null default 0.3000 check (
    roof_repair_reduction_rate >= 0
    and roof_repair_reduction_rate < 1
  ),
  source text,
  source_detail text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, structure_no, approval_type)
);

comment on table public.standard_price_major_repair_ratios is 'Standard value calculation ratios for major-repair building portions';
comment on column public.standard_price_major_repair_ratios.approval_type is 'permit for Building Act Article 11 major repair, report for Article 14 major repair';
comment on column public.standard_price_major_repair_ratios.ratio is 'Ratio from the statutory standard price guide. Stored as decimal, e.g. 0.25 for 25%.';
comment on column public.standard_price_major_repair_ratios.roof_repair_reduction_rate is 'Additional reduction for old-building roof repair or cover addition cases when applicable';

alter table public.enforcement_fine_estimates
  add column if not exists violation_structure_index_id uuid references public.standard_price_structure_indices (id) on delete set null,
  add column if not exists violation_use_index_id uuid references public.standard_price_use_indices (id) on delete set null,
  add column if not exists extension_ratio_id uuid references public.standard_price_extension_ratios (id) on delete set null,
  add column if not exists major_repair_ratio_id uuid references public.standard_price_major_repair_ratios (id) on delete set null,
  add column if not exists violation_structure_no integer,
  add column if not exists violation_structure_name text,
  add column if not exists violation_structure_index numeric(8,4),
  add column if not exists violation_use_name text,
  add column if not exists violation_use_index numeric(8,4),
  add column if not exists extension_construction_type text,
  add column if not exists extension_standard_value_ratio numeric(8,4),
  add column if not exists major_repair_approval_type text,
  add column if not exists major_repair_standard_value_ratio numeric(8,4),
  add column if not exists major_repair_changed_construction_year integer,
  add column if not exists major_repair_roof_reduction_applied boolean not null default false,
  add column if not exists small_residential_reduction_applied boolean not null default false,
  add column if not exists small_residential_reduction_rate numeric(8,4);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'enforcement_fine_estimates_violation_structure_no_check'
  ) then
    alter table public.enforcement_fine_estimates
      add constraint enforcement_fine_estimates_violation_structure_no_check
      check (violation_structure_no is null or violation_structure_no between 1 and 13);
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'enforcement_fine_estimates_extension_construction_type_check'
  ) then
    alter table public.enforcement_fine_estimates
      add constraint enforcement_fine_estimates_extension_construction_type_check
      check (
        extension_construction_type is null
        or extension_construction_type in (
          'with_foundation',
          'without_foundation',
          'without_foundation_multilevel'
        )
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'enforcement_fine_estimates_major_repair_approval_type_check'
  ) then
    alter table public.enforcement_fine_estimates
      add constraint enforcement_fine_estimates_major_repair_approval_type_check
      check (
        major_repair_approval_type is null
        or major_repair_approval_type in ('permit', 'report')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'enforcement_fine_estimates_standard_value_ratio_check'
  ) then
    alter table public.enforcement_fine_estimates
      add constraint enforcement_fine_estimates_standard_value_ratio_check
      check (
        (extension_standard_value_ratio is null or extension_standard_value_ratio > 0)
        and (major_repair_standard_value_ratio is null or major_repair_standard_value_ratio > 0)
      );
  end if;
end $$;

comment on column public.enforcement_fine_estimates.violation_structure_index_id is 'Structure index row used for the violating portion when different from the main building';
comment on column public.enforcement_fine_estimates.violation_use_index_id is 'Use index row used for the violating portion when different from the main building';
comment on column public.enforcement_fine_estimates.extension_ratio_id is 'Reference to the extension/reconstruction standard value ratio row used for the estimate';
comment on column public.enforcement_fine_estimates.major_repair_ratio_id is 'Reference to the major-repair standard value ratio row used for the estimate';
comment on column public.enforcement_fine_estimates.extension_construction_type is 'Foundation condition used for extension/reconstruction standard value ratio';
comment on column public.enforcement_fine_estimates.major_repair_approval_type is 'Major-repair permit/report classification used for standard value ratio';
comment on column public.enforcement_fine_estimates.major_repair_changed_construction_year is 'Adjusted construction year for major-repair depreciation when the changed residual-life method is used';
comment on column public.enforcement_fine_estimates.small_residential_reduction_applied is 'Whether the small residential building reduction coefficient was applied';

create index if not exists idx_standard_price_extension_ratios_lookup
  on public.standard_price_extension_ratios (year, structure_no, construction_type);

create index if not exists idx_standard_price_major_repair_ratios_lookup
  on public.standard_price_major_repair_ratios (year, structure_no, approval_type);

create index if not exists idx_enforcement_fine_estimates_violation_structure
  on public.enforcement_fine_estimates (violation_structure_index_id)
  where violation_structure_index_id is not null;

create index if not exists idx_enforcement_fine_estimates_violation_use
  on public.enforcement_fine_estimates (violation_use_index_id)
  where violation_use_index_id is not null;

create index if not exists idx_enforcement_fine_estimates_extension_ratio
  on public.enforcement_fine_estimates (extension_ratio_id)
  where extension_ratio_id is not null;

create index if not exists idx_enforcement_fine_estimates_major_repair_ratio
  on public.enforcement_fine_estimates (major_repair_ratio_id)
  where major_repair_ratio_id is not null;

do $$
begin
  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_standard_price_extension_ratios_updated_at'
  ) then
    create trigger update_standard_price_extension_ratios_updated_at
      before update on public.standard_price_extension_ratios
      for each row
      execute procedure update_updated_at_column();
  end if;

  if not exists (
    select 1
    from pg_trigger
    where tgname = 'update_standard_price_major_repair_ratios_updated_at'
  ) then
    create trigger update_standard_price_major_repair_ratios_updated_at
      before update on public.standard_price_major_repair_ratios
      for each row
      execute procedure update_updated_at_column();
  end if;
end $$;

alter table public.standard_price_extension_ratios enable row level security;
alter table public.standard_price_major_repair_ratios enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'standard_price_extension_ratios'
      and policyname = 'standard_price_extension_ratios_select_authenticated'
  ) then
    create policy "standard_price_extension_ratios_select_authenticated"
      on public.standard_price_extension_ratios
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'standard_price_major_repair_ratios'
      and policyname = 'standard_price_major_repair_ratios_select_authenticated'
  ) then
    create policy "standard_price_major_repair_ratios_select_authenticated"
      on public.standard_price_major_repair_ratios
      for select
      to authenticated
      using (true);
  end if;
end $$;

with source_info as (
  select
    2026::integer as year,
    'docs/enforcement-fine/2026-standard-price-guide-part2-1-24.md'::text as source,
    '증·개축 건축물 시가표준액 조사·산정, 별표 9'::text as source_detail
),
extension_rows as (
  select
    source_info.year,
    structure_no,
    construction_type,
    label,
    case
      when construction_type = 'with_foundation' then 1.0000
      when construction_type = 'without_foundation' and structure_no between 1 and 5 then 0.8000
      when construction_type = 'without_foundation' and structure_no between 6 and 13 then 0.8500
      when construction_type = 'without_foundation_multilevel' and structure_no between 1 and 5 then 0.6000
      else 0.6500
    end::numeric(8,4) as ratio,
    source_info.source,
    source_info.source_detail
  from source_info
  cross join generate_series(1, 13) as structure_numbers(structure_no)
  cross join (
    values
      ('with_foundation', '기초공사를 한 건축물'),
      ('without_foundation', '기초공사를 하지 않은 건축물'),
      ('without_foundation_multilevel', '기초공사를 하지 않은 건축물 중 1개층 복층 증축')
  ) as construction_types(construction_type, label)
)
insert into public.standard_price_extension_ratios (
  year,
  structure_no,
  construction_type,
  label,
  ratio,
  source,
  source_detail
)
select
  year,
  structure_no,
  construction_type,
  label,
  ratio,
  source,
  source_detail
from extension_rows
on conflict (year, structure_no, construction_type) do update set
  label = excluded.label,
  ratio = excluded.ratio,
  source = excluded.source,
  source_detail = excluded.source_detail,
  updated_at = now();

with source_info as (
  select
    2026::integer as year,
    'docs/enforcement-fine/2026-standard-price-guide-part2-1-24.md'::text as source,
    '대수선 건축물 시가표준액 조사·산정, 별표 10'::text as source_detail
),
major_repair_rows as (
  select
    source_info.year,
    structure_no,
    approval_type,
    case approval_type
      when 'permit' then '대수선 허가'
      else '대수선 신고'
    end as label,
    case
      when structure_no between 1 and 6 and approval_type = 'permit' then 0.2500
      when structure_no between 1 and 6 and approval_type = 'report' then 0.1800
      when structure_no between 7 and 10 and approval_type = 'permit' then 0.3500
      when structure_no between 7 and 10 and approval_type = 'report' then 0.2500
      when structure_no = 11 and approval_type = 'permit' then 0.3000
      when structure_no = 11 and approval_type = 'report' then 0.2500
      when structure_no between 12 and 13 and approval_type = 'permit' then 0.3000
      else 0.2100
    end::numeric(8,4) as ratio,
    source_info.source,
    source_info.source_detail
  from source_info
  cross join generate_series(1, 13) as structure_numbers(structure_no)
  cross join (
    values ('permit'), ('report')
  ) as approval_types(approval_type)
)
insert into public.standard_price_major_repair_ratios (
  year,
  structure_no,
  approval_type,
  label,
  ratio,
  roof_repair_reduction_rate,
  source,
  source_detail
)
select
  year,
  structure_no,
  approval_type,
  label,
  ratio,
  0.3000,
  source,
  source_detail
from major_repair_rows
on conflict (year, structure_no, approval_type) do update set
  label = excluded.label,
  ratio = excluded.ratio,
  roof_repair_reduction_rate = excluded.roof_repair_reduction_rate,
  source = excluded.source,
  source_detail = excluded.source_detail,
  updated_at = now();
