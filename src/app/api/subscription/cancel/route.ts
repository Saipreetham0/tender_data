// // src/app/api/subscription/cancel/route.ts
// import { NextResponse } from "next/server";
// import { RazorpayPaymentService } from "@/lib/razorpay-payment";

// export async function POST(request: Request) {
//   try {
//     const { subscriptionId, userEmail } = await request.json();

//     if (!subscriptionId || !userEmail) {
//       return NextResponse.json(
//         { success: false, error: "Missing required fields" },
//         { status: 400 }
//       );
//     }

//     const subscription = await RazorpayPaymentService.cancelSubscription(
//       subscriptionId,
//       userEmail
//     );

//     return NextResponse.json({
//       success: true,
//       subscription,
//       message: "Subscription cancelled successfully",
//     });
//   } catch (error) {
//     console.error("Error cancelling subscription:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           error instanceof Error
//             ? error.message
//             : "Failed to cancel subscription",
//       },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/cancel/route.ts - UPDATED
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function POST(request: Request) {
  try {
    const { subscriptionId, userEmail } = await request.json();

    if (!subscriptionId || !userEmail) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await RazorpayPaymentService.cancelSubscription(subscriptionId, userEmail);

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully. You will continue to have access until the end of your subscription period.',
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