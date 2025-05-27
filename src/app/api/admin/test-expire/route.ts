// src/app/api/admin/test-expire/route.ts
// This is a test endpoint to verify subscription expiry logic without actually expiring subscriptions

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    // Check for API key
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    const secretKey = process.env.CRON_API_SECRET_KEY;

    if (!apiKey || apiKey !== secretKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const now = new Date().toISOString();

    // Find subscriptions that WOULD be expired (but don't update them)
    const { data: expiredSubscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_email,
        status,
        ends_at,
        subscription_type,
        plan:subscription_plans(name)
      `)
      .eq('status', 'active')
      .lt('ends_at', now);

    if (error) {
      throw new Error(`Query error: ${error.message}`);
    }

    // Find subscriptions expiring soon (next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    const { data: expiringSoon, error: expiringSoonError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        user_email,
        status,
        ends_at,
        subscription_type,
        plan:subscription_plans(name)
      `)
      .eq('status', 'active')
      .gte('ends_at', now)
      .lte('ends_at', nextWeek.toISOString());

    if (expiringSoonError) {
      throw new Error(`Expiring soon query error: ${expiringSoonError.message}`);
    }

    // Get total active subscriptions
    const { count: totalActive } = await supabase
      .from('user_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    // Calculate days until expiry for each subscription
    const expiredWithDays = expiredSubscriptions?.map(sub => ({
      ...sub,
      daysOverdue: Math.floor((new Date().getTime() - new Date(sub.ends_at).getTime()) / (1000 * 60 * 60 * 24))
    })) || [];

    const expiringSoonWithDays = expiringSoon?.map(sub => ({
      ...sub,
      daysUntilExpiry: Math.floor((new Date(sub.ends_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    })) || [];

    return NextResponse.json({
      success: true,
      message: 'Test completed successfully',
      data: {
        currentTime: now,
        totalActiveSubscriptions: totalActive || 0,
        expiredSubscriptions: {
          count: expiredSubscriptions?.length || 0,
          subscriptions: expiredWithDays
        },
        expiringSoon: {
          count: expiringSoon?.length || 0,
          subscriptions: expiringSoonWithDays
        }
      },
      note: "This is a test endpoint - no subscriptions were actually expired",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in test-expire endpoint:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Test failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  return GET(request);
}