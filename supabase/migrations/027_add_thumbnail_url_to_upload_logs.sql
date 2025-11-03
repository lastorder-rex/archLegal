-- Migration: add thumbnail_url column to upload_logs
-- Created: 2025-11-03
-- Description: Adds thumbnail_url column to store Supabase Storage thumbnail URLs

ALTER TABLE public.upload_logs
ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

COMMENT ON COLUMN public.upload_logs.thumbnail_url IS 'Supabase Storage URL for file thumbnail (200x200px)';
