-- Fix infinite recursion in user_roles RLS policy
-- The policy was querying user_roles table within its own USING clause
-- Solution: Use a security definer function to break the recursion

-- Drop the problematic policy
DROP POLICY IF EXISTS "admins_can_manage_roles" ON user_roles;

-- Create a security definer function to check admin role
-- This breaks the RLS recursion by bypassing RLS within the function
CREATE OR REPLACE FUNCTION is_admin(user_uuid TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Create new policy using the security definer function
CREATE POLICY "admins_can_manage_roles"
  ON user_roles
  FOR ALL
  TO authenticated
  USING (is_admin(auth.uid()::text));
