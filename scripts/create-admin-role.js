const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function createAdminRole() {
  try {
    console.log('Creating admin role for koyyalasaipreetham@gmail.com...');

    // First, let's check if the admin_roles table exists by trying to query it
    const { data: testQuery, error: testError } = await supabase
      .from('admin_roles')
      .select('*')
      .limit(1);

    if (testError) {
      console.log('admin_roles table does not exist yet. Please create it manually in Supabase.');
      console.log('SQL to run in Supabase SQL Editor:');
      console.log(`
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON admin_roles(user_id);

-- Enable Row Level Security
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

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
      `);
      return;
    }

    console.log('✅ admin_roles table exists');

    // Insert/update the admin role
    const { data, error } = await supabase
      .from('admin_roles')
      .upsert({
        email: 'koyyalasaipreetham@gmail.com',
        role: 'super_admin',
        permissions: [
          'view_dashboard', 'view_users', 'view_payments', 'view_analytics', 
          'view_api_logs', 'manage_users', 'manage_payments', 'manage_subscriptions', 
          'view_system_logs', 'manage_admins', 'system_settings', 'dangerous_operations', 
          'export_data'
        ],
        is_active: true
      }, {
        onConflict: 'email'
      });

    if (error) {
      console.error('Error creating admin role:', error);
      return;
    }

    console.log('✅ Admin role created/updated successfully for koyyalasaipreetham@gmail.com');
    console.log('✅ Role: super_admin');
    console.log('✅ All permissions granted');

    // Test the admin authentication
    console.log('\nTesting admin authentication...');
    const { data: adminData, error: adminError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('email', 'koyyalasaipreetham@gmail.com')
      .single();

    if (adminError) {
      console.error('Error testing admin auth:', adminError);
      return;
    }

    console.log('✅ Admin authentication test successful');
    console.log('Admin data:', JSON.stringify(adminData, null, 2));

    console.log('\n🎉 Admin system is ready!');
    console.log('You can now:');
    console.log('1. Log in with koyyalasaipreetham@gmail.com');
    console.log('2. Visit /admin to access the admin panel');
    console.log('3. Use /admin-debug to verify your access');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the setup
if (require.main === module) {
  createAdminRole();
}

module.exports = { createAdminRole };