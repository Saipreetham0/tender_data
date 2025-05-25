
// // src/app/api/subscription/resume/route.ts
// import { NextResponse } from 'next/server';
// import { resumeSubscription } from '@/lib/razorpay-subscription';

// export async function POST(request: Request) {
//   try {
//     const { subscriptionId } = await request.json();

//     const result = await resumeSubscription(subscriptionId);

//     return NextResponse.json({
//       success: true,
//       subscription: result
//     });
//   } catch (error) {
//     console.error('Error resuming subscription:', error);
//     return NextResponse.json(
//       { error: 'Failed to resume subscription' },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/resume/route.ts
import { NextResponse } from 'next/server';
import { RazorpaySubscriptionService } from '@/lib/razorpay-service';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { subscriptionId } = await request.json();

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    // Verify subscription exists and is paused
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

    if (subscription.status !== 'paused') {
      return NextResponse.json(
        { success: false, error: 'Only paused subscriptions can be resumed' },
        { status: 400 }
      );
    }

    const result = await RazorpaySubscriptionService.resumeSubscription(subscriptionId);

    return NextResponse.json({
      success: true,
      subscription: result
    });
  } catch (error) {
    console.error('Error resuming subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to resume subscription' },
      { status: 500 }
    );
  }
}