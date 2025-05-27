// src/app/api/subscription/create/route.ts
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function POST(request: Request) {
  try {
    const {
      planId,
      subscriptionType,
      userEmail,
      userId,
      collegePreferences
    } = await request.json();

    // Validate required fields
    if (!planId || !subscriptionType || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription type' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    try {
      const existingSubscription = await RazorpayPaymentService.getCurrentSubscription(userEmail);
      if (existingSubscription && existingSubscription.status === 'active') {
        return NextResponse.json(
          {
            success: false,
            error: 'User already has an active subscription',
            currentSubscription: existingSubscription
          },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking existing subscription:', error);
    }

    // Create payment order (this will be used for Razorpay checkout)
    const { order, plan } = await RazorpayPaymentService.createPaymentOrder({
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
      plan: plan,
      razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
    });
  } catch (error) {
    console.error('Error creating subscription order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription'
      },
      { status: 500 }
    );
  }
}