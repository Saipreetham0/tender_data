// // src/app/api/subscription/history/route.ts
// import { NextResponse } from 'next/server';
// import { supabase } from '@/lib/supabase';

// export async function GET(request: Request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const userEmail = searchParams.get('email');
//     const subscriptionId = searchParams.get('subscriptionId');

//     if (!userEmail && !subscriptionId) {
//       return NextResponse.json(
//         { error: 'Email or subscription ID required' },
//         { status: 400 }
//       );
//     }

//     let query = supabase
//       .from('payment_history')
//       .select(`
//         *,
//         subscription:user_subscriptions(
//           id,
//           plan:subscription_plans(name)
//         )
//       `)
//       .order('created_at', { ascending: false });

//     if (subscriptionId) {
//       query = query.eq('subscription_id', subscriptionId);
//     } else if (userEmail) {
//       // Get all subscriptions for the user first
//       const { data: subs } = await supabase
//         .from('user_subscriptions')
//         .select('id')
//         .eq('user_email', userEmail);

//       if (subs && subs.length > 0) {
//         query = query.in('subscription_id', subs.map(s => s.id));
//       }
//     }

//     const { data, error } = await query;

//     if (error) throw error;

//     return NextResponse.json({
//       success: true,
//       payments: data
//     });
//   } catch (error) {
//     console.error('Error fetching payment history:', error);
//     return NextResponse.json(
//       { error: 'Failed to fetch payment history' },
//       { status: 500 }
//     );
//   }
// }


// src/app/api/subscription/history/route.ts
import { NextResponse } from 'next/server';
import { RazorpaySubscriptionService } from '@/lib/razorpay-service';

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

    const payments = await RazorpaySubscriptionService.getPaymentHistory(userEmail, limit);

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
