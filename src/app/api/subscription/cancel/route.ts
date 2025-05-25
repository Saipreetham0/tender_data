// // src/app/api/subscription/cancel/route.ts
// import { NextResponse } from 'next/server';
// import { cancelSubscription } from '@/lib/razorpay-subscription';
// import { supabase } from '@/lib/supabase';

// export async function POST(request: Request) {
//   try {
//     const { subscriptionId, userEmail } = await request.json();

//     // Verify ownership
//     const { data: subscription } = await supabase
//       .from('user_subscriptions')
//       .select('id')
//       .eq('id', subscriptionId)
//       .eq('user_email', userEmail)
//       .single();

//     if (!subscription) {
//       return NextResponse.json(
//         { error: 'Subscription not found or unauthorized' },
//         { status: 404 }
//       );
//     }

//     const result = await cancelSubscription(subscriptionId);

//     return NextResponse.json({
//       success: true,
//       subscription: result
//     });
//   } catch (error) {
//     console.error('Error cancelling subscription:', error);
//     return NextResponse.json(
//       { error: 'Failed to cancel subscription' },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/cancel/route.ts
import { NextResponse } from 'next/server';
import { RazorpaySubscriptionService } from '@/lib/razorpay-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { subscriptionId, userEmail, cancelAtCycleEnd = true } = await request.json();

    if (!subscriptionId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Verify ownership
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('id, status')
      .eq('id', subscriptionId)
      .eq('user_email', userEmail)
      .single();

    if (!subscription) {
      return NextResponse.json(
        { success: false, error: 'Subscription not found or unauthorized' },
        { status: 404 }
      );
    }

    if (subscription.status === 'cancelled') {
      return NextResponse.json(
        { success: false, error: 'Subscription is already cancelled' },
        { status: 400 }
      );
    }

    const result = await RazorpaySubscriptionService.cancelSubscription(
      subscriptionId,
      cancelAtCycleEnd
    );

    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
