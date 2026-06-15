-- Migration: Hide legacy grouped/range other violation rows
-- Created: 2026-06-15
-- Description: Keeps the JSON-aligned building_act_order_violation as the single user-facing "other" violation type.

update public.enforcement_fine_violation_rates
set
  user_selectable = false,
  updated_at = now()
where year = 2026
  and code in (
    'other_building_act_violation_10',
    'other_violation_max_3'
  );
