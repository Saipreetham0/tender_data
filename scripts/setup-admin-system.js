const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

async function setupAdminSystem() {
  try {
    console.log('Setting up admin system...');

    // Read the SQL migration file
    const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', 'create_admin_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    // Execute the migration
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });

    if (error) {
      console.error('Error executing migration:', error);
      return;
    }

    console.log('✅ Admin system tables created successfully');
    console.log('✅ Default super admin added: koyyalasaipreetham@gmail.com');
    console.log('✅ System settings initialized');
    console.log('✅ Admin activity logging ready');
    console.log('✅ API monitoring ready');

    console.log('\nAdmin system setup complete!');
    console.log('\nNext steps:');
    console.log('1. Make sure you are logged in with koyyalasaipreetham@gmail.com');
    console.log('2. Visit /admin to access the admin panel');
    console.log('3. Use /admin-debug to troubleshoot any access issues');

  } catch (error) {
    console.error('Error setting up admin system:', error);
  }
}

// Alternative function to create tables using individual queries
async function setupAdminSystemAlternative() {
  try {
    console.log('Setting up admin system (alternative method)...');

    // Create admin_roles table
    const { error: adminRolesError } = await supabase.rpc('exec', {
      sql: `
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
      `
    });

    if (adminRolesError) {
      console.error('Error creating admin_roles table:', adminRolesError);
    } else {
      console.log('✅ admin_roles table created');
    }

    // Insert default admin
    const { error: insertError } = await supabase
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

    if (insertError) {
      console.error('Error inserting default admin:', insertError);
    } else {
      console.log('✅ Default super admin added');
    }

    console.log('\nAdmin system setup complete!');

  } catch (error) {
    console.error('Error setting up admin system:', error);
  }
}

// Run the setup
if (require.main === module) {
  setupAdminSystemAlternative();
}

module.exports = { setupAdminSystem, setupAdminSystemAlternative };