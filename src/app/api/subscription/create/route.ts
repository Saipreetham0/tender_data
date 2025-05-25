// src/app/api/subscription/create/route.ts
import { NextResponse } from 'next/server';
import { createRazorpaySubscription } from '@/lib/razorpay-subscription';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Import your auth options


export async function POST(request: Request) {
  try {
    const {
      planId,
      subscriptionType,
      collegePreferences
    } = await request.json();

    // Get user session (adjust based on your auth setup)
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create subscription
    const result = await createRazorpaySubscription({
      userId: session.user.id,
      userEmail: session.user.email,
      planId,
      subscriptionType,
      collegePreferences
    });

    return NextResponse.json({
      success: true,
      subscriptionId: result.razorpaySubscription.id,
      shortUrl: result.razorpaySubscription.short_url,
      subscription: result.subscription,
      plan: result.plan
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}