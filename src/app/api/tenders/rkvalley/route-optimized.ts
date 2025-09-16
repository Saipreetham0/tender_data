// src/app/api/tenders/rkvalley/route-optimized.ts - Optimized version using cached data

import { NextResponse } from "next/server";
import { getCachedTenderData } from "@/lib/centralized-scraper";
import { createRateLimitMiddleware } from "@/lib/rate-limiter";
import { parsePaginationParams, createPaginatedResponse } from "@/lib/scraper-utils";

const rateLimitCheck = createRateLimitMiddleware('API');

export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimitCheck(request, 'rkvalley-tenders');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { searchParams } = new URL(request.url);

    // Parse pagination parameters
    const pagination = parsePaginationParams(searchParams);

    console.log("🚀 RK Valley API: Fetching cached data...");

    // Get cached data - this is MUCH faster than scraping
    const cachedData = await getCachedTenderData('rkvalley');

    if (!cachedData.success) {
      return NextResponse.json({
        success: false,
        error: "Failed to fetch tenders from cache",
        timestamp: new Date().toISOString(),
        source: "RGUKT RK Valley",
        data: []
      }, { status: 500 });
    }

    // Apply pagination if requested
    if (pagination.page && pagination.limit) {
      const paginatedResponse = createPaginatedResponse(
        cachedData.data || [],
        pagination
      );

      return NextResponse.json({
        ...paginatedResponse,
        cached: cachedData.cached,
        fallback: cachedData.fallback,
        lastUpdated: cachedData.timestamp
      });
    }

    // Return all data
    return NextResponse.json({
      success: true,
      data: cachedData.data || [],
      timestamp: cachedData.timestamp,
      source: "RGUKT RK Valley",
      totalTenders: cachedData.totalTenders || 0,
      cached: cachedData.cached,
      fallback: cachedData.fallback
    });

  } catch (error) {
    console.error("Error in RK Valley API route:", error);
    return NextResponse.json({
      success: false,
      error: "Failed to fetch tenders from RGUKT RK Valley",
      timestamp: new Date().toISOString(),
      source: "RGUKT RK Valley",
      data: []
    }, { status: 500 });
  }
}