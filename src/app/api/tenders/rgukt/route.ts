import { NextResponse } from "next/server";

// TEMPORARILY DISABLED - RGUKT Route
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "RGUKT tender route is temporarily disabled",
      timestamp: new Date().toISOString(),
      source: "RGUKT Main",
      data: []
    },
    { status: 503 }
  );
}