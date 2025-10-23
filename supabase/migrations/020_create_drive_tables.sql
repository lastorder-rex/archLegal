-- Migration: create Google Drive folder tables
-- Created: 2025-10-21
-- Description: Store drive folder templates and consultation-drive associations

set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = false;
set xmloption = content;
set client_min_messages = warning;
set row_security = off;

create table if not exists public.drive_folder_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    display_order integer not null,
    is_active boolean not null default true,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create unique index if not exists drive_folder_templates_active_order_idx
    on public.drive_folder_templates (display_order)
    where is_active;

create unique index if not exists drive_folder_templates_name_idx
    on public.drive_folder_templates (name);

create table if not exists public.consultation_drive_folders (
    id uuid primary key default gen_random_uuid(),
    consultation_id uuid not null references public.consultations (id) on delete cascade,
    user_payment_stage_id uuid references public.user_payment_stages (id) on delete set null,
    drive_folder_id text,
    drive_folder_name text not null,
    status text not null default 'active' check (status in ('active','cancelled','deleted','dry_run','error')),
    name_snapshot text,
    address_snapshot text,
    phone_snapshot text,
    amount_snapshot numeric(12,2),
    metadata jsonb,
    created_at timestamptz not null default timezone('utc'::text, now()),
    updated_at timestamptz not null default timezone('utc'::text, now()),
    cancelled_at timestamptz,
    deleted_at timestamptz
);

create unique index if not exists consultation_drive_folders_stage_unique_idx
    on public.consultation_drive_folders (user_payment_stage_id);

create index if not exists consultation_drive_folders_consultation_idx
    on public.consultation_drive_folders (consultation_id);

create unique index if not exists consultation_drive_folders_drive_id_idx
    on public.consultation_drive_folders (drive_folder_id)
    where drive_folder_id is not null;

create index if not exists consultation_drive_folders_status_idx
    on public.consultation_drive_folders (status);

comment on table public.drive_folder_templates is 'Configurable list of default sub-folders to create inside consultation folders.';
comment on table public.consultation_drive_folders is 'Tracks Google Drive folders created per consultation/payment stage.';

-- Trigger to keep updated_at fresh
create trigger set_drive_folder_templates_updated_at
    before update on public.drive_folder_templates
    for each row
    execute procedure update_updated_at_column();

create trigger set_consult_drive_folders_updated_at
    before update on public.consultation_drive_folders
    for each row
    execute procedure update_updated_at_column();
