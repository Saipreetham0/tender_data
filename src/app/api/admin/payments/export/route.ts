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
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const status = searchParams.get('status');

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

    // Apply date filters
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch payments' },
        { status: 500 }
      );
    }

    // Create CSV content
    const csvHeaders = [
      'Payment ID',
      'User Email',
      'User Name',
      'Amount (₹)',
      'Currency',
      'Status',
      'Payment Method',
      'Gateway Transaction ID',
      'Gateway',
      'Plan Name',
      'Description',
      'Created At',
      'Completed At',
      'Failed At',
      'Refunded At',
      'Failure Reason',
      'Refund Reason',
      'Gateway Response'
    ].join(',');

    const csvRows = (payments || []).map(payment => {
      const user = payment.users;
      const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || '';
      
      return [
        payment.id,
        user?.email || '',
        `"${userName}"`,
        payment.amount || 0,
        payment.currency || 'INR',
        payment.status,
        payment.payment_method || '',
        payment.gateway_transaction_id || '',
        payment.gateway || '',
        payment.plan_name || '',
        `"${payment.description || ''}"`,
        payment.created_at,
        payment.completed_at || '',
        payment.failed_at || '',
        payment.refunded_at || '',
        `"${payment.failure_reason || ''}"`,
        `"${payment.refund_reason || ''}"`,
        `"${JSON.stringify(payment.gateway_response || {}).replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Log admin activity
    await logAdminActivity(
      admin.email,
      'export_payments',
      'payments',
      undefined,
      { 
        count: payments?.length || 0,
        filters: { startDate, endDate, status }
      }
    );

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error in payments export API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}