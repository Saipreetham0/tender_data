
// src/app/api/subscription/pause/route.ts
import { NextResponse } from 'next/server';
import { pauseSubscription } from '@/lib/razorpay-subscription';

export async function POST(request: Request) {
  try {
    const { subscriptionId, pauseUntil } = await request.json();

    const result = await pauseSubscription(
      subscriptionId,
      pauseUntil ? new Date(pauseUntil) : undefined
    );

    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('Error pausing subscription:', error);
    return NextResponse.json(
      { error: 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}