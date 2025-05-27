// src/app/api/subscription/check-access/route.ts
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function POST(request: Request) {
  try {
    const { userEmail, feature } = await request.json();

    if (!userEmail || !feature) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const validFeatures = ['filters', 'keyword_filter', 'advanced_filters', 'api', 'all_colleges', 'realtime_alerts'];
    if (!validFeatures.includes(feature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feature specified' },
        { status: 400 }
      );
    }

    const hasAccess = await RazorpayPaymentService.canAccessFeature(userEmail, feature);

    return NextResponse.json({
      success: true,
      hasAccess
    });
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check access' },
      { status: 500 }
    );
  }
}
