import { Tender, APIResponse } from "@/lib/types";

// Fallback data when scrapers fail
export const FALLBACK_TENDER_DATA: Record<string, Tender[]> = {
  "RGUKT Basar": [
    {
      name: "Service temporarily unavailable",
      postedDate: new Date().toISOString().split('T')[0],
      closingDate: "Please check the official website",
      downloadLinks: [{
        text: "Visit Official Site",
        url: "https://www.rgukt.ac.in/tenders.html"
      }]
    }
  ],
  "RGUKT Main": [
    {
      name: "Service temporarily unavailable",
      postedDate: new Date().toISOString().split('T')[0],
      closingDate: "Please check the official website",
      downloadLinks: [{
        text: "Visit Official Site",
        url: "https://www.rgukt.in/Institute.php?view=Tenders"
      }]
    }
  ],
  "RGUKT RK Valley": [
    {
      name: "Service temporarily unavailable",
      postedDate: new Date().toISOString().split('T')[0],
      closingDate: "Please check the official website",
      downloadLinks: [{
        text: "Visit Official Site",
        url: "https://www.rguktrkv.ac.in/Institute.php?view=Tenders"
      }]
    }
  ],
  "RGUKT Ongole": [
    {
      name: "Service temporarily unavailable",
      postedDate: new Date().toISOString().split('T')[0],
      closingDate: "Please check the official website",
      downloadLinks: [{
        text: "Visit Official Site",
        url: "https://www.rguktong.ac.in/instituteinfo.php?data=tenders"
      }]
    }
  ],
  "RGUKT Srikakulam": [
    {
      name: "Service temporarily unavailable",
      postedDate: new Date().toISOString().split('T')[0],
      closingDate: "Please check the official website",
      downloadLinks: [{
        text: "Visit Official Site",
        url: "https://rguktsklm.ac.in/tenders/"
      }]
    }
  ],
  "RGUKT Nuzvidu": [
    {
      name: "Service temporarily unavailable",
      postedDate: new Date().toISOString().split('T')[0],
      closingDate: "Please check the official website",
      downloadLinks: [{
        text: "Visit Official Site",
        url: "https://rguktn.ac.in/tenders/"
      }]
    }
  ]
};

export function createFallbackResponse(source: string): APIResponse {
  return {
    success: true,
    data: FALLBACK_TENDER_DATA[source] || [],
    timestamp: new Date().toISOString(),
    source,
    message: "Using fallback data due to scraping issues. Please visit the official website for the most current information."
  };
}

export function shouldUseFallback(error: any): boolean {
  // Use fallback for network errors, timeouts, and connection issues
  const errorCodes = ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNREFUSED'];
  const errorMessages = ['TimeoutError', 'Navigation timeout', 'socket hang up'];

  const hasErrorCode = errorCodes.some(code =>
    error?.code === code || error?.message?.includes(code)
  );

  const hasErrorMessage = errorMessages.some(message =>
    error?.message?.includes(message)
  );

  return hasErrorCode || hasErrorMessage;
}