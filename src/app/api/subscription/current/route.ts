import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Get user subscription with plan details
    let query = supabase
      .from('user_subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('status', 'active');

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('user_email', email);
    }

    const { data: subscription, error } = await query
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching subscription:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription: subscription || null
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// // app/api/subscription/current/route.ts
// import { NextRequest, NextResponse } from "next/server";
// import { mockPlans } from "@/utils/subscription";
// import { UserSubscription } from "@/types/subscription";

// export async function GET(request: NextRequest) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const email = searchParams.get("email");

//     if (!email) {
//       return NextResponse.json(
//         {
//           success: false,
//           error: "Email parameter is required",
//         },
//         { status: 400 }
//       );
//     }

//     // In a real app, this would fetch from your database
//     // Example with Supabase:
//     // const { data: subscription, error } = await supabase
//     //   .from('user_subscriptions')
//     //   .select(`
//     //     *,
//     //     plan:subscription_plans(*)
//     //   `)
//     //   .eq('user_email', email)
//     //   .eq('status', 'active')
//     //   .single();

//     // Mock response - simulate different users having different subscriptions
//     let mockSubscription: UserSubscription | null = null;

//     // For demo purposes, create a mock subscription for certain emails
//     if (email === "user@example.com" || email.includes("demo")) {
//       const now = new Date();
//       const nextMonth = new Date(now);
//       nextMonth.setMonth(nextMonth.getMonth() + 1);

//       mockSubscription = {
//         id: "sub_123",
//         user_id: "user_123",
//         plan: mockPlans[2], // All Colleges plan
//         status: "active",
//         subscription_type: "yearly",
//         razorpay_subscription_id: "sub_razorpay_123",
//         current_period_start: now.toISOString(),
//         current_period_end: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
//         next_billing_at: new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString(),
//         created_at: now.toISOString(),
//         updated_at: now.toISOString(),
//       };
//     }

//     return NextResponse.json({
//       success: true,
//       subscription: mockSubscription,
//     });
//   } catch (error) {
//     console.error("Error fetching current subscription:", error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: "Failed to fetch current subscription",
//       },
//       { status: 500 }
//     );
//   }
// }