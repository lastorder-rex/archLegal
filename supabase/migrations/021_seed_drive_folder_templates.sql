-- Migration: seed default drive folder templates
-- Created: 2025-10-21
-- Description: Insert initial folder template rows for consultation Google Drive structure

insert into public.drive_folder_templates (name, display_order)
values
    ('1. 인감증명서', 1),
    ('2. 위임장', 2),
    ('3. 현장 실사', 3)
on conflict (name) do nothing;
