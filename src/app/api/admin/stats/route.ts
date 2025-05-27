
// src/app/api/admin/stats/route.ts - FIXED
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

    // Get comprehensive statistics
    const subscriptionStats = await getDetailedSubscriptionStats();

    // Get tender statistics
    const { data: tenderStats } = await supabase
      .from('tenders')
      .select('source')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    const tendersBySource: Record<string, number> = {};
    tenderStats?.forEach(tender => {
      tendersBySource[tender.source] = (tendersBySource[tender.source] || 0) + 1;
    });

    // Get user statistics
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, created_at')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    // Get usage statistics
    const { data: usage } = await supabase
      .from('user_usage')
      .select('tender_views, api_calls, exports')
      .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);

    const totalUsage = usage?.reduce((acc, curr) => ({
      tender_views: acc.tender_views + (curr.tender_views || 0),
      api_calls: acc.api_calls + (curr.api_calls || 0),
      exports: acc.exports + (curr.exports || 0)
    }), { tender_views: 0, api_calls: 0, exports: 0 }) || { tender_views: 0, api_calls: 0, exports: 0 };

    return NextResponse.json({
      success: true,
      stats: {
        subscriptions: subscriptionStats,
        tenders: {
          totalThisWeek: tenderStats?.length || 0,
          bySource: tendersBySource
        },
        users: {
          newThisMonth: users?.length || 0
        },
        usage: {
          lastWeek: totalUsage
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Stats fetch failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

async function getDetailedSubscriptionStats() {
  try {
    // Get all subscriptions with plan info
    const { data: allSubscriptions, error } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        status,
        amount_paid,
        created_at,
        ends_at,
        subscription_type,
        plan:subscription_plans(name, price_monthly, price_yearly)
      `);

    if (error) throw error;

    const now = new Date();
    const stats = {
      total: allSubscriptions?.length || 0,
      active: 0,
      expired: 0,
      cancelled: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      byPlan: {} as Record<string, number>,
      byStatus: {} as Record<string, number>
    };

    allSubscriptions?.forEach(sub => {
      // Count by status
      stats.byStatus[sub.status] = (stats.byStatus[sub.status] || 0) + 1;

      // Count by plan
      const planName = sub.plan?.name || 'Unknown';
      stats.byPlan[planName] = (stats.byPlan[planName] || 0) + 1;

      // Calculate revenue
      stats.totalRevenue += sub.amount_paid || 0;

      if (sub.subscription_type === 'monthly') {
        stats.monthlyRevenue += sub.amount_paid || 0;
      } else {
        stats.yearlyRevenue += sub.amount_paid || 0;
      }

      // Count active vs expired
      if (sub.status === 'active' && new Date(sub.ends_at) > now) {
        stats.active++;
      } else if (sub.status === 'expired' || new Date(sub.ends_at) <= now) {
        stats.expired++;
      } else if (sub.status === 'cancelled') {
        stats.cancelled++;
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting detailed subscription stats:', error);
    return {
      total: 0,
      active: 0,
      expired: 0,
      cancelled: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      yearlyRevenue: 0,
      byPlan: {},
      byStatus: {}
    };
  }
}