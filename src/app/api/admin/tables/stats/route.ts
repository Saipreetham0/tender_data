import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TABLES = [
  'user_profiles',
  'user_sessions',
  'user_usage',
  'user_tender_access',
  'subscription_plans',
  'user_subscriptions',
  'payment_orders',
  'payment_history',
  'admin_roles',
  'admin_activity_logs',
  'system_settings',
  'tenders',
  'email_subscriptions',
  'application_logs',
  'metrics',
  'cron_logs',
  'security_events',
  'rate_limits'
];

export async function GET(request: NextRequest) {
  try {
    // Simple admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const stats: Record<string, any> = {};

    // Get count for each table
    for (const tableName of TABLES) {
      try {
        const { count, error } = await supabase
          .from(tableName)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          stats[tableName] = {
            count: count || 0
          };

          // Try to get last updated info for tables with updated_at or created_at
          try {
            const { data: lastRow } = await supabase
              .from(tableName)
              .select('updated_at, created_at')
              .order('updated_at', { ascending: false,  })
              .order('created_at', { ascending: false,  })
              .limit(1)
              .single();

            if (lastRow) {
              stats[tableName].lastUpdated = lastRow.updated_at || lastRow.created_at;
            }
          } catch (e) {
            // Ignore if table doesn't have these columns
          }
        } else {
          console.error(`Error getting count for ${tableName}:`, error);
          stats[tableName] = { count: 0 };
        }
      } catch (e) {
        console.error(`Error processing table ${tableName}:`, e);
        stats[tableName] = { count: 0 };
      }
    }

    return NextResponse.json({
      success: true,
      stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching table stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch table statistics' },
      { status: 500 }
    );
  }
}