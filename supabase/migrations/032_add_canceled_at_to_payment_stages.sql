-- Migration: Add canceled_at column to user_payment_stages
-- Description: Store the timestamp when payment was canceled via webhook
-- -----------------------------------------------------------------------------

ALTER TABLE public.user_payment_stages
ADD COLUMN IF NOT EXISTS canceled_at timestamp with time zone;

COMMENT ON COLUMN public.user_payment_stages.canceled_at IS
'Timestamp when payment was canceled (from Toss webhook). Only set when status=canceled.';
