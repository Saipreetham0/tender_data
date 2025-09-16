import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const ALLOWED_TABLES = [
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

function escapeCSVField(field: any): string {
  if (field === null || field === undefined) return '';

  let value = String(field);

  // If field contains comma, newline, or double quote, wrap in quotes
  if (value.includes(',') || value.includes('\n') || value.includes('"')) {
    // Escape existing double quotes by doubling them
    value = value.replace(/"/g, '""');
    value = `"${value}"`;
  }

  return value;
}

function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.map(escapeCSVField).join(',');

  const csvRows = data.map(row =>
    headers.map(header => {
      const value = row[header];
      if (typeof value === 'object' && value !== null) {
        return escapeCSVField(JSON.stringify(value));
      }
      return escapeCSVField(value);
    }).join(',')
  );

  return [csvHeaders, ...csvRows].join('\n');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tableName: string }> }
) {
  try {
    const { tableName } = await params;

    // Validate table name
    if (!ALLOWED_TABLES.includes(tableName)) {
      return NextResponse.json(
        { success: false, error: 'Table not allowed' },
        { status: 400 }
      );
    }

    // Simple admin access
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all data from the table (with reasonable limit)
    let query = supabase.from(tableName).select('*').limit(10000);

    // Add ordering if possible
    try {
      query = query.order('updated_at', { ascending: false });
    } catch (e) {
      try {
        query = query.order('created_at', { ascending: false });
      } catch (e) {
        // If both fail, don't add ordering
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error(`Error exporting data from ${tableName}:`, error);
      return NextResponse.json(
        { success: false, error: `Failed to export data from ${tableName}` },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No data to export' },
        { status: 404 }
      );
    }

    // Convert to CSV
    const csvContent = convertToCSV(data);

    // Create filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${tableName}_export_${timestamp}.csv`;

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error in table export API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}