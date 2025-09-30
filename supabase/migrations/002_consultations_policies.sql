-- Migration: Extend consultations RLS policies for delete support
-- Created: 2025-09-29

create policy "consultations_delete_own"
  on consultations
  for delete
  to authenticated
  using (auth.uid()::text = user_id);
