import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/admin-auth';
import { supabase } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) {
      return admin;
    }

    const paymentId = params.id;

    // Fetch payment details with user information
    const { data: payment, error } = await supabase
      .from('payments')
      .select(`
        *,
        users:user_id (
          id,
          email,
          user_metadata
        ),
        user_subscriptions:subscription_id (
          id,
          plan_name,
          status,
          current_period_start,
          current_period_end
        )
      `)
      .eq('id', paymentId)
      .single();

    if (error) {
      console.error('Error fetching payment:', error);
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    // Log admin activity
    await logAdminActivity(
      admin.email,
      'view_payment_details',
      'payment',
      paymentId
    );

    return NextResponse.json({
      success: true,
      payment
    });

  } catch (error) {
    console.error('Error in payment details API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) {
      return admin;
    }

    const paymentId = params.id;
    const { action, reason } = await request.json();

    let updateData: any = {};
    let activityAction = '';

    switch (action) {
      case 'refund':
        updateData = {
          status: 'refunded',
          refund_reason: reason || 'Admin refund',
          refunded_at: new Date().toISOString(),
          refunded_by: admin.id
        };
        activityAction = 'refund_payment';
        break;

      case 'mark_completed':
        updateData = {
          status: 'completed',
          completed_at: new Date().toISOString()
        };
        activityAction = 'mark_payment_completed';
        break;

      case 'mark_failed':
        updateData = {
          status: 'failed',
          failure_reason: reason || 'Admin marked as failed',
          failed_at: new Date().toISOString()
        };
        activityAction = 'mark_payment_failed';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update payment
    const { data: updatedPayment, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment:', error);
      return NextResponse.json(
        { error: 'Failed to update payment' },
        { status: 500 }
      );
    }

    // Log admin activity
    await logAdminActivity(
      admin.email,
      activityAction,
      'payment',
      paymentId,
      { action, reason, oldStatus: 'previous', newStatus: updateData.status }
    );

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: `Payment ${action} successful`
    });

  } catch (error) {
    console.error('Error in payment update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}