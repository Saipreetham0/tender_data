// src/app/api/subscription/cancel/route.ts
import { NextResponse } from 'next/server';
import { cancelSubscription } from '@/lib/razorpay-subscription';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { subscriptionId, userEmail } = await request.json();

    // Verify ownership
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id')
      .eq('id', subscriptionId)
      .eq('user_email', userEmail)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or unauthorized' },
        { status: 404 }
      );
    }

    const result = await cancelSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
