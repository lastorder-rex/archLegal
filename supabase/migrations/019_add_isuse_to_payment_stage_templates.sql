-- Migration: add isUse column to payment_stage_templates
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

-- Add isUse column with CHECK constraint
ALTER TABLE public.payment_stage_templates
ADD COLUMN IF NOT EXISTS is_use CHAR(1) DEFAULT 'Y' NOT NULL
CHECK (is_use IN ('Y', 'N'));

-- Update existing 3 rows to isUse = 'N'
UPDATE public.payment_stage_templates
SET is_use = 'N'
WHERE code IN ('STAGE_1_SITE_SURVEY', 'STAGE_2_LEGALIZATION', 'STAGE_3_FINALIZATION');

-- Insert new '양성화 대행서비스' row
INSERT INTO public.payment_stage_templates (stage_order, code, title, description, default_amount, is_use)
VALUES (
  1,
  'pay',
  '양성화 대행서비스',
  '현장 답사 및 양성화 대행 업무 서비스 결제입니다.',
  NULL,
  'Y'
)
ON CONFLICT (code) DO UPDATE
SET
  stage_order = EXCLUDED.stage_order,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  default_amount = EXCLUDED.default_amount,
  is_use = EXCLUDED.is_use,
  updated_at = timezone('utc'::text, now());

COMMENT ON COLUMN public.payment_stage_templates.is_use IS 'Whether this template is active (Y) or inactive (N)';
