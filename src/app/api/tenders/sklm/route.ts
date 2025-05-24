// app/api/tenders/route.ts
import { NextResponse } from "next/server";
import * as puppeteer from "puppeteer";

// Define types
interface DownloadLink {
  text: string;
  url: string;
}

interface Tender {
  name: string;
  // description: string;
  postedDate: string;
  closingDate: string;
  downloadLinks: DownloadLink[];
}

interface APIResponse {
  success: boolean;
  data?: Tender[];
  error?: string;
  timestamp: string;
  source: string;
  message?: string;
  totalPages?: number;
  currentPage?: number;
  totalTenders?: number;
}

// Helper function to handle scraping errors
function handleScrapingError(error: Error | unknown, source: string): void {
  console.error(`Scraping error from ${source}:`, error);
}

// Helper function to extract tenders from page
async function extractTendersFromPage(page: puppeteer.Page): Promise<Tender[]> {
  return await page.evaluate(() => {
    const baseUrl = "https://rguktsklm.ac.in/tenders";
    const tenderList: Tender[] = [];
    const rows = document.querySelectorAll("#tbltenders tbody tr");

    rows.forEach((row) => {
      const cols = row.querySelectorAll("td");
      if (cols.length >= 4) {
        // Extract description from the first column
        const descriptionDiv = cols[0].querySelector("div.d-flex.fw-bold");
        const description = descriptionDiv
          ? descriptionDiv.textContent?.trim()
          : "";

        // Extract dates
        const postedDateDiv = cols[1].querySelector("div.text-success");
        const postedDate = postedDateDiv
          ? postedDateDiv.textContent?.trim()
          : "";

        const closingDateDiv = cols[2].querySelector("div.text-warning");
        const closingDate = closingDateDiv
          ? closingDateDiv.textContent?.trim()
          : "";

        // Get all download links from the last column
        const downloadLinks = Array.from(cols[3].querySelectorAll("a"))
          .map((link) => {
            // Extract the onclick attribute which contains the file path
            const onclickAttr = link.getAttribute("onclick") || "";
            let url = "";

            // Try to extract the file path from the onclick attribute
            const match = onclickAttr.match(/link\([^,]+,\s*'([^']+)'\)/);
            if (match && match[1]) {
              url = match[1];
              // Fix relative URLs
              if (!url.startsWith("http")) {
                if (url.startsWith("/")) {
                  url = `${baseUrl}${url}`;
                } else {
                  url = `${baseUrl}/${url}`;
                }
              }
            }

            return {
              text: link.textContent?.trim() || "Download",
              url: url,
            };
          })
          .filter((link) => link.url); // Filter out links with empty URLs

        // Create tender object
        const tender = {
          name: description || "",
          // description: description || '',
          postedDate: postedDate || "",
          closingDate: closingDate || "",
          downloadLinks,
        };

        // Only add tenders that have at least a description
        if (tender.name) {
          tenderList.push(tender);
        }
      }
    });

    return tenderList;
  });
}

// Get total number of pages
async function getTotalPages(page: puppeteer.Page): Promise<number> {
  return await page.evaluate(() => {
    // Find all pagination links except 'Previous', 'Next', and ellipsis
    const paginationLinks = Array.from(
      document.querySelectorAll(
        "#tbltenders_paginate .paginate_button:not(.previous):not(.next):not(#tbltenders_ellipsis)"
      )
    );

    // If no pagination links found, return 1 (single page)
    if (paginationLinks.length === 0) return 1;

    // Get the last page number
    const lastPageLink = paginationLinks[paginationLinks.length - 1];
    const lastPageText = lastPageLink.textContent?.trim();
    if (lastPageText) {
      return parseInt(lastPageText, 10);
    }

    return 1; // Default to 1 if we can't determine
  });
}

// Get total number of tenders
async function getTotalTenders(page: puppeteer.Page): Promise<number> {
  return await page.evaluate(() => {
    const info = document.querySelector("#tbltenders_info");
    if (info && info.textContent) {
      // Parse text like "Showing 1 to 10 of 423 entries"
      const match = info.textContent.match(/of\s+(\d+)\s+entries/);
      if (match && match[1]) {
        return parseInt(match[1], 10);
      }
    }
    return 0; // Default if we can't determine
  });
}

async function scrapeSrikakulamTenders(): Promise<{
  tenders: Tender[];
  totalPages: number;
  totalTenders: number;
}> {
  let browser = null;
  const allTenders: Tender[] = [];
  let totalPages = 1;
  let totalTenders = 0;

  try {
    // Launch browser with specific arguments to reduce memory usage and handle common issues
    browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920x1080",
        "--single-process",
        "--no-zygote",
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // Navigate to the tenders page
    console.log("Navigating to tenders page...");
    await page.goto("https://rguktsklm.ac.in/tenders/", {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for table to be visible
    await page.waitForSelector("#tbltenders", { timeout: 10000 });

    // Get total pages and total tenders count
    totalPages = await getTotalPages(page);
    totalTenders = await getTotalTenders(page);

    console.log(
      `Found ${totalPages} pages with approximately ${totalTenders} tenders`
    );

    // Process first page
    const firstPageTenders = await extractTendersFromPage(page);
    allTenders.push(...firstPageTenders);
    console.log(`Extracted ${firstPageTenders.length} tenders from page 1`);

    // Navigate through remaining pages
    for (
      let currentPage = 2;
      currentPage <= Math.min(totalPages, 43);
      currentPage++
    ) {
      try {
        console.log(`Navigating to page ${currentPage}/${totalPages}...`);

        // Click the next page link using a more reliable approach
        await page.evaluate((pageNum) => {
          // This directly simulates clicking on the page number
          const pageButtons = document.querySelectorAll(
            "#tbltenders_paginate .paginate_button:not(.previous):not(.next):not(#tbltenders_ellipsis)"
          );
          const target = Array.from(pageButtons).find(
            (btn) => btn.textContent?.trim() === pageNum.toString()
          );
          if (target) {
            (target.querySelector("a") as HTMLElement).click();
          } else if (document.querySelector("#tbltenders_paginate .next")) {
            // If we can't find the exact page number button, try clicking 'Next'
            (
              document.querySelector(
                "#tbltenders_paginate .next a"
              ) as HTMLElement
            ).click();
          }
        }, currentPage);

        // Wait for the table to update (without using waitForTimeout)
        await page.waitForFunction(
          () =>
            document
              .querySelector("#tbltenders_info")
              ?.textContent?.includes(`Showing`),
          { timeout: 5000 }
        );

        // Give the page a moment to fully update
        await page.waitForSelector("#tbltenders tbody tr", { timeout: 5000 });

        // Extract tenders from current page
        const pageTenders = await extractTendersFromPage(page);
        allTenders.push(...pageTenders);

        console.log(
          `Extracted ${pageTenders.length} tenders from page ${currentPage}`
        );
      } catch (error) {
        console.error(`Error processing page ${currentPage}:`, error);
        // Continue with next page instead of breaking the entire process
      }
    }

    console.log(`Total tenders extracted: ${allTenders.length}`);

    return { tenders: allTenders, totalPages, totalTenders };
  } catch (error) {
    console.error("Scraping error:", error);
    handleScrapingError(error, "RGUKT Srikakulam");
    return { tenders: [], totalPages, totalTenders };
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error("Error closing browser:", error);
      }
    }
  }
}

// For API route pagination if needed
export async function GET() {
  try {
    console.log("Starting tender fetch for RGUKT Srikakulam...");
    const { tenders, totalPages, totalTenders } =
      await scrapeSrikakulamTenders();

    if (tenders.length === 0) {
      console.warn(
        "No tenders found from RGUKT Srikakulam - this might indicate a scraping issue or genuinely no current tenders"
      );
    }

    const response: APIResponse = {
      success: true,
      data: tenders,
      timestamp: new Date().toISOString(),
      source: "RGUKT Srikakulam",
      message: tenders.length === 0 ? "No active tenders found" : undefined,
      totalPages,
      currentPage: 1,
      totalTenders,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenders from RGUKT Srikakulam",
        timestamp: new Date().toISOString(),
        source: "RGUKT Srikakulam",
      },
      { status: 500 }
    );
  }
}





