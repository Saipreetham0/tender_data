// src/app/api/p/plans/route.ts
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET() {
  try {
    const { data: plans, error } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json({
      success: true,
      plans: plans || [],
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch subscription plans" },
      { status: 500 }
    );
  }
}
