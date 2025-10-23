-- Migration: fix consultation drive folder unique index for upserts
-- Created: 2025-10-21
-- Description: replace partial unique index with full unique index so upsert conflict target works

drop index if exists consultation_drive_folders_stage_unique_idx;

create unique index if not exists consultation_drive_folders_stage_unique_idx
    on public.consultation_drive_folders (user_payment_stage_id);
