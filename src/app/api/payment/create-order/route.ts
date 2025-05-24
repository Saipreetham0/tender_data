// src/app/api/payment/create-order/route.ts
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getSubscriptionPlans } from '@/lib/subscription';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: Request) {
  try {
    const { planId, subscriptionType, userEmail } = await request.json();

    // Validate input
    if (!planId || !subscriptionType || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get plan details
    const plans = await getSubscriptionPlans();
    const plan = plans.find(p => p.id === planId);

    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    // Calculate amount based on subscription type
    const amount = subscriptionType === 'yearly'
      ? plan.price_yearly
      : plan.price_monthly;

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid plan amount' },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
      notes: {
        planId,
        subscriptionType,
        userEmail,
        planName: plan.name
      }
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
      }
    });

  } catch (error) {
    console.error('Error creating payment order:', error);
    return NextResponse.json(
      { error: 'Failed to create payment order' },
      { status: 500 }
    );
  }
}