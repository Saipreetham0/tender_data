
// src/app/api/admin/expire-subscriptions/route.ts
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

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

    // Process expired subscriptions
    await RazorpayPaymentService.processExpiredSubscriptions();

    return NextResponse.json({
      success: true,
      message: 'Expired subscriptions processed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error processing expired subscriptions:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process expired subscriptions',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}