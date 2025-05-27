// src/app/api/admin/health/route.ts - FIXED
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

    // Get system health
    const health = await getSystemHealth();
    const stats = await getSubscriptionStats();

    return NextResponse.json({
      success: true,
      health,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error checking system health:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// System health check function
async function getSystemHealth() {
  const issues: string[] = [];
  const services = {
    database: false,
    razorpay: false,
    email: false,
    cron: false
  };

  try {
    // Test database connection
    try {
      const { error } = await supabase.from('subscription_plans').select('count').limit(1);
      services.database = !error;
      if (error) issues.push(`Database: ${error.message}`);
    } catch (error) {
      issues.push('Database: Connection failed');
    }

    // Test Razorpay configuration
    if (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
      services.razorpay = true;
    } else {
      issues.push('Razorpay: Missing API keys');
    }

    // Test email configuration
    if (process.env.RESEND_API_KEY) {
      services.email = true;
    } else {
      issues.push('Email: Missing Resend API key');
    }

    // Test cron configuration
    if (process.env.CRON_API_SECRET_KEY) {
      services.cron = true;
    } else {
      issues.push('Cron: Missing API secret key');
    }

    const healthy = Object.values(services).every(status => status);

    return {
      healthy,
      issues,
      services
    };
  } catch (error) {
    return {
      healthy: false,
      issues: [`System health check failed: ${error}`],
      services
    };
  }
}

// Get subscription statistics
async function getSubscriptionStats() {
  try {
    // Get active subscriptions
    const { data: activeSubscriptions, error: activeError } = await supabase
      .from('user_subscriptions')
      .select(`
        id,
        amount_paid,
        plan:subscription_plans(name)
      `)
      .eq('status', 'active');

    if (activeError) throw activeError;

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentSubs, error: recentError } = await supabase
      .from('user_subscriptions')
      .select('id')
      .gte('created_at', thirtyDaysAgo.toISOString());

    if (recentError) throw recentError;

    // Calculate statistics
    const totalActiveSubscriptions = activeSubscriptions?.length || 0;
    const totalRevenue = activeSubscriptions?.reduce((sum, sub) => sum + (sub.amount_paid || 0), 0) || 0;
    const recentSignups = recentSubs?.length || 0;

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    activeSubscriptions?.forEach(sub => {
      const planName = sub.plan?.name || 'Unknown';
      planDistribution[planName] = (planDistribution[planName] || 0) + 1;
    });

    return {
      totalActiveSubscriptions,
      totalRevenue,
      planDistribution,
      recentSignups
    };
  } catch (error) {
    console.error('Error fetching subscription stats:', error);
    return {
      totalActiveSubscriptions: 0,
      totalRevenue: 0,
      planDistribution: {},
      recentSignups: 0
    };
  }
}
