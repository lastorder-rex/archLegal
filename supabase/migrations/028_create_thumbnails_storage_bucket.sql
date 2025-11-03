-- Migration: create thumbnails storage bucket
-- Created: 2025-11-03
-- Description: Creates a public storage bucket for file thumbnails

-- Create the thumbnails bucket (public)
-- Public bucket allows read access without authentication
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  true, -- public access for reading
  1048576, -- 1MB limit
  ARRAY['image/jpeg', 'image/png']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 1048576,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png']::text[];

-- Note: Public buckets don't need SELECT policies
-- Service role (used by our API) can insert/delete without additional policies
