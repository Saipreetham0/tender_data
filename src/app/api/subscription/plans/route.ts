// // src/app/api/subscription/plans/route.ts
// import { NextResponse } from 'next/server';
// import { getSubscriptionPlans } from '@/lib/subscription';

// export async function GET() {
//   try {
//     const plans = await getSubscriptionPlans();

//     return NextResponse.json({
//       success: true,
//       plans
//     });
//   } catch (error) {
//     console.error('Error fetching subscription plans:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: 'Failed to fetch subscription plans'
//       },
//       { status: 500 }
//     );
//   }
// }

// app/api/subscription/plans/route.ts
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
// import { mockPlans } from "@/utils/subscription";

export async function GET() {
  try {
    // In a real app, this would fetch from your database
    // Example with Supabase:
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    // For now, return mock data
    // const plans = mockPlans.filter(plan => plan.active);

    return NextResponse.json({
      success: true,
      plans,
    });
  } catch (error) {
    console.error("Error fetching plans:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch subscription plans",
      },
      { status: 500 }
    );
  }
}
