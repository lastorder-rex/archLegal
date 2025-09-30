-- Migration: Add soft delete support to consultations table
-- Created: 2025-09-29

alter table consultations
  add column if not exists is_del char(1) default 'N' check (is_del in ('Y','N'));

alter table consultations
  add column if not exists deleted_at timestamp with time zone;

update consultations
  set is_del = 'N'
  where is_del is null;

create index if not exists idx_consultations_is_del on consultations(is_del);
