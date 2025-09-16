import { Tender } from "@/lib/types";
import {
  robustAxiosGet,
  DEFAULT_SCRAPER_CONFIG,
  handleScrapingError
} from "@/lib/scraper-utils";
import * as cheerio from "cheerio";

/**
 * Simple SKLM scraper that doesn't use Puppeteer
 * Falls back to basic HTML parsing if the dynamic content fails
 */
export async function scrapeRGUKTSklmSimple(): Promise<Tender[]> {
  try {
    console.log("Attempting simple SKLM scraping without Puppeteer...");

    const response = await robustAxiosGet(
      "https://rguktsklm.ac.in/tenders/",
      {
        ...DEFAULT_SCRAPER_CONFIG,
        timeout: 20000, // Shorter timeout for faster fallback
      }
    );

    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

    // Try multiple selectors to find tender data
    const possibleSelectors = [
      "table tbody tr",
      "#tbltenders tbody tr",
      ".tender-row",
      ".tender-item",
      "tr:has(td)",
    ];

    let foundTenders = false;

    for (const selector of possibleSelectors) {
      const rows = $(selector);
      if (rows.length > 0) {
        console.log(`Found ${rows.length} rows with selector: ${selector}`);

        rows.each((_, element) => {
          const $row = $(element);
          const cells = $row.find("td");

          if (cells.length >= 3) {
            // Extract text from cells
            const name = $(cells[0]).text().trim();
            const postedDate = $(cells[1]).text().trim();
            const closingDate = $(cells[2]).text().trim();

            // Look for download links
            const downloadLinks = $row.find("a").map((_, link) => ({
              text: $(link).text().trim() || "Download",
              url: $(link).attr("href") || "#",
            })).get();

            if (name && name.length > 10) { // Basic validation
              tenders.push({
                name,
                postedDate: postedDate || "Not specified",
                closingDate: closingDate || "Not specified",
                downloadLinks: downloadLinks.length > 0 ? downloadLinks : [{
                  text: "View Details",
                  url: "https://rguktsklm.ac.in/tenders/"
                }]
              });
              foundTenders = true;
            }
          }
        });

        if (foundTenders) break; // Stop if we found tenders
      }
    }

    if (!foundTenders) {
      // Check if we at least got the page content
      const pageText = $('body').text();
      if (pageText.includes("tender") || pageText.includes("Tender")) {
        console.log("Page loaded but no structured tender data found");
        // Return a placeholder tender indicating the site has content but no current tenders
        return [{
          name: "No active tenders found - site is accessible",
          postedDate: new Date().toISOString().split('T')[0],
          closingDate: "Please check the official website for updates",
          downloadLinks: [{
            text: "Visit Official Site",
            url: "https://rguktsklm.ac.in/tenders/"
          }]
        }];
      } else {
        console.log("Page appears to be empty or inaccessible");
        return [];
      }
    }

    console.log(`SKLM Simple: Successfully scraped ${tenders.length} tenders`);
    return tenders;

  } catch (error) {
    handleScrapingError(error, "RGUKT Srikakulam (Simple)");
    return [];
  }
}