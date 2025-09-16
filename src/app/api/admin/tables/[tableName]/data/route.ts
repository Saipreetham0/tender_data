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

    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const search = url.searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build base query
    let query = supabase.from(tableName).select('*', { count: 'exact' });

    // Add search if provided (basic text search across all text columns)
    if (search) {
      // For now, we'll do a simple search on common text fields
      // This could be enhanced to search across all text columns dynamically
      const searchFields = ['email', 'name', 'full_name', 'description', 'message'];
      const searchConditions = searchFields
        .map(field => `${field}.ilike.%${search}%`)
        .join(',');

      try {
        query = query.or(searchConditions);
      } catch (e) {
        // If search fails, continue without search
      }
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    // Add ordering (prefer updated_at, then created_at, then first column)
    try {
      query = query.order('updated_at', { ascending: false });
    } catch (e) {
      try {
        query = query.order('created_at', { ascending: false });
      } catch (e) {
        // If both fail, don't add ordering
      }
    }

    const { data: rows, error, count } = await query;

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return NextResponse.json(
        { success: false, error: `Failed to fetch data from ${tableName}` },
        { status: 500 }
      );
    }

    // Get column names from the first row
    const columns = rows && rows.length > 0 ? Object.keys(rows[0]) : [];

    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json({
      success: true,
      data: {
        columns,
        rows: rows || [],
        totalCount: count || 0,
        currentPage: page,
        totalPages,
        limit
      }
    });

  } catch (error) {
    console.error('Error in table data API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}