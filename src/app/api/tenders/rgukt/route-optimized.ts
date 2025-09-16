// src/app/api/tenders/rgukt/route-optimized.ts - Optimized version for disabled route

import { NextResponse } from "next/server";
import { createRateLimitMiddleware } from "@/lib/rate-limiter";

const rateLimitCheck = createRateLimitMiddleware('API');

export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimitCheck(request, 'rgukt-tenders');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    console.log("🚀 RGUKT API: Route temporarily disabled");

    // Return consistent response for disabled route
    return NextResponse.json({
      success: false,
      error: "RGUKT tender route is temporarily disabled for maintenance",
      timestamp: new Date().toISOString(),
      source: "RGUKT Main",
      data: [],
      disabled: true,
      message: "This route is under maintenance. Please check other campuses for tenders."
    }, { status: 503 });

  } catch (error) {
    console.error("Error in RGUKT API route:", error);
    return NextResponse.json({
      success: false,
      error: "RGUKT tender route is temporarily disabled",
      timestamp: new Date().toISOString(),
      source: "RGUKT Main",
      data: [],
      disabled: true
    }, { status: 503 });
  }
}