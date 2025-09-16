// src/lib/direct-scrapers.ts
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import axios from 'axios';
import { Tender } from './types';
import {
  robustAxiosGet,
  DEFAULT_SCRAPER_CONFIG,
  DEFAULT_SCRAPING_LIMITS,
  handleScrapingError as handleError
} from './scraper-utils';

/**
 * Alternative approach: scrape websites directly instead of using API routes
 * This can be more reliable for server-side cron jobs
 */

// Helper function to fix relative URLs
export function fixRelativeUrl(url: string, baseUrl: string): string {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
}

// Helper function to handle scraping errors
export function handleScrapingError(error: unknown, source: string): void {
  console.error(`Scraping error from ${source}:`, error);
}

// Scrape RGUKT Main tenders
export async function scrapeRGUKTMainTenders(): Promise<Tender[]> {
  try {
    const baseUrl = "https://www.rgukt.in";
    const response = await axios.get(`${baseUrl}/Institute.php?view=Tenders`);
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

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

        tenders.push({
          name: $(cols[0]).text().trim(),
          postedDate: $(cols[1]).text().trim(),
          closingDate: $(cols[2]).text().trim(),
          downloadLinks,
        });
      }
    });

    return tenders;
  } catch (error) {
    handleScrapingError(error, "RGUKT Main");
    return [];
  }
}

// Scrape RK Valley tenders
export async function scrapeRKValleyTenders(): Promise<Tender[]> {
  try {
    const baseUrl = "https://www.rguktrkv.ac.in";
    const response = await axios.get(`${baseUrl}/Institute.php?view=Tenders`);
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

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

        tenders.push({
          name: $(cols[0]).text().trim(),
          postedDate: $(cols[1]).text().trim(),
          closingDate: $(cols[2]).text().trim(),
          downloadLinks,
        });
      }
    });

    return tenders;
  } catch (error) {
    handleScrapingError(error, "RGUKT RK Valley");
    return [];
  }
}

// Scrape Ongole tenders
export async function scrapeOngoleTenders(): Promise<Tender[]> {
  try {
    const baseUrl = "https://www.rguktong.ac.in";
    const response = await axios.get(`${baseUrl}/instituteinfo.php?data=tenders`);
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

    $(".table.table-hover.table-responsive.table-bordered.tenders-table tbody tr").each((_, element) => {
      const descriptionCell = $(element).find("td.tender-info");
      const postedDateCell = $(element).find("td.color-green");
      const closingDateCell = $(element).find("td.color-red");
      const detailsCell = $(element).find("td.tender-detail");

      if (descriptionCell.length && postedDateCell.length && closingDateCell.length && detailsCell.length) {
        const description = descriptionCell
          .clone()
          .find("i")
          .remove()
          .end()
          .text()
          .trim();

        const downloadLinks = detailsCell
          .find("a")
          .map((_, link) => ({
            text: $(link)
              .clone()
              .find("img")
              .remove()
              .end()
              .text()
              .trim(),
            url: fixRelativeUrl($(link).attr("href") || "", baseUrl),
          }))
          .get();

        tenders.push({
          name: description,
          postedDate: postedDateCell.text().trim(),
          closingDate: closingDateCell.text().trim(),
          downloadLinks,
        });
      }
    });

    return tenders;
  } catch (error) {
    handleScrapingError(error, "RGUKT Ongole");
    return [];
  }
}

// Scrape Basar tenders
export async function scrapeBasarTenders(): Promise<Tender[]> {
  try {
    const baseUrl = "https://www.rgukt.ac.in";
    const response = await axios.get(`${baseUrl}/tenders.html`);
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

    $("table.table tbody tr").each((_, element) => {
      const td = $(element).find("td");
      if (td.length > 0) {
        const dateText = $(td).find("font").text().trim();
        const date = dateText.replace(":", "").trim();

        const links = $(td)
          .find("a")
          .map((_, link) => ({
            text: $(link).text().trim(),
            url: fixRelativeUrl($(link).attr("href") || "", baseUrl),
          }))
          .get();

        if (links.length > 0) {
          tenders.push({
            name: links[0].text,
            postedDate: date,
            closingDate: "", // Not provided in the HTML
            downloadLinks: links,
          });
        }
      }
    });

    return tenders;
  } catch (error) {
    handleScrapingError(error, "RGUKT Basar");
    return [];
  }
}




// Import the enhanced scraper at the top of the file (after other imports)
import { enhancedTableScraper } from './enhanced-scraper';

// Scrape RGUKT Nuzvidu tenders
export async function scrapeRGUKTNuzviduTenders(): Promise<Tender[]> {
  try {
    console.log("Starting Nuzvidu tender scraping for 20 tenders...");

    // Try enhanced scraper first
    const enhancedTenders = await enhancedTableScraper(
      "https://rguktn.ac.in",
      "RGUKT Nuzvidu",
      "/tenders/",
      [
        "/tenders",
        "/tender",
        "/tenders.php",
        "/Institute.php?view=Tenders"
      ]
    );

    if (enhancedTenders.length > 0) {
      return enhancedTenders;
    }

    // Fallback to original method if enhanced scraper doesn't work
    console.log("Enhanced scraper didn't work, trying original method...");
    const baseUrl = "https://rguktn.ac.in/tenders";

    const response = await robustAxiosGet(
      `${baseUrl}/`,
      DEFAULT_SCRAPER_CONFIG
    );
    const $ = cheerio.load(response.data);
    const tenders: Tender[] = [];

    // Look for table rows in the tenders page
    $("table tr:gt(0)").each((_, element) => {
      const cols = $(element).find("td");
      if (cols.length >= 4) {
        // Extract tender name from first column
        const name = $(cols[0]).text().trim();

        // Extract posted date from second column
        const postedDate = $(cols[1]).text().trim();

        // Extract closing date from third column
        const closingDate = $(cols[2]).text().trim();


        // Extract download links from the last column
        const downloadLinks = $(cols[cols.length - 1])
          .find("a")
          .map((_, link) => {
            const href = $(link).attr("href") || "";
            let finalUrl = href;

            // Handle relative URLs specifically for RGUKT Nuzvidu
            if (href && !href.startsWith("http")) {
              if (href.startsWith("docs/")) {
                finalUrl = `https://rguktn.ac.in/tenders/${href}`;
              } else {
                finalUrl = fixRelativeUrl(href, baseUrl);
              }
            }

            return {
              text: $(link).text().trim() || "Download",
              url: finalUrl,
            };
          })
          .get();

        // Only add tenders with valid names and download links
        if (name && downloadLinks.length > 0) {
          tenders.push({
            name,
            postedDate,
            closingDate,
            downloadLinks,
            // Add source identifier
            source: "RGUKT Nuzvidu"
          });
        }
      }
    });

    console.log(`Nuzvidu: Successfully scraped ${tenders.length} tenders`);
    return tenders;
  } catch (error) {
    handleError(error, "RGUKT Nuzvidu");
    return [];
  }
}

// Scrape Srikakulam tenders using Puppeteer
export async function scrapeSrikakulamTenders(): Promise<Tender[]> {
  let browser = null;
  const allTenders: Tender[] = [];

  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
      ],
    });

    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Navigate to the tenders page
    console.log('Navigating to Srikakulam tenders page...');
    await page.goto('https://rguktsklm.ac.in/tenders/', {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    // Wait for table to be visible
    await page.waitForSelector('#tbltenders', { timeout: 10000 });

    // Get total pages
    const totalPages = await page.evaluate(() => {
      const paginationLinks = Array.from(document.querySelectorAll('#tbltenders_paginate .paginate_button:not(.previous):not(.next):not(#tbltenders_ellipsis)'));
      if (paginationLinks.length === 0) return 1;
      const lastPageLink = paginationLinks[paginationLinks.length - 1];
      const lastPageText = lastPageLink.textContent?.trim();
      return lastPageText ? parseInt(lastPageText, 10) : 1;
    });

    console.log(`Found ${totalPages} pages of Srikakulam tenders`);

    // Function to extract tenders from page
    const extractTendersFromPage = async () => {
      return await page.evaluate(() => {
        const baseUrl = 'https://rguktsklm.ac.in/tenders';
        const tenderList: Tender[] = [];
        const rows = document.querySelectorAll('#tbltenders tbody tr');

        rows.forEach((row) => {
          const cols = row.querySelectorAll('td');
          if (cols.length >= 4) {
            const descriptionDiv = cols[0].querySelector('div.d-flex.fw-bold');
            const description = descriptionDiv ? descriptionDiv.textContent?.trim() : '';

            const postedDateDiv = cols[1].querySelector('div.text-success');
            const postedDate = postedDateDiv ? postedDateDiv.textContent?.trim() : '';

            const closingDateDiv = cols[2].querySelector('div.text-warning');
            const closingDate = closingDateDiv ? closingDateDiv.textContent?.trim() : '';

            const downloadLinks = Array.from(cols[3].querySelectorAll('a')).map(link => {
              const onclickAttr = link.getAttribute('onclick') || '';
              let url = '';

              const match = onclickAttr.match(/link\([^,]+,\s*'([^']+)'\)/);
              if (match && match[1]) {
                url = match[1];
                if (!url.startsWith('http')) {
                  if (url.startsWith('/')) {
                    url = `${baseUrl}${url}`;
                  } else {
                    url = `${baseUrl}/${url}`;
                  }
                }
              }

              return {
                text: link.textContent?.trim() || 'Download',
                url: url
              };
            }).filter(link => link.url);

            const tender = {
              name: description || '',
              postedDate: postedDate || '',
              closingDate: closingDate || '',
              downloadLinks
            };

            if (tender.name) {
              tenderList.push(tender);
            }
          }
        });

        return tenderList;
      });
    };

    // Process first page
    const firstPageTenders = await extractTendersFromPage();
    allTenders.push(...firstPageTenders);
    console.log(`Extracted ${firstPageTenders.length} tenders from page 1`);

    // Navigate through remaining pages (max 3 pages to avoid timeout issues)
    const pagesToScrape = Math.min(totalPages, 3);

    for (let currentPage = 2; currentPage <= pagesToScrape; currentPage++) {
      try {
        console.log(`Navigating to Srikakulam page ${currentPage}/${pagesToScrape}...`);

        // Click the next page button using direct DOM manipulation
        await page.evaluate((pageNum) => {
          const pageButtons = document.querySelectorAll('#tbltenders_paginate .paginate_button:not(.previous):not(.next):not(#tbltenders_ellipsis)');
          const target = Array.from(pageButtons).find(btn => btn.textContent?.trim() === pageNum.toString());
          if (target) {
            (target.querySelector('a') as HTMLElement).click();
          } else if (document.querySelector('#tbltenders_paginate .next')) {
            (document.querySelector('#tbltenders_paginate .next a') as HTMLElement).click();
          }
        }, currentPage);

        // Wait for the table to update
        await page.waitForFunction(
          () => document.querySelector('#tbltenders_info')?.textContent?.includes(`Showing`),
          { timeout: 5000 }
        );

        // Wait for table rows to appear
        await page.waitForSelector('#tbltenders tbody tr', { timeout: 5000 });

        // Extract tenders from current page
        const pageTenders = await extractTendersFromPage();
        allTenders.push(...pageTenders);

        console.log(`Extracted ${pageTenders.length} tenders from page ${currentPage}`);
      } catch (error) {
        console.error(`Error processing Srikakulam page ${currentPage}:`, error);
        // Continue with next page instead of breaking the entire process
      }
    }

    console.log(`Total Srikakulam tenders extracted: ${allTenders.length}`);

    return allTenders;

  } catch (error) {
    console.error('Srikakulam scraping error:', error);
    handleScrapingError(error, "RGUKT Srikakulam");
    return [];
  } finally {
    if (browser) {
      try {
        await browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
  }
}