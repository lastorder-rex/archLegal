-- Migration: create upload token and log tables
-- Created: 2025-10-23
-- Description: Stores customer upload link tokens and upload activity logs

set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = false;
set xmloption = content;
set client_min_messages = warning;
set row_security = off;

create table if not exists public.upload_tokens (
    id uuid primary key default gen_random_uuid(),
    token text not null,
    consultation_id uuid not null references public.consultations (id) on delete cascade,
    payment_id uuid references public.user_payment_stages (id) on delete set null,
    drive_folder_id text,
    expires_at timestamptz not null,
    status text not null default 'active' check (status in ('active','expired','revoked')),
    sent_to text,
    sent_method text,
    sent_at timestamptz,
    created_by uuid references public.admin_users (id) on delete set null,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists upload_tokens_token_idx
    on public.upload_tokens (token);

create index if not exists upload_tokens_consultation_idx
    on public.upload_tokens (consultation_id);

create index if not exists upload_tokens_payment_idx
    on public.upload_tokens (payment_id)
    where payment_id is not null;

create index if not exists upload_tokens_status_idx
    on public.upload_tokens (status);

create table if not exists public.upload_logs (
    id uuid primary key default gen_random_uuid(),
    upload_token_id uuid references public.upload_tokens (id) on delete set null,
    upload_token text,
    consultation_id uuid not null references public.consultations (id) on delete cascade,
    payment_id uuid references public.user_payment_stages (id) on delete set null,
    file_name text not null,
    file_path text not null,
    mime_type text,
    file_size bigint,
    drive_file_id text,
    ip_address text,
    user_agent text,
    uploaded_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists upload_logs_token_idx
    on public.upload_logs (upload_token);

create index if not exists upload_logs_consultation_idx
    on public.upload_logs (consultation_id);

create index if not exists upload_logs_payment_idx
    on public.upload_logs (payment_id)
    where payment_id is not null;

comment on table public.upload_tokens is 'One-time customer upload links generated after payment completion.';
comment on table public.upload_logs is 'Audit trail of files customers upload via tokenized links.';

create trigger set_upload_tokens_updated_at
    before update on public.upload_tokens
    for each row
    execute procedure update_updated_at_column();
