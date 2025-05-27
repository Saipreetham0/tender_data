// src/app/api/subscription/current/route.ts
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const subscription = await RazorpayPaymentService.getCurrentSubscription(email);

    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current subscription' },
      { status: 500 }
    );
  }
}
