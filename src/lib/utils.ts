// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";


// Styling utilities
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Scraping utilities
export const fixRelativeUrl = (url: string, baseUrl: string): string => {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return url;
  }
};

export const handleScrapingError = (error: unknown, source: string) => {
  console.error(`Error scraping ${source}:`, error);
  throw error;
};

// HTTP utilities
export const fetcher = async (url: string) => {
  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    handleScrapingError(error, `Fetching ${url}`);
  }
};

// Parsing utilities
export const extractText = (element: cheerio.Cheerio, selector: string): string => {
  return element.find(selector).text().trim();
};

export const extractHref = (element: cheerio.Cheerio, selector: string): string => {
  return element.find(selector).attr('href') || '';
};

// Date utilities
export const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toISOString().split('T')[0];
  } catch {
    return dateString;
  }
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
};


