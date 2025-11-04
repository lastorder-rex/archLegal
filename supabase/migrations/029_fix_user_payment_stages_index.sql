-- Migration: Fix user_payment_stages unique index to support multiple consultations per user
-- -----------------------------------------------------------------------------
-- This migration changes the unique constraint from (user_id, stage_template_id)
-- to (consultation_id, stage_template_id) to allow the same user to have
-- independent payment stages for different consultations.
-- -----------------------------------------------------------------------------
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Drop the old unique index based on user_id
DROP INDEX IF EXISTS public.user_payment_stage_unique_idx;

-- Create a new unique index based on consultation_id
-- This allows the same user to have different payment stages for different consultations
CREATE UNIQUE INDEX IF NOT EXISTS user_payment_stage_consultation_unique_idx
    ON public.user_payment_stages (consultation_id, stage_template_id);

-- Add comment to explain the new constraint
COMMENT ON INDEX public.user_payment_stage_consultation_unique_idx IS 'Ensures each consultation has only one record per payment stage template.';
