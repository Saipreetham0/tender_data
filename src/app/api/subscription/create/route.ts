


// // src/app/api/subscription/create/route.ts
// import { NextResponse } from 'next/server';
// import { RazorpaySubscriptionService } from '@/lib/razorpay-service';
// // import { supabase } from '@/lib/supabase';

// export async function POST(request: Request) {
//   try {
//     const {
//       planId,
//       subscriptionType,
//       userEmail,
//       userId,
//       collegePreferences
//     } = await request.json();

//     // Validate required fields
//     if (!planId || !subscriptionType || !userEmail) {
//       return NextResponse.json(
//         { success: false, error: 'Missing required fields' },
//         { status: 400 }
//       );
//     }

//     // Validate subscription type
//     if (!['monthly', 'yearly'].includes(subscriptionType)) {
//       return NextResponse.json(
//         { success: false, error: 'Invalid subscription type' },
//         { status: 400 }
//       );
//     }

//     // Check if user already has an active subscription
//     const existingSubscription = await RazorpaySubscriptionService.getCurrentSubscription(userEmail);
//     if (existingSubscription) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: 'User already has an active subscription',
//           currentSubscription: existingSubscription
//         },
//         { status: 409 }
//       );
//     }

//     // Create subscription
//     const result = await RazorpaySubscriptionService.createSubscription({
//       userId,
//       userEmail,
//       planId,
//       subscriptionType,
//       collegePreferences
//     });

//     return NextResponse.json({
//       success: true,
//       subscriptionId: result.razorpaySubscription.id,
//       checkoutUrl: result.checkoutUrl,
//       subscription: result.subscription,
//       plan: result.plan
//     });
//   } catch (error) {
//     console.error('Error creating subscription:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: error instanceof Error ? error.message : 'Failed to create subscription'
//       },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/create/route.ts
import { NextResponse } from 'next/server';
import { RazorpaySubscriptionService } from '@/lib/razorpay-service';

export async function POST(request: Request) {
  try {
    const {
      planId,
      subscriptionType,
      userEmail,
      userId,
      collegePreferences
    } = await request.json();

    // Validate required fields
    if (!planId || !subscriptionType || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate subscription type
    if (!['monthly', 'yearly'].includes(subscriptionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid subscription type' },
        { status: 400 }
      );
    }

    // Check if user already has an active subscription
    try {
      const existingSubscription = await RazorpaySubscriptionService.getCurrentSubscription(userEmail);
      if (existingSubscription) {
        return NextResponse.json(
          {
            success: false,
            error: 'User already has an active subscription',
            currentSubscription: existingSubscription
          },
          { status: 409 }
        );
      }
    } catch (error) {
      console.error('Error checking existing subscription:', error);
      // Continue anyway - this is not a critical error
    }

    // Create subscription
    const result = await RazorpaySubscriptionService.createSubscription({
      userId,
      userEmail,
      planId,
      subscriptionType,
      collegePreferences
    });

    return NextResponse.json({
      success: true,
      subscriptionId: result.razorpaySubscription.id,
      checkoutUrl: result.checkoutUrl,
      subscription: result.subscription,
      plan: result.plan
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create subscription'
      },
      { status: 500 }
    );
  }
}