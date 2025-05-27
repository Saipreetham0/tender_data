// src/app/api/subscription/extend/route.ts (Admin only)
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function POST(request: Request) {
  try {
    // Check for API key (admin access)
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    const secretKey = process.env.CRON_API_SECRET_KEY;

    if (!apiKey || apiKey !== secretKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { subscriptionId, userEmail, months } = await request.json();

    if (!subscriptionId || !userEmail || !months) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subscription = await RazorpayPaymentService.extendSubscription(subscriptionId, userEmail, months);

    return NextResponse.json({
      success: true,
      subscription,
      message: `Subscription extended by ${months} months`
    });
  } catch (error) {
    console.error('Error extending subscription:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to extend subscription' },
      { status: 500 }
    );
  }
}