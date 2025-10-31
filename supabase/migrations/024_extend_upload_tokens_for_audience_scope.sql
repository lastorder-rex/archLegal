-- Migration: extend upload tokens with audience and scope
-- Description: Adds audience/scope metadata for customer vs staff uploads

set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = false;
set xmloption = content;
set client_min_messages = warning;
set row_security = off;

alter table public.upload_tokens
    add column if not exists audience text not null default 'customer'
        check (audience in ('customer', 'staff')),
    add column if not exists scope jsonb not null default '{}'::jsonb,
    add column if not exists max_files_per_folder integer;

comment on column public.upload_tokens.audience is 'Token usage audience: customer or staff.';
comment on column public.upload_tokens.scope is 'JSON payload describing allowed folders/templates and upload limits.';
comment on column public.upload_tokens.max_files_per_folder is 'Overrides per-folder upload limit when set.';

update public.upload_tokens
set scope = coalesce(scope, '{}'::jsonb)
where scope is null;
