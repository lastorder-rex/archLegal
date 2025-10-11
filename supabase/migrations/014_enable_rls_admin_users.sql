-- Enable Row Level Security on admin_users table
-- This table should only be accessed via service role from server-side API routes

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Revoke all public access
REVOKE ALL ON public.admin_users FROM public;
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_users FROM authenticated;

-- No policies needed - only service role (server-side) should access this table
-- All admin authentication is handled server-side via API routes using service role key

-- Add security comment
COMMENT ON TABLE admin_users IS 'Admin users table with RLS enabled. Access restricted to service role only. Authentication handled server-side via /api/admin/auth routes.';
