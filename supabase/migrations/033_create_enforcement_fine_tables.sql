-- Migration: Create enforcement fine calculator tables
-- Created: 2026-06-09
-- Description: Reference data and estimate storage for the enforcement fine calculator

create extension if not exists "pgcrypto";

-- 1. Building standard base prices by year and broad use category.
create table if not exists public.standard_price_base_prices (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  effective_from date not null,
  effective_to date,
  category_code text not null,
  category_name text not null,
  base_price_krw_per_m2 integer not null check (base_price_krw_per_m2 > 0),
  source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, category_code, effective_from)
);

comment on table public.standard_price_base_prices is 'Annual building new-construction base prices used for statutory standard value calculations';

-- 2. Structure indices and useful lives.
create table if not exists public.standard_price_structure_indices (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  structure_no integer,
  structure_name text not null,
  structure_index numeric(8,4) not null check (structure_index > 0),
  useful_life_years integer not null check (useful_life_years > 0),
  source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, structure_name)
);

comment on table public.standard_price_structure_indices is 'Structure index and useful-life mapping for statutory standard value calculations';

create table if not exists public.standard_price_structure_aliases (
  id uuid primary key default gen_random_uuid(),
  structure_index_id uuid not null references public.standard_price_structure_indices (id) on delete cascade,
  alias_name text not null,
  created_at timestamp with time zone default now(),
  unique (structure_index_id, alias_name)
);

comment on table public.standard_price_structure_aliases is 'Aliases for matching building registry structure names to structure index rows';

-- 3. Use indices and aliases.
create table if not exists public.standard_price_use_indices (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  category_code text not null,
  category_name text not null,
  main_use text not null,
  use_no text not null,
  detail_use text not null,
  use_index numeric(8,4) not null check (use_index > 0),
  source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, category_code, use_no, detail_use)
);

comment on table public.standard_price_use_indices is 'Use index rows for statutory standard value calculations';

create table if not exists public.standard_price_use_aliases (
  id uuid primary key default gen_random_uuid(),
  use_index_id uuid not null references public.standard_price_use_indices (id) on delete cascade,
  api_main_use text,
  api_detail_use_pattern text,
  alias_name text,
  priority integer not null default 100,
  created_at timestamp with time zone default now(),
  check (api_main_use is not null or api_detail_use_pattern is not null or alias_name is not null)
);

comment on table public.standard_price_use_aliases is 'Aliases and matching patterns for building registry use names';

-- 4. Location index ranges.
create table if not exists public.standard_price_location_indices (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  location_no integer,
  min_land_price_krw_per_m2 integer,
  max_land_price_krw_per_m2 integer,
  min_exclusive boolean not null default true,
  max_inclusive boolean not null default true,
  location_index numeric(8,4) not null check (location_index > 0),
  source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  check (min_land_price_krw_per_m2 is null or min_land_price_krw_per_m2 >= 0),
  check (max_land_price_krw_per_m2 is null or max_land_price_krw_per_m2 > 0),
  check (
    min_land_price_krw_per_m2 is null
    or max_land_price_krw_per_m2 is null
    or min_land_price_krw_per_m2 < max_land_price_krw_per_m2
  ),
  unique (year, location_no)
);

comment on table public.standard_price_location_indices is 'Land-price ranges mapped to location indices';

-- 5. Depreciation rates by construction/completion year and useful life.
create table if not exists public.standard_price_depreciation_rates (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  useful_life_years integer not null check (useful_life_years > 0),
  construction_year integer not null,
  depreciation_rate numeric(8,4) not null check (depreciation_rate > 0 and depreciation_rate <= 1),
  is_terminal_rate boolean not null default false,
  source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, useful_life_years, construction_year)
);

comment on table public.standard_price_depreciation_rates is 'Depreciation rates by useful life and construction or violation completion year';

-- 6. Future adjustment rates. MVP stores the catalog but does not auto-apply every row.
create table if not exists public.standard_price_adjustment_rates (
  id uuid primary key default gen_random_uuid(),
  year integer not null,
  adjustment_type text not null check (adjustment_type in ('increase', 'decrease')),
  code text not null,
  label text not null,
  rate numeric(8,4) not null check (rate >= 0),
  applies_to text,
  excluded_cases text,
  auto_apply boolean not null default false,
  source text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique (year, adjustment_type, code)
);

comment on table public.standard_price_adjustment_rates is 'Increase and decrease rate catalog for statutory standard value calculations';

-- 7. Calculator result storage.
create table if not exists public.enforcement_fine_estimates (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  consultation_id uuid references public.consultations (id) on delete set null,

  address text not null,
  road_address text,
  jibun_address text,
  pnu text,
  sigungu_cd text,
  bjdong_cd text,
  plat_gb_cd text,
  bun text,
  ji text,

  violation_area_m2 numeric(12,4) not null check (violation_area_m2 > 0),
  violation_area_pyeong numeric(12,4),
  violation_type text not null,
  violation_completed_year integer,
  violation_completed_year_unknown boolean not null default false,

  building_main_use text,
  building_detail_use text,
  building_structure text,
  building_use_approval_date date,
  building_total_area_m2 numeric(12,4),
  building_household_count integer,

  structure_index_id uuid references public.standard_price_structure_indices (id) on delete set null,
  use_index_id uuid references public.standard_price_use_indices (id) on delete set null,
  location_index_id uuid references public.standard_price_location_indices (id) on delete set null,
  depreciation_rate_id uuid references public.standard_price_depreciation_rates (id) on delete set null,

  structure_name text,
  structure_index numeric(8,4),
  useful_life_years integer,
  use_name text,
  use_index numeric(8,4),
  land_price_krw_per_m2 integer,
  location_index numeric(8,4),
  depreciation_rate numeric(8,4),
  base_price_krw_per_m2 integer,
  adjustment_rate numeric(8,4) not null default 1,

  standard_price_krw_per_m2 integer,
  building_standard_value_krw integer,
  base_fine_rate numeric(8,4) not null default 0.5,
  violation_rate numeric(8,4),
  estimated_fine_krw integer,
  estimated_fine_min_krw integer,
  estimated_fine_max_krw integer,

  reduction_flags jsonb not null default '{}'::jsonb,
  increase_flags jsonb not null default '{}'::jsonb,
  calculation_basis jsonb not null default '{}'::jsonb,
  api_snapshot jsonb not null default '{}'::jsonb,

  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

comment on table public.enforcement_fine_estimates is 'User enforcement fine estimate results and calculation basis';
comment on column public.enforcement_fine_estimates.violation_completed_year is 'Completion year of the violating part, not necessarily the original building approval year';
comment on column public.enforcement_fine_estimates.calculation_basis is 'Detailed formula, rates, assumptions, and warnings used to explain the estimate';
comment on column public.enforcement_fine_estimates.api_snapshot is 'Address, building registry, and VWorld API response snippets used for the estimate';

-- Indexes.
create index if not exists idx_standard_price_base_prices_year on public.standard_price_base_prices (year);
create index if not exists idx_standard_price_structure_indices_year on public.standard_price_structure_indices (year);
create index if not exists idx_standard_price_structure_aliases_alias on public.standard_price_structure_aliases (alias_name);
create index if not exists idx_standard_price_use_indices_year on public.standard_price_use_indices (year);
create index if not exists idx_standard_price_use_aliases_main_use on public.standard_price_use_aliases (api_main_use);
create index if not exists idx_standard_price_use_aliases_priority on public.standard_price_use_aliases (priority);
create index if not exists idx_standard_price_location_indices_year_range
  on public.standard_price_location_indices (year, min_land_price_krw_per_m2, max_land_price_krw_per_m2);
create index if not exists idx_standard_price_depreciation_rates_lookup
  on public.standard_price_depreciation_rates (year, useful_life_years, construction_year);
create index if not exists idx_enforcement_fine_estimates_user_created
  on public.enforcement_fine_estimates (user_id, created_at desc);
create index if not exists idx_enforcement_fine_estimates_consultation
  on public.enforcement_fine_estimates (consultation_id)
  where consultation_id is not null;
create index if not exists idx_enforcement_fine_estimates_basis_gin
  on public.enforcement_fine_estimates using gin (calculation_basis);

-- updated_at triggers.
create trigger update_standard_price_base_prices_updated_at
  before update on public.standard_price_base_prices
  for each row
  execute procedure update_updated_at_column();

create trigger update_standard_price_structure_indices_updated_at
  before update on public.standard_price_structure_indices
  for each row
  execute procedure update_updated_at_column();

create trigger update_standard_price_use_indices_updated_at
  before update on public.standard_price_use_indices
  for each row
  execute procedure update_updated_at_column();

create trigger update_standard_price_location_indices_updated_at
  before update on public.standard_price_location_indices
  for each row
  execute procedure update_updated_at_column();

create trigger update_standard_price_depreciation_rates_updated_at
  before update on public.standard_price_depreciation_rates
  for each row
  execute procedure update_updated_at_column();

create trigger update_standard_price_adjustment_rates_updated_at
  before update on public.standard_price_adjustment_rates
  for each row
  execute procedure update_updated_at_column();

create trigger update_enforcement_fine_estimates_updated_at
  before update on public.enforcement_fine_estimates
  for each row
  execute procedure update_updated_at_column();

-- RLS.
alter table public.standard_price_base_prices enable row level security;
alter table public.standard_price_structure_indices enable row level security;
alter table public.standard_price_structure_aliases enable row level security;
alter table public.standard_price_use_indices enable row level security;
alter table public.standard_price_use_aliases enable row level security;
alter table public.standard_price_location_indices enable row level security;
alter table public.standard_price_depreciation_rates enable row level security;
alter table public.standard_price_adjustment_rates enable row level security;
alter table public.enforcement_fine_estimates enable row level security;

-- Authenticated users can read reference data. Writes are reserved for service role/admin paths.
create policy "standard_price_base_prices_select_authenticated"
  on public.standard_price_base_prices
  for select
  to authenticated
  using (true);

create policy "standard_price_structure_indices_select_authenticated"
  on public.standard_price_structure_indices
  for select
  to authenticated
  using (true);

create policy "standard_price_structure_aliases_select_authenticated"
  on public.standard_price_structure_aliases
  for select
  to authenticated
  using (true);

create policy "standard_price_use_indices_select_authenticated"
  on public.standard_price_use_indices
  for select
  to authenticated
  using (true);

create policy "standard_price_use_aliases_select_authenticated"
  on public.standard_price_use_aliases
  for select
  to authenticated
  using (true);

create policy "standard_price_location_indices_select_authenticated"
  on public.standard_price_location_indices
  for select
  to authenticated
  using (true);

create policy "standard_price_depreciation_rates_select_authenticated"
  on public.standard_price_depreciation_rates
  for select
  to authenticated
  using (true);

create policy "standard_price_adjustment_rates_select_authenticated"
  on public.standard_price_adjustment_rates
  for select
  to authenticated
  using (true);

create policy "enforcement_fine_estimates_insert_own"
  on public.enforcement_fine_estimates
  for insert
  to authenticated
  with check (auth.uid()::text = user_id);

create policy "enforcement_fine_estimates_select_own"
  on public.enforcement_fine_estimates
  for select
  to authenticated
  using (auth.uid()::text = user_id);

create policy "enforcement_fine_estimates_update_own"
  on public.enforcement_fine_estimates
  for update
  to authenticated
  using (auth.uid()::text = user_id)
  with check (auth.uid()::text = user_id);
