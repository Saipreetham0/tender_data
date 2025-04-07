import { NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { Tender, APIResponse } from "@/lib/types";
import { fixRelativeUrl, handleScrapingError } from "@/lib/utils";

async function scrapeBasarTenders(): Promise<Tender[]> {
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
      source: "RGUKT Main",
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET route:", error);
    return NextResponse.json(

      {
        success: false,
        error: "Failed to fetch tenders from RGUKT Basar ",
        timestamp: new Date().toISOString(),
        source: "RGUKT Main",
      },
      { status: 500 }
    );
  }
}
