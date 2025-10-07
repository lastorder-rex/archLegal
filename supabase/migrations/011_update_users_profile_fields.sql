-- Update users table with extended profile fields and refreshed RLS policies

-- Add new profile-related columns
alter table users
  add column if not exists legal_name text,
  add column if not exists contact_phone text,
  add column if not exists profile_completed boolean not null default false,
  add column if not exists profile_completed_at timestamptz,
  add column if not exists consent_terms_at timestamptz,
  add column if not exists consent_privacy_at timestamptz,
  add column if not exists contact_phone_verified_at timestamptz,
  add column if not exists updated_at timestamptz default timezone('utc', now());

-- Ensure created_at exists and defaults to now (harmless if already set)
alter table users
  alter column created_at set default timezone('utc', now());

-- Create trigger to keep updated_at fresh
create or replace function public.update_users_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger trg_users_updated_at
before update on users
for each row
execute function public.update_users_updated_at();

-- Enable RLS and refresh policies
alter table users enable row level security;

drop policy if exists "users_select_own_profile" on users;
drop policy if exists "users_update_own_profile" on users;
drop policy if exists "admins_manage_all_users" on users;

create policy "users_select_own_profile"
  on users
  for select
  using (auth.uid() = auth_id);

create policy "users_update_own_profile"
  on users
  for update
  using (auth.uid() = auth_id)
  with check (auth.uid() = auth_id);

create policy "admins_manage_all_users"
  on users
  for all
  using (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()::text
        and user_roles.role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from user_roles
      where user_roles.user_id = auth.uid()::text
        and user_roles.role = 'admin'
    )
  );
