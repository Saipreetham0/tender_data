// src/app/api/subscription/change-plan/route.ts
import { NextResponse } from 'next/server';
import { changeSubscriptionPlan } from '@/lib/razorpay-subscription';

export async function POST(request: Request) {
  try {
    const { subscriptionId, newPlanId, subscriptionType } = await request.json();

    const result = await changeSubscriptionPlan(
      subscriptionId,
      newPlanId,
      subscriptionType
    );

    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}