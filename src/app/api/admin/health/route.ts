
// src/app/api/admin/health/route.ts
import { NextResponse } from 'next/server';
import { SubscriptionInitService } from '@/lib/subscription-init';

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
    const health = await SubscriptionInitService.getSystemHealth();
    const stats = await SubscriptionInitService.getSubscriptionStats();

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
