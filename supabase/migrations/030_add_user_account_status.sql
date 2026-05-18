-- Migration: add account status tracking to users table
-- Description: Adds columns to manage withdrawal/block states for users

set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = false;
set xmloption = content;
set client_min_messages = warning;
set row_security = off;

alter table public.users
  add column if not exists account_status text not null default 'active';

alter table public.users
  add column if not exists withdrawn_at timestamptz,
  add column if not exists blocked_at timestamptz,
  add column if not exists blocked_reason text;

alter table public.users
  drop constraint if exists users_account_status_check;

alter table public.users
  add constraint users_account_status_check
  check (account_status in ('active', 'withdrawn', 'blocked'));

create index if not exists users_account_status_idx
  on public.users (account_status);
