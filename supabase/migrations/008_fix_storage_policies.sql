-- Migration: Fix storage policies to remove infinite recursion
-- Created: 2025-10-01
-- Description: Simplify storage policies - only allow users to access their own files

-- Drop existing policy
DROP POLICY IF EXISTS "users_and_admins_can_access_files" ON storage.objects;

-- Create simplified policy: Users can only access their own files
CREATE POLICY "users_can_access_own_files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'consultation-attachments' AND
  auth.uid()::text = split_part(name, '/', 1)
);

-- Note: Admin access will be added later when needed
