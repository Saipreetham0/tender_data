const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkAdminSetup() {
  console.log('🔍 Checking admin system setup...\n');

  // Check if admin_roles table exists
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .limit(1);

    if (error) {
      console.log('❌ admin_roles table does not exist');
      console.log('Error:', error.message);
      console.log('\n📋 Next steps:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Open the SQL Editor');
      console.log('3. Run the commands from SUPABASE_SETUP_COMMANDS.md one by one');
      return;
    }

    console.log('✅ admin_roles table exists');

    // Check if admin user exists
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('email', 'koyyalasaipreetham@gmail.com')
      .single();

    if (adminError) {
      console.log('❌ Admin user not found');
      console.log('Run this SQL command in Supabase:');
      console.log(`
INSERT INTO admin_roles (email, role, permissions, is_active)
VALUES (
  'koyyalasaipreetham@gmail.com',
  'super_admin',
  '["view_dashboard", "view_users", "view_payments", "view_analytics", "view_api_logs", "manage_users", "manage_payments", "manage_subscriptions", "view_system_logs", "manage_admins", "system_settings", "dangerous_operations", "export_data"]'::jsonb,
  true
);
      `);
      return;
    }

    console.log('✅ Admin user exists');
    console.log('📊 Admin details:');
    console.log('- Email:', adminUser.email);
    console.log('- Role:', adminUser.role);
    console.log('- Active:', adminUser.is_active);
    console.log('- Permissions:', adminUser.permissions?.length || 0, 'permissions');

    // Check other tables
    const tables = ['admin_activity_logs', 'system_settings', 'api_logs'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ ${table} table does not exist`);
        } else {
          console.log(`✅ ${table} table exists`);
        }
      } catch (err) {
        console.log(`❌ ${table} table does not exist`);
      }
    }

    console.log('\n🎉 Admin system setup is complete!');
    console.log('\n📝 What you can do now:');
    console.log('1. Login with koyyalasaipreetham@gmail.com');
    console.log('2. Visit /admin-debug to verify access');
    console.log('3. Go to /admin to use the admin panel');

  } catch (error) {
    console.error('❌ Error checking admin setup:', error);
  }
}

// Run the check
if (require.main === module) {
  checkAdminSetup();
}

module.exports = { checkAdminSetup };