
// // src/app/api/subscription/pause/route.ts
// import { NextResponse } from 'next/server';
// import { pauseSubscription } from '@/lib/razorpay-subscription';

// export async function POST(request: Request) {
//   try {
//     const { subscriptionId, pauseUntil } = await request.json();

//     const result = await pauseSubscription(
//       subscriptionId,
//       pauseUntil ? new Date(pauseUntil) : undefined
//     );

//     return NextResponse.json({
//       success: true,
//       subscription: result
//     });
//   } catch (error) {
//     console.error('Error pausing subscription:', error);
//     return NextResponse.json(
//       { error: 'Failed to pause subscription' },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/pause/route.ts
import { NextResponse } from 'next/server';
import { RazorpaySubscriptionService } from '@/lib/razorpay-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { subscriptionId, pauseUntil } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Verify subscription exists and is active
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id, status')
      .eq('id', subscriptionId)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found' },
        { status: 404 }
      );
    }

    if (subscription.status !== 'active') {
      return NextResponse.json(
        { success: false, error: 'Only active subscriptions can be paused' },
        { status: 400 }
      );
    }

    const result = await RazorpaySubscriptionService.pauseSubscription(
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
      { success: false, error: 'Failed to pause subscription' },
      { status: 500 }
    );
  }
}