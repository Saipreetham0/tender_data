import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/admin-auth';
import { supabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) {
      return admin;
    }

    // Fetch subscriptions from database
    const { data: subscriptions, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

    // Log admin activity
    await logAdminActivity(
      admin.email,
      'view_subscriptions',
      'subscriptions',
      undefined,
      { count: subscriptions?.length || 0 }
    );

    return NextResponse.json({
      success: true,
      subscriptions: subscriptions || []
    });

  } catch (error) {
    console.error('Error in subscriptions API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}