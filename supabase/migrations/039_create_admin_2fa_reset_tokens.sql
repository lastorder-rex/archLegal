-- Stores short-lived admin 2FA reset links.

create table if not exists public.admin_2fa_reset_tokens (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references public.admin_users (id) on delete cascade,
  token_hash text not null,
  status text not null default 'active' check (status in ('active', 'used', 'revoked', 'expired')),
  pending_secret text,
  identity_verified_at timestamptz,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_by uuid references public.admin_users (id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.admin_2fa_reset_tokens enable row level security;

revoke all on public.admin_2fa_reset_tokens from public;
revoke all on public.admin_2fa_reset_tokens from anon;
revoke all on public.admin_2fa_reset_tokens from authenticated;
grant select, insert, update, delete on public.admin_2fa_reset_tokens to service_role;

create unique index if not exists admin_2fa_reset_tokens_token_hash_idx
  on public.admin_2fa_reset_tokens (token_hash);

create index if not exists admin_2fa_reset_tokens_admin_user_idx
  on public.admin_2fa_reset_tokens (admin_user_id);

create index if not exists admin_2fa_reset_tokens_status_expires_idx
  on public.admin_2fa_reset_tokens (status, expires_at);

comment on table public.admin_2fa_reset_tokens is 'Short-lived one-time links for remote admin 2FA reset.';

drop trigger if exists set_admin_2fa_reset_tokens_updated_at on public.admin_2fa_reset_tokens;
create trigger set_admin_2fa_reset_tokens_updated_at
  before update on public.admin_2fa_reset_tokens
  for each row
  execute procedure update_updated_at_column();
