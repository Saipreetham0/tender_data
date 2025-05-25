
// src/app/api/subscription/resume/route.ts
import { NextResponse } from 'next/server';
import { resumeSubscription } from '@/lib/razorpay-subscription';

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    const result = await resumeSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}