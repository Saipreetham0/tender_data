// src/app/api/admin/health/route.ts - Production-ready health check
import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-jwt';
import { monitoring } from '@/lib/monitoring';
import { logger } from '@/lib/logger';
import { createClient } from '@supabase/supabase-js';

/**
 * @swagger
 * /api/admin/health:
 *   get:
 *     tags:
 *       - Admin Health
 *     summary: Get comprehensive system health status
 *     description: Returns detailed system health information including database connectivity, service status, subscription statistics, and performance metrics
 *     security:
 *       - AdminApiKey: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: key
 *         schema:
 *           type: string
 *         description: Admin API key (alternative to header authentication)
 *     responses:
 *       200:
 *         description: System health status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   allOf:
 *                     - $ref: '#/components/schemas/SystemHealth'
 *                     - type: object
 *                       properties:
 *                         subscriptions:
 *                           type: object
 *                           properties:
 *                             total:
 *                               type: integer
 *                               example: 150
 *                             active:
 *                               type: integer
 *                               example: 125
 *                             free:
 *                               type: integer
 *                               example: 80
 *                             basic:
 *                               type: integer
 *                               example: 30
 *                             premium:
 *                               type: integer
 *                               example: 15
 *                         requestCount:
 *                           type: integer
 *                           example: 1542
 *                         responseTime:
 *                           type: number
 *                           format: float
 *                           example: 45.2
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2025-01-13T10:30:00.000Z'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Authentication check
    const authHeader = request.headers.get('Authorization');
    const apiKey = new URL(request.url).searchParams.get('key');
    
    if (!authHeader && !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate API key or JWT token
    if (apiKey) {
      const isValid = await AuthService.authenticateAdmin(apiKey);
      if (!isValid) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }
    } else if (authHeader) {
      try {
        await AuthService.requireAdminAuth(request);
      } catch (error) {
        return NextResponse.json(
          { success: false, error: 'Invalid authentication' },
          { status: 401 }
        );
      }
    }

    // Get comprehensive system health
    const systemHealth = await monitoring.getSystemHealth();

    // Get subscription stats
    const stats = await getSubscriptionStats();

    // Combine health and stats
    const response = {
      success: true,
      ...systemHealth,
      stats,
    };

    // Log health check
    const responseTime = Date.now() - startTime;
    logger.info('Health check completed', {
      status: systemHealth.status,
      responseTime,
      checksCount: systemHealth.checks.length,
      requestId: request.headers.get('X-Request-ID'),
    });

    // Record metrics
    await monitoring.recordPerformanceMetric('/api/admin/health', responseTime, 200);

    return NextResponse.json(response, {
      status: systemHealth.status === 'healthy' ? 200 : 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    logger.error('Health check failed', error as Error, {
      responseTime,
      requestId: request.headers.get('X-Request-ID'),
    });

    await monitoring.recordErrorMetric(
      error instanceof Error ? error.message : 'Health check failed',
      'health-check'
    );

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
        status: 'unhealthy',
      },
      { status: 500 }
    );
  }
}

// Get subscription statistics
async function getSubscriptionStats() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const totalRevenue = activeSubscriptions?.reduce((sum: number, sub: any) => sum + (sub.amount_paid || 0), 0) || 0;
    const recentSignups = recentSubs?.length || 0;

    // Plan distribution
    const planDistribution: Record<string, number> = {};
    activeSubscriptions?.forEach((sub: any) => {
      const planName = sub.plan[0]?.name || 'Unknown';
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

