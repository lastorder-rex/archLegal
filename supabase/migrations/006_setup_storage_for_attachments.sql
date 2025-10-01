-- Migration: Setup Supabase Storage for consultation attachments
-- Created: 2025-09-30
-- Description: Create storage bucket and RLS policies for secure file uploads

-- Create storage bucket for consultation attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'consultation-attachments',
  'consultation-attachments',
  false, -- Private bucket
  10485760, -- 10MB limit per file
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/haansofthwp', -- HWP files
    'application/x-hwp'
  ]
) ON CONFLICT (id) DO NOTHING;

-- RLS Policy: Users can only upload to their own folder
CREATE POLICY "users_can_upload_own_files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'consultation-attachments' AND
  -- File path must start with user's ID: {user_id}/{consultation_id}/filename
  auth.uid()::text = split_part(name, '/', 1)
);

-- RLS Policy: Users and admins can view/download files
CREATE POLICY "users_and_admins_can_access_files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'consultation-attachments' AND
  (
    -- User can access their own files
    auth.uid()::text = split_part(name, '/', 1) OR
    -- Admin can access all files
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()::text AND role = 'admin'
    )
  )
);

-- RLS Policy: Users can delete their own files
CREATE POLICY "users_can_delete_own_files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'consultation-attachments' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- RLS Policy: Users can update their own files (rename, etc)
CREATE POLICY "users_can_update_own_files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'consultation-attachments' AND
  auth.uid()::text = split_part(name, '/', 1)
);