// src/app/api/payment/create-order/route.ts
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function POST(request: Request) {
  try {
    const { planId, subscriptionType, userEmail, userId, collegePreferences } = await request.json();

    // Validate input
    if (!planId || !subscriptionType || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription type. Must be monthly or yearly' },
        { status: 400 }
      );
    }

    // Create payment order
    const { order, plan, subscriptionData } = await RazorpayPaymentService.createPaymentOrder({
      userId,
      userEmail,
      planId,
      subscriptionType,
      collegePreferences
    });

    return NextResponse.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      plan: {
        name: plan.name,
        description: plan.description,
        features: plan.features
      },
      subscriptionData
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create payment order'
      },
      { status: 500 }
    );
  }
}
