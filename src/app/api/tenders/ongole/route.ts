import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { Tender, APIResponse } from "@/lib/types";
import { fixRelativeUrl, handleScrapingError } from "@/lib/utils";

async function scrapeOngoleTenders(): Promise<Tender[]> {
  try {
    const baseUrl = "https://www.rguktong.ac.in";
    const response = await axios.get(`${baseUrl}/instituteinfo.php?data=tenders`);
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

export async function GET() {
  try {
    const tenders = await scrapeOngoleTenders();
    const response: APIResponse = {
      success: true,
      data: tenders,
      timestamp: new Date().toISOString(),
      source: "RGUKT Ongole",
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);
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