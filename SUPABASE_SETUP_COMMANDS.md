# Supabase Admin System Setup

## ⚠️ IMPORTANT: Run these SQL commands ONE BY ONE in your Supabase SQL Editor

### Step 1: Create Admin Roles Table

**Run this first:**

```sql
-- Create admin_roles table
CREATE TABLE IF NOT EXISTS admin_roles (
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
```

**Then verify the table was created:**

```sql
-- Check if admin_roles table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_roles';
```

### Step 2: Create Additional Tables

**After admin_roles is created successfully, run these one by one:**

```sql
-- Create admin_activity_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_activity_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

```sql
-- Create system_settings table for admin configurable settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  is_public BOOLEAN DEFAULT false,
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

```sql
-- Create api_logs table for API monitoring
CREATE TABLE IF NOT EXISTS api_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER NOT NULL,
  response_time INTEGER,
  user_id UUID REFERENCES auth.users(id),
  ip_address INET,
  user_agent TEXT,
  request_body JSONB,
  response_body JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Step 3: Create Indexes

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at ON admin_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_category ON system_settings(category);
```

### 3. Enable Row Level Security

```sql
-- Enable Row Level Security
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
```

### 4. Create RLS Policies

```sql
-- Create RLS policies for admin_roles
CREATE POLICY "Admin roles viewable by admins" ON admin_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.email = auth.jwt() ->> 'email' 
      AND ar.is_active = true
    )
  );

CREATE POLICY "Admin roles manageable by super admins" ON admin_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.email = auth.jwt() ->> 'email' 
      AND ar.role = 'super_admin' 
      AND ar.is_active = true
    )
  );

-- Create RLS policies for system_settings
CREATE POLICY "System settings viewable by admins" ON system_settings
  FOR SELECT USING (
    is_public = true OR 
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.email = auth.jwt() ->> 'email' 
      AND ar.is_active = true
    )
  );

CREATE POLICY "System settings manageable by super admins" ON system_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_roles ar 
      WHERE ar.email = auth.jwt() ->> 'email' 
      AND ar.role = 'super_admin' 
      AND ar.is_active = true
    )
  );
```

### Step 5: Insert Default Data

**First, verify admin_roles table exists and has the email column:**

```sql
-- Check admin_roles table structure
\d admin_roles;
```

**If the table exists with all columns, run this:**

```sql
-- Insert default super admin
INSERT INTO admin_roles (email, role, permissions, is_active)
VALUES (
  'koyyalasaipreetham@gmail.com',
  'super_admin',
  '["view_dashboard", "view_users", "view_payments", "view_analytics", "view_api_logs", "manage_users", "manage_payments", "manage_subscriptions", "view_system_logs", "manage_admins", "system_settings", "dangerous_operations", "export_data"]'::jsonb,
  true
) ON CONFLICT (email) DO UPDATE SET
  role = 'super_admin',
  permissions = '["view_dashboard", "view_users", "view_payments", "view_analytics", "view_api_logs", "manage_users", "manage_payments", "manage_subscriptions", "view_system_logs", "manage_admins", "system_settings", "dangerous_operations", "export_data"]'::jsonb,
  is_active = true;
```

-- Insert default system settings
INSERT INTO system_settings (key, value, description, category, is_public) VALUES
('site_name', '"RGUKT Tenders Portal"', 'Website name', 'general', true),
('site_description', '"Your trusted partner for RGUKT tender notifications and opportunities"', 'Website description', 'general', true),
('maintenance_mode', 'false', 'Enable maintenance mode', 'system', false),
('registration_enabled', 'true', 'Allow new user registrations', 'users', false),
('max_free_tier_requests', '10', 'Maximum API requests for free tier users', 'limits', false),
('email_notifications_enabled', 'true', 'Enable email notifications', 'notifications', false)
ON CONFLICT (key) DO NOTHING;
```

### 6. Create Update Triggers

```sql
-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_roles_updated_at
  BEFORE UPDATE ON admin_roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## After Running These Commands:

1. Make sure you are logged in with `koyyalasaipreetham@gmail.com`
2. Visit `/admin` to access the admin panel
3. Use `/admin-debug` to verify your admin access
4. The admin system will now use database-driven roles and permissions

## Admin Panel Features Available:

- ✅ User Management (view, ban, unban, export)
- ✅ Database-driven admin roles
- ✅ Activity logging for all admin actions
- ✅ Role-based permissions system
- ✅ System settings management
- 🔄 Payment management (in progress)
- 🔄 API monitoring (in progress)
- 🔄 Analytics dashboard (in progress)