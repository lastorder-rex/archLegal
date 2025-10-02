-- Create admin users table for supercore admin panel
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE
);

-- Create index for username lookup
CREATE INDEX idx_admin_users_username ON admin_users(username);

-- Insert default admin account
-- Password: tkddn76!@#
-- Using bcrypt hash with cost factor 10
INSERT INTO admin_users (username, password_hash, created_at)
VALUES (
  'rex',
  '$2b$10$uH0.f9lU.GoaOIn16aUxUucCU04e7lqhmhmbtJM6hEi9zEhalZehm',
  CURRENT_TIMESTAMP
);

-- Add comment for security reminder
COMMENT ON TABLE admin_users IS 'Admin users for supercore dashboard. Passwords must be hashed with bcrypt.';
