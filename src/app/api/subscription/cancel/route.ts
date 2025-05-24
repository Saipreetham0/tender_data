// src/app/api/subscription/cancel/route.ts
import { NextResponse } from 'next/server';
import { cancelSubscription } from '@/lib/subscription';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    await cancelSubscription(email);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel subscription'
      },
      { status: 500 }
    );
  }
}

