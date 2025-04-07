// import { NextResponse } from "next/server";
// import axios from "axios";
// import * as cheerio from "cheerio";
// import { Tender, APIResponse } from "@/lib/types";
// import { fixRelativeUrl, handleScrapingError } from "@/lib/utils";

// async function scrapeBasarTenders(): Promise<Tender[]> {
//   try {
//     const baseUrl = "https://www.rgukt.in";
//     const response = await axios.get(`${baseUrl}/Institute.php?view=Tenders`);
//     const $ = cheerio.load(response.data);
//     const tenders: Tender[] = [];

//     $("table tr:gt(0)").each((_, element) => {
//       const cols = $(element).find("td");
//       if (cols.length === 4) {
//         const downloadLinks = $(cols[3])
//           .find("a")
//           .map((_, link) => ({
//             text: $(link).text().trim(),
//             url: fixRelativeUrl($(link).attr("href") || "", baseUrl),
//           }))
//           .get();

//         tenders.push({
//           name: $(cols[0]).text().trim(),
//           postedDate: $(cols[1]).text().trim(),
//           closingDate: $(cols[2]).text().trim(),
//           downloadLinks,
//         });
//       }
//     });

//     return tenders;
//   } catch (error) {
//     handleScrapingError(error, "RGUKT Basar");
//     return [];
//   }
// }

// export async function GET() {
//   try {
//     const tenders = await scrapeBasarTenders();
//     const response: APIResponse = {
//       success: true,
//       data: tenders,
//       timestamp: new Date().toISOString(),
//       source: "RGUKT Main",
//     };
//     return NextResponse.json(response);
//   } catch (error) {
//     console.error("Error in GET route:", error);
//     return NextResponse.json(

//       {
//         success: false,
//         error: "Failed to fetch tenders from RGUKT Basar ",
//         timestamp: new Date().toISOString(),
//         source: "RGUKT Main",
//       },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { Tender, APIResponse } from "@/lib/types";
import { fixRelativeUrl, handleScrapingError } from "@/lib/utils";

// Correct way to set edge runtime in Next.js 14+
export const runtime = "edge";

async function scrapeBasarTenders(): Promise<Tender[]> {
  try {
    const baseUrl = "https://www.rgukt.in";
    console.log(`Attempting to scrape: ${baseUrl}/Institute.php?view=Tenders`);

    const response = await axios.get(`${baseUrl}/Institute.php?view=Tenders`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10 second timeout
    });

    console.log(`Response status: ${response.status}`);
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

    const tableRows = $("table tr:gt(0)");
    console.log(`Found ${tableRows.length} table rows to process`);

    $("table tr:gt(0)").each((index, element) => {
      const cols = $(element).find("td");
      if (cols.length === 4) {
        const name = $(cols[0]).text().trim();
        const postedDate = $(cols[1]).text().trim();
        const closingDate = $(cols[2]).text().trim();

        const downloadLinks = $(cols[3])
          .find("a")
          .map((_, link) => ({
            text: $(link).text().trim(),
            url: fixRelativeUrl($(link).attr("href") || "", baseUrl),
          }))
          .get();

        tenders.push({
          name,
          postedDate,
          closingDate,
          downloadLinks,
        });

        console.log(`Processed tender: ${name}, posted: ${postedDate}`);
      }
    });

    console.log(`Successfully scraped ${tenders.length} tenders`);
    return tenders;
  } catch (error) {
    console.error("Error details in scraping function:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data ? JSON.stringify(error.response.data).substring(0, 200) : "No data",
        message: error.message
      });
    }
    handleScrapingError(error, "RGUKT Basar");
    return [];
  }
}

export async function GET() {
  try {
    console.log("Starting tender scraping process...");
    const startTime = Date.now();

    const tenders = await scrapeBasarTenders();

    const processingTime = Date.now() - startTime;
    console.log(`Scraping completed in ${processingTime}ms, found ${tenders.length} tenders`);

    const response: APIResponse = {
      success: true,
      data: tenders,
      timestamp: new Date().toISOString(),
      source: "RGUKT Main",
      processingTimeMs: processingTime
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'no-store, max-age=0, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Vercel-CDN-Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    console.error("Critical error in GET route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenders from RGUKT Basar",
        errorDetails: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        source: "RGUKT Main",
      },
      {
        status: 500,
        headers: {
          'Cache-Control': 'no-store, max-age=0, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}