const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function diagnosePrimaryIssue() {
  console.log('🔍 Diagnosing database issue...\n');

  try {
    // First, let's see what tables exist
    console.log('📋 Checking what tables exist in your database:');
    
    const { data: tables, error: tablesError } = await supabase.rpc('exec', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('❌ Cannot query tables. Let\'s try a different approach...');
      
      // Try to list tables using a simple query
      const { data: simpleCheck, error: simpleError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (simpleError) {
        console.log('❌ Cannot access information_schema. Checking specific table...');
        
        // Try to query admin_roles directly
        const { data: adminRolesCheck, error: adminRolesError } = await supabase
          .from('admin_roles')
          .select('*')
          .limit(1);
          
        if (adminRolesError) {
          console.log('❌ admin_roles table does not exist');
          console.log('Error details:', adminRolesError);
          console.log('\n🔧 SOLUTION: Run this SQL command in Supabase SQL Editor:');
          console.log(`
DROP TABLE IF EXISTS admin_roles CASCADE;

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

-- Add the admin user
INSERT INTO admin_roles (email, role, permissions, is_active)
VALUES (
  'koyyalasaipreetham@gmail.com',
  'super_admin',
  '["view_dashboard", "view_users", "view_payments", "view_analytics", "view_api_logs", "manage_users", "manage_payments", "manage_subscriptions", "view_system_logs", "manage_admins", "system_settings", "dangerous_operations", "export_data"]'::jsonb,
  true
);
          `);
        } else {
          console.log('✅ admin_roles table exists but might have wrong structure');
          
          // Check the actual columns
          const { data: columns, error: columnsError } = await supabase.rpc('exec', {
            sql: `
              SELECT column_name, data_type 
              FROM information_schema.columns 
              WHERE table_name = 'admin_roles' 
              ORDER BY ordinal_position;
            `
          });
          
          if (!columnsError && columns) {
            console.log('📊 Current admin_roles columns:');
            columns.forEach(col => {
              console.log(`- ${col.column_name}: ${col.data_type}`);
            });
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Diagnosis error:', error);
    console.log('\n🔧 Manual Solution:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Go to Table Editor');
    console.log('3. Delete the admin_roles table if it exists');
    console.log('4. Go to SQL Editor');
    console.log('5. Run the CREATE TABLE command shown above');
  }
}

// Run the diagnosis
if (require.main === module) {
  diagnosePrimaryIssue();
}

module.exports = { diagnosePrimaryIssue };