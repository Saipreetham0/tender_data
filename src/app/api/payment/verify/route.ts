// // src/app/api/payment/verify/route.ts
// import { NextResponse } from "next/server";
// import { RazorpayPaymentService } from "@/lib/razorpay-payment";

// export async function POST(request: Request) {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//       planId,
//       subscriptionType,
//       userEmail,
//       userId,
//       collegePreferences,
//     } = await request.json();

//     // Validate required fields
//     if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
//       return NextResponse.json(
//         { success: false, error: "Missing payment verification data" },
//         { status: 400 }
//       );
//     }

//     if (!planId || !subscriptionType || !userEmail) {
//       return NextResponse.json(
//         { success: false, error: "Missing subscription data" },
//         { status: 400 }
//       );
//     }

//     // Verify payment and activate subscription
//     const subscription =
//       await RazorpayPaymentService.verifyPaymentAndActivateSubscription(
//         {
//           razorpay_order_id,
//           razorpay_payment_id,
//           razorpay_signature,
//         },
//         {
//           planId,
//           subscriptionType,
//           userEmail,
//           userId,
//           collegePreferences,
//         }
//       );

//     return NextResponse.json({
//       success: true,
//       message: "Payment verified and subscription activated",
//       subscription,
//     });
//   } catch (error) {
//     console.error("Error verifying payment:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error:
//           error instanceof Error ? error.message : "Failed to verify payment",
//       },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/payment/verify/route.ts - UPDATED
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      subscriptionType,
      userEmail
    } = await request.json();

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature ||
        !planId || !subscriptionType || !userEmail) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const subscription = await RazorpayPaymentService.verifyPaymentAndCreateSubscription({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      subscriptionType,
      userEmail
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to verify payment' },
      { status: 500 }
    );
  }
}