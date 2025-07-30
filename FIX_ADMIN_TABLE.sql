-- This SQL script will fix the admin_roles table structure
-- Run this ENTIRE script in your Supabase SQL Editor

-- Step 1: Drop the existing admin_roles table if it exists
DROP TABLE IF EXISTS admin_roles CASCADE;

-- Step 2: Create the admin_roles table with correct structure
CREATE TABLE admin_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_by UUID REFERENCES auth.users(id)
);

-- Step 3: Create index on email column
CREATE INDEX idx_admin_roles_email ON admin_roles(email);

-- Step 4: Enable Row Level Security
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS policy
CREATE POLICY "Admin roles viewable by admins" ON admin_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.email = auth.jwt() ->> 'email' 
      AND ar.is_active = true
    )
  );

-- Step 6: Insert the default super admin
INSERT INTO admin_roles (email, role, permissions, is_active)
VALUES (
  'koyyalasaipreetham@gmail.com',
  'super_admin',
  '["view_dashboard", "view_users", "view_payments", "view_analytics", "view_api_logs", "manage_users", "manage_payments", "manage_subscriptions", "view_system_logs", "manage_admins", "system_settings", "dangerous_operations", "export_data"]'::jsonb,
  true
);

-- Step 7: Verify the table was created correctly
SELECT 
  'admin_roles table created successfully' as status,
  email,
  role,
  is_active,
  jsonb_array_length(permissions) as permission_count
FROM admin_roles 
WHERE email = 'koyyalasaipreetham@gmail.com';