import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { Tender, APIResponse } from "@/lib/types";
import {
  robustAxiosGet,
  fixRelativeUrl,
  handleScrapingError,
  DEFAULT_SCRAPER_CONFIG,
  API_RESPONSE_LIMITS,
  parsePaginationParams,
  createPaginatedResponse
} from "@/lib/scraper-utils";
import { createFallbackResponse, shouldUseFallback } from "@/lib/scraper-fallback";
import { enhancedTableScraper } from "@/lib/enhanced-scraper";
import { cacheHelpers, CACHE_KEYS, CACHE_TTL } from "@/lib/redis";

async function scrapeOngoleTenders(): Promise<Tender[]> {
  try {
    console.log("Starting Ongole tender scraping for 20 tenders...");

    // Try enhanced scraper first
    const enhancedTenders = await enhancedTableScraper(
      "https://www.rguktong.ac.in",
      "RGUKT Ongole",
      "/instituteinfo.php?data=tenders",
      [
        "/tenders.php",
        "/tenders",
        "/instituteinfo.php?data=tender",
        "/instituteinfo.php?view=tenders"
      ]
    );

    if (enhancedTenders.length > 0) {
      return enhancedTenders;
    }

    // Fallback to original method if enhanced scraper doesn't work
    console.log("Enhanced scraper didn't work, trying original method...");
    const baseUrl = "https://www.rguktong.ac.in";

    const response = await robustAxiosGet(
      `${baseUrl}/instituteinfo.php?data=tenders`,
      DEFAULT_SCRAPER_CONFIG
    );
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

    // Using the exact table classes from the HTML
    $(".table.table-hover.table-responsive.table-bordered.tenders-table tbody tr").each((_, element) => {
      // Find cells with their specific classes
      const descriptionCell = $(element).find("td.tender-info");
      const postedDateCell = $(element).find("td.color-green");
      const closingDateCell = $(element).find("td.color-red");
      const detailsCell = $(element).find("td.tender-detail");

      // Only process if we have all required cells
      if (descriptionCell.length && postedDateCell.length && closingDateCell.length && detailsCell.length) {
        // Extract description text (removing the arrow icon)
        const description = descriptionCell
          .clone()    // Clone to avoid modifying original
          .find("i")  // Find the icon
          .remove()   // Remove it
          .end()      // Go back to original element
          .text()     // Get the text
          .trim();    // Clean up whitespace

        // Extract download links
        const downloadLinks = detailsCell
          .find("a")
          .map((_, link) => ({
            text: $(link)
              .clone()
              .find("img")  // Remove the 'new' image if present
              .remove()
              .end()
              .text()
              .trim(),
            url: fixRelativeUrl($(link).attr("href") || "", baseUrl),
          }))
          .get();

        const tender = {
          name: description,
          postedDate: postedDateCell.text().trim(),
          closingDate: closingDateCell.text().trim(),
          downloadLinks,
        };

        if (tender.name) {
          tenders.push(tender);
        }
      }
    });

    console.log(`Ongole: Successfully scraped ${tenders.length} tenders`);
    return tenders;
  } catch (error) {
    handleScrapingError(error, "RGUKT Ongole");
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pagination = parsePaginationParams(searchParams);
    const cacheKey = CACHE_KEYS.tenderData('ongole');

    const allTenders = await cacheHelpers.getWithFallback(
      cacheKey,
      scrapeOngoleTenders,
      CACHE_TTL.TENDER_DATA
    );

    // Create paginated response
    const paginatedResult = createPaginatedResponse(allTenders, pagination);

    const response = {
      success: true,
      ...paginatedResult,
      timestamp: new Date().toISOString(),
      source: "RGUKT Ongole"
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);

    // Use fallback for network/timeout errors
    if (shouldUseFallback(error)) {
      console.log("Using fallback data for RGUKT Ongole");
      return NextResponse.json(createFallbackResponse("RGUKT Ongole"));
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenders from RGUKT Ongole",
        timestamp: new Date().toISOString(),
        source: "RGUKT Ongole",
      },
      { status: 500 }
    );
  }
}