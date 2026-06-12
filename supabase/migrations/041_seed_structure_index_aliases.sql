-- Migration: Seed missing 2026 structure index rows and aliases
-- Created: 2026-06-11
-- Description: Adds structure-index coverage found in the 2026 official calculator that was missing from MVP seed data.

insert into public.standard_price_structure_indices (
  year,
  structure_no,
  structure_name,
  structure_index,
  useful_life_years,
  source
)
values
  (2026, 13, '철파이프건물(강파이프천막등)', 0.15, 10, 'docs/enforcement-fine/structure-index.md')
on conflict (year, structure_name) do update set
  structure_no = excluded.structure_no,
  structure_index = excluded.structure_index,
  useful_life_years = excluded.useful_life_years,
  source = excluded.source;

with aliases(structure_name, alias_name) as (
  values
    ('FRP패널조', 'FRB 패널조'),
    ('FRP패널조', 'FRB패널조'),
    ('FRP패널조', 'FRP 패널조'),
    ('컨테이너', '컨테이너건물'),
    ('철파이프조', '철파이프건물'),
    ('철파이프건물(강파이프천막등)', '철파이프건물(강파이프천막등)'),
    ('철파이프건물(강파이프천막등)', '강파이프천막'),
    ('철파이프건물(강파이프천막등)', '강파이프 천막'),
    ('철파이프건물(강파이프천막등)', '천막창고')
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
