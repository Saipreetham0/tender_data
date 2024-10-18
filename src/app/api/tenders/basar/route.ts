import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { Tender, APIResponse } from "@/lib/types";
import { fixRelativeUrl, handleScrapingError } from "@/lib/utils";

async function scrapeBasarTenders(): Promise<Tender[]> {
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

export async function GET() {
  try {
    const tenders = await scrapeBasarTenders();
    const response: APIResponse = {
      success: true,
      data: tenders,
      timestamp: new Date().toISOString(),
      source: "RGUKT Basar",
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch tenders from RGUKT Basar",
        timestamp: new Date().toISOString(),
        source: "RGUKT Basar",
      },
      { status: 500 }
    );
  }
}
