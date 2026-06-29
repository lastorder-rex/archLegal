-- Migration: create EAIS issue job queue tables
-- Created: 2026-06-25
-- Description: Stores ChatGPT/rex initiated EAIS building register issuance jobs and result files

set statement_timeout = 0;
set lock_timeout = 0;
set idle_in_transaction_session_timeout = 0;
set client_encoding = 'UTF8';
set standard_conforming_strings = on;
set check_function_bodies = false;
set xmloption = content;
set client_min_messages = warning;
set row_security = off;

create table if not exists public.eais_issue_jobs (
    id uuid primary key default gen_random_uuid(),
    requested_by_admin_id uuid references public.admin_users (id) on delete set null,
    source text not null default 'manual_gpt' check (source in ('manual_gpt','manual_admin','consultation')),
    consultation_id uuid references public.consultations (id) on delete set null,
    address text not null,
    doc_type text not null default 'auto' check (doc_type in ('auto','표제부','전유부','총괄표제부')),
    dong_ho text,
    delivery text not null default 'drive' check (delivery in ('drive','email','both')),
    email text,
    status text not null default 'pending' check (status in ('pending','claimed','running','done','failed','cancelled')),
    worker_id text,
    error_message text,
    result_summary jsonb,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default timezone('utc'::text, now()),
    claimed_at timestamptz,
    started_at timestamptz,
    completed_at timestamptz,
    updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists eais_issue_jobs_status_created_idx
    on public.eais_issue_jobs (status, created_at);

create index if not exists eais_issue_jobs_admin_idx
    on public.eais_issue_jobs (requested_by_admin_id)
    where requested_by_admin_id is not null;

create index if not exists eais_issue_jobs_consultation_idx
    on public.eais_issue_jobs (consultation_id)
    where consultation_id is not null;

create table if not exists public.eais_issue_job_files (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.eais_issue_jobs (id) on delete cascade,
    file_type text not null check (file_type in ('building_register_pdf','building_register_total_pdf','extracted_html','permit_form_pdf')),
    file_name text,
    local_path text,
    drive_file_id text,
    drive_url text,
    mime_type text,
    file_size bigint,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists eais_issue_job_files_job_idx
    on public.eais_issue_job_files (job_id);

create index if not exists eais_issue_job_files_drive_file_idx
    on public.eais_issue_job_files (drive_file_id)
    where drive_file_id is not null;

create table if not exists public.eais_issue_job_logs (
    id uuid primary key default gen_random_uuid(),
    job_id uuid not null references public.eais_issue_jobs (id) on delete cascade,
    level text not null default 'info' check (level in ('info','warn','error')),
    message text not null,
    created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists eais_issue_job_logs_job_idx
    on public.eais_issue_job_logs (job_id, created_at);

comment on table public.eais_issue_jobs is 'EAIS building register issuance jobs requested from ChatGPT/rex and processed by eais-agent workers.';
comment on table public.eais_issue_job_files is 'Files produced by EAIS issue jobs, including Drive links returned to ChatGPT.';
comment on table public.eais_issue_job_logs is 'Audit log for EAIS issue job state changes and worker messages.';

create trigger set_eais_issue_jobs_updated_at
    before update on public.eais_issue_jobs
    for each row
    execute procedure update_updated_at_column();

create or replace function public.claim_next_eais_issue_job(p_worker_id text)
returns public.eais_issue_jobs
language plpgsql
security definer
set search_path = public
as $$
declare
    v_job public.eais_issue_jobs;
begin
    select * into v_job
    from public.eais_issue_jobs
    where status = 'pending'
    order by created_at asc
    for update skip locked
    limit 1;

    if not found then
        return null;
    end if;

    update public.eais_issue_jobs
    set status = 'claimed',
        worker_id = p_worker_id,
        claimed_at = timezone('utc'::text, now()),
        updated_at = timezone('utc'::text, now())
    where id = v_job.id
    returning * into v_job;

    insert into public.eais_issue_job_logs (job_id, level, message)
    values (v_job.id, 'info', p_worker_id || ' 작업자가 발급 작업을 가져갔습니다.');

    return v_job;
end;
$$;

create or replace function public.requeue_stale_eais_issue_jobs(p_before timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
    v_count integer;
begin
    update public.eais_issue_jobs
    set status = 'pending',
        worker_id = null,
        claimed_at = null,
        started_at = null,
        updated_at = timezone('utc'::text, now()),
        metadata = metadata || jsonb_build_object('requeuedAt', timezone('utc'::text, now()))
    where status in ('claimed','running')
      and coalesce(started_at, claimed_at, created_at) < p_before;

    get diagnostics v_count = row_count;
    return v_count;
end;
$$;
