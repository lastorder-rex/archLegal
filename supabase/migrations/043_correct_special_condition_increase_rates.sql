-- Migration: Correct 2026 special-condition increase rates
-- Created: 2026-06-11
-- Description: Aligns profit/repeat increase candidates with the 2026 official calculator's 1.5x multiplier.

update public.enforcement_fine_special_condition_rates
set
  rate = 0.5000,
  multiplier = 1.5000,
  description = case code
    when 'for_profit_purpose' then
      '임대 등 영리 목적으로 위반한 경우 적용 가능성이 있는 가중 후보입니다. 2026 공식 계산기 기준으로 불법 용도변경 또는 불법 신축·증축은 위반면적 50㎡ 초과인 경우 1.5배 후보로 봅니다. 다세대 세대수 또는 다가구 가구수 증가의 경우 5세대 또는 5가구 이상 증가 여부 확인이 필요합니다.'
    when 'repeated_violation' then
      '동일인이 최근 3년 내 2회 이상 건축법 또는 명령·처분을 위반한 경우 적용 가능성이 있는 가중 후보입니다. 2026 공식 계산기 기준으로 1.5배 후보로 봅니다.'
    else description
  end,
  source_detail = case code
    when 'for_profit_purpose' then '2026 공식 이행강제금 계산기 가중1·가중2·가중3'
    when 'repeated_violation' then '2026 공식 이행강제금 계산기 가중4'
    else source_detail
  end,
  updated_at = now()
where year = 2026
  and code in ('for_profit_purpose', 'repeated_violation');

comment on column public.enforcement_fine_special_condition_rates.rate is 'Rate stored as decimal, e.g. 0.75 for 75% reduction or 0.5 for 50% increase.';
comment on column public.enforcement_fine_special_condition_rates.multiplier is 'Single-condition multiplier, e.g. 0.25 for 75% reduction or 1.5 for 50% increase. Increase conditions are capped at 100% combined in application logic.';
