// src/app/api/admin/init/route.ts
import { NextResponse } from 'next/server';
import { SubscriptionInitService } from '@/lib/subscription-init';

export async function POST(request: Request) {
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

    // Initialize the subscription system
    await SubscriptionInitService.initialize();

    return NextResponse.json({
      success: true,
      message: 'Subscription system initialized successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error initializing system:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'System initialization failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
