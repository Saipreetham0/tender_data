// // src/app/api/subscription/history/route.ts
// import { NextResponse } from 'next/server';
// import { RazorpayPaymentService } from '@/lib/razorpay-payment';

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const userEmail = searchParams.get('email');
//     const limit = parseInt(searchParams.get('limit') || '10');

//     if (!userEmail) {
//       return NextResponse.json(
//         { success: false, error: 'Email parameter is required' },
//         { status: 400 }
//       );
//     }

//     const payments = await RazorpayPaymentService.getPaymentHistory(userEmail, limit);

//     return NextResponse.json({
//       success: true,
//       payments
//     });
//   } catch (error) {
//     console.error('Error fetching payment history:', error);
//     return NextResponse.json(
//       { success: false, error: 'Failed to fetch payment history' },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/history/route.ts - UPDATED
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userEmail) {
      return NextResponse.json(
        { success: false, error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    const payments = await RazorpayPaymentService.getPaymentHistory(userEmail, limit);

    return NextResponse.json({
      success: true,
      payments
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}