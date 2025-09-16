import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Tender, APIResponse } from "@/lib/types";
import {
  robustAxiosGet,
  fixRelativeUrl,
  handleScrapingError,
  DEFAULT_SCRAPER_CONFIG,
  DEFAULT_SCRAPING_LIMITS,
  API_RESPONSE_LIMITS,
  parsePaginationParams,
  createPaginatedResponse
} from "@/lib/scraper-utils";
import { createFallbackResponse, shouldUseFallback } from "@/lib/scraper-fallback";
import { enhancedTableScraper } from "@/lib/enhanced-scraper";
import { cacheHelpers, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

async function scrapeRKValleyTenders(): Promise<Tender[]> {
  try {
    console.log("Starting RK Valley tender scraping for 20 tenders...");

    // Try enhanced scraper first
    const enhancedTenders = await enhancedTableScraper(
      "https://www.rguktrkv.ac.in",
      "RGUKT RK Valley",
      "/Institute.php?view=Tenders",
      [
        "/Institute.php?view=Tender",
        "/tenders.php",
        "/tenders",
        "/Institute.php?page=tenders"
      ]
    );

    if (enhancedTenders.length > 0) {
      return enhancedTenders;
    }

    // Fallback to original method if enhanced scraper doesn't work
    console.log("Enhanced scraper didn't work, trying original method...");
    const baseUrl = "https://www.rguktrkv.ac.in";
    const allTenders: Tender[] = [];

    // Function to scrape tenders from a single page
    const scrapePage = async (url: string) => {
      const response = await robustAxiosGet(url, DEFAULT_SCRAPER_CONFIG);
      const $ = cheerio.load(response.data);
      const pageTenders: Tender[] = [];

      $("table tr:gt(0)").each((_, element) => {
        const cols = $(element).find("td");
        if (cols.length === 4) {
          const downloadLinks = $(cols[3])
            .find("a")
            .map((_, link) => ({
              text: $(link).text().trim(),
              url: fixRelativeUrl($(link).attr("href") || "", baseUrl),
            }))
            .get();

          const tender = {
            name: $(cols[0]).text().trim(),
            postedDate: $(cols[1]).text().trim(),
            closingDate: $(cols[2]).text().trim(),
            downloadLinks,
          };

          if (tender.name) {
            pageTenders.push(tender);
          }
        }
      });

      return pageTenders;
    };

    // Try different URL patterns to get more tenders
    const urlsToTry = [
      `${baseUrl}/Institute.php?view=Tenders`,
      `${baseUrl}/Institute.php?view=Tenders&page=1`,
      `${baseUrl}/Institute.php?view=Tenders&limit=20`,
    ];

    for (const url of urlsToTry) {
      if (allTenders.length >= DEFAULT_SCRAPING_LIMITS.maxTenders) break;

      try {
        console.log(`RK Valley: Trying URL - ${url}`);
        const pageTenders = await scrapePage(url);

        // Add unique tenders (avoid duplicates)
        for (const tender of pageTenders) {
          const isDuplicate = allTenders.some(existing =>
            existing.name === tender.name && existing.postedDate === tender.postedDate
          );
          if (!isDuplicate && allTenders.length < DEFAULT_SCRAPING_LIMITS.maxTenders) {
            allTenders.push(tender);
          }
        }

        console.log(`RK Valley: Found ${pageTenders.length} tenders from ${url} (total: ${allTenders.length})`);
      } catch (error) {
        console.log(`RK Valley: Failed to scrape ${url}:`, error);
        continue;
      }
    }

    console.log(`RK Valley: Successfully scraped ${allTenders.length} tenders`);
    return allTenders;
  } catch (error) {
    handleScrapingError(error, "RGUKT RK Valley");
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const cacheKey = CACHE_KEYS.tenderData('rkvalley');

    const allTenders = await cacheHelpers.getWithFallback(
      cacheKey,
      scrapeRKValleyTenders,
      CACHE_TTL.TENDER_DATA
    );

    // Create paginated response
    const paginatedResult = createPaginatedResponse(allTenders, pagination);

    const response = {
      success: true,
      ...paginatedResult,
      timestamp: new Date().toISOString(),
      source: "RGUKT RK Valley"
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);

    // Use fallback for network/timeout errors
    if (shouldUseFallback(error)) {
      console.log("Using fallback data for RGUKT RK Valley");
      return NextResponse.json(createFallbackResponse("RGUKT RK Valley"));
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenders from RGUKT RK Valley",
        timestamp: new Date().toISOString(),
        source: "RGUKT RK Valley",
      },
      { status: 500 }
    );
  }
}
