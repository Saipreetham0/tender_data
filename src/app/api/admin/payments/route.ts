import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/admin-auth';
import { supabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) {
      return admin;
    }

    // Get URL search params for filtering
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('payments')
      .select(`
        *,
        users:user_id (
          email,
          user_metadata
        )
      `)
      .order('created_at', { ascending: false });

    // Apply status filter if provided
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: payments, error, count } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Get payment statistics
    const { data: stats } = await supabase
      .from('payments')
      .select('status, amount')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    const paymentStats = {
      totalPayments: count || 0,
      successfulPayments: stats?.filter(p => p.status === 'completed').length || 0,
      pendingPayments: stats?.filter(p => p.status === 'pending').length || 0,
      failedPayments: stats?.filter(p => p.status === 'failed').length || 0,
      totalRevenue: stats?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0,
      monthlyRevenue: stats?.filter(p => p.status === 'completed').reduce((sum, p) => sum + (p.amount || 0), 0) || 0
    };

    // Log admin activity
    await logAdminActivity(
      admin.email,
      'view_payments',
      'payments',
      undefined,
      { page, limit, status, count: payments?.length || 0 }
    );

    return NextResponse.json({
      success: true,
      payments: payments || [],
      stats: paymentStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in payments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}