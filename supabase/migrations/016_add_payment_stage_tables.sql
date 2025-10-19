-- Migration: add payment stage tables
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

CREATE TABLE IF NOT EXISTS public.payment_stage_templates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    stage_order integer NOT NULL,
    code text UNIQUE NOT NULL,
    title text NOT NULL,
    description text,
    default_amount numeric(12,2),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.user_payment_stages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.users (auth_id) ON DELETE CASCADE,
    consultation_id uuid REFERENCES public.consultations (id) ON DELETE SET NULL,
    stage_template_id uuid NOT NULL REFERENCES public.payment_stage_templates (id) ON DELETE RESTRICT,
    status text NOT NULL DEFAULT 'locked',
    request_amount numeric(12,2),
    requested_at timestamp with time zone,
    requested_by uuid REFERENCES public.admin_users (id) ON DELETE SET NULL,
    paid_at timestamp with time zone,
    paid_amount numeric(12,2),
    payment_key text,
    last_notified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS user_payment_stage_unique_idx
    ON public.user_payment_stages (user_id, stage_template_id);

CREATE TABLE IF NOT EXISTS public.payment_notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_payment_stage_id uuid NOT NULL REFERENCES public.user_payment_stages (id) ON DELETE CASCADE,
    notification_type text NOT NULL,
    payload jsonb,
    sent_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS payment_notifications_type_idx
    ON public.payment_notifications (notification_type);

COMMENT ON TABLE public.payment_stage_templates IS 'Reusable definitions for payment stages (e.g. stage 1, stage 2).';
COMMENT ON TABLE public.user_payment_stages IS 'Tracks per-user payment stage status, amounts, and timestamps.';
COMMENT ON TABLE public.payment_notifications IS 'Queue/log for payment-related notifications (e.g., Kakao Alimtalk).';
