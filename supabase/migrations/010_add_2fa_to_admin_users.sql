-- Add 2FA fields to admin_users table
ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS two_factor_secret TEXT,
ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN DEFAULT false;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_admin_users_2fa_enabled ON admin_users(two_factor_enabled);
