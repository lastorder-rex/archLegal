-- Enable RLS for user payment stages and define user policies

alter table public.user_payment_stages enable row level security;

drop policy if exists "users_select_own_payment_stages" on public.user_payment_stages;

create policy "users_select_own_payment_stages"
  on public.user_payment_stages
  for select
  using (auth.uid() = user_id);

-- 관리용 service role은 RLS를 우회하므로 별도 정책 없이 전체 관리가 가능합니다.
