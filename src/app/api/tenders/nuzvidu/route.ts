import { NextResponse } from "next/server";
import { APIResponse } from "@/lib/types";
import { scrapeRGUKTNuzviduTenders } from "@/lib/direct-scrapers";
import { cacheHelpers, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";
import { API_RESPONSE_LIMITS, parsePaginationParams, createPaginatedResponse } from "@/lib/scraper-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const cacheKey = CACHE_KEYS.tenderData('nuzvidu');

    const allTenders = await cacheHelpers.getWithFallback(
      cacheKey,
      scrapeRGUKTNuzviduTenders,
      CACHE_TTL.TENDER_DATA
    );

    // Create paginated response
    const paginatedResult = createPaginatedResponse(allTenders, pagination);

    const response = {
      success: true,
      ...paginatedResult,
      timestamp: new Date().toISOString(),
      source: "RGUKT Nuzvidu"
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenders from RGUKT Nuzvidu",
        timestamp: new Date().toISOString(),
        source: "RGUKT Nuzvidu",
      },
      { status: 500 }
    );
  }
}