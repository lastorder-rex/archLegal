-- Migration: Create user_roles table for admin permission management
-- Created: 2025-09-30
-- Description: User role management for consultation attachments access control

-- Create user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Kakao user ID from auth.uid()
  role TEXT NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT DEFAULT 'system',

  -- Ensure unique user_id and role combination
  UNIQUE(user_id, role)
);

-- Add comments for documentation
COMMENT ON TABLE user_roles IS 'User role assignments for permission management';
COMMENT ON COLUMN user_roles.user_id IS 'Kakao user ID from Supabase auth.uid()';
COMMENT ON COLUMN user_roles.role IS 'User role: user or admin';

-- Enable Row Level Security
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can manage roles
CREATE POLICY "admins_can_manage_roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()::text AND ur.role = 'admin'
    )
  );

-- Allow users to view their own roles
CREATE POLICY "users_can_view_own_roles"
  ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

-- Create index for performance
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- Insert initial admin user (replace with your actual Kakao user ID)
-- You need to replace 'YOUR_KAKAO_USER_ID' with your actual user ID from auth.users table
-- INSERT INTO user_roles (user_id, role, created_by)
-- VALUES ('YOUR_KAKAO_USER_ID', 'admin', 'initial_setup');