
// src/app/api/subscription/plans/route.ts
import { NextResponse } from 'next/server';
import { getSubscriptionPlans } from '@/lib/subscription';

export async function GET() {
  try {
    const plans = await getSubscriptionPlans();

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription plans'
      },
      { status: 500 }
    );
  }
}