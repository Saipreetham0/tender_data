import axios from "axios";
import { AxiosRequestConfig } from "axios";
import { cacheHelpers, CACHE_KEYS, CACHE_TTL } from "./redis";

export interface ScraperConfig {
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  userAgent: string;
}

export const DEFAULT_SCRAPER_CONFIG: ScraperConfig = {
  timeout: 15000,
  retryAttempts: 3,
  retryDelay: 2000,
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
};

export interface ScrapingLimits {
  maxTenders: number;
  maxPages: number;
  maxRetries: number;
}

export const DEFAULT_SCRAPING_LIMITS: ScrapingLimits = {
  maxTenders: 50,
  maxPages: 3,
  maxRetries: 2
};

// API response limits
export const API_RESPONSE_LIMITS = {
  MAX_TENDERS_PER_RESPONSE: 50,
  MAX_CACHE_SIZE: 100 // For caching more but serving limited
} as const;

// Pagination interface
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
  totalAvailable: number;
  returned: number;
}

// Helper function to parse pagination parameters
export function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(
    Math.max(1, parseInt(searchParams.get('limit') || '50', 10)),
    500 // Maximum limit to prevent abuse
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Helper function to create paginated response
export function createPaginatedResponse<T>(
  allData: T[],
  pagination: PaginationParams
): PaginatedResponse<T> {
  const { page, limit, offset } = pagination;
  const total = allData.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedData = allData.slice(offset, offset + limit);

  return {
    data: paginatedData,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    totalAvailable: total,
    returned: paginatedData.length
  };
}

export async function robustAxiosGet(
  url: string,
  config: ScraperConfig = DEFAULT_SCRAPER_CONFIG
): Promise<any> {
  const axiosConfig: AxiosRequestConfig = {
    timeout: config.timeout,
    headers: {
      'User-Agent': config.userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    },
  };

  for (let attempt = 1; attempt <= config.retryAttempts; attempt++) {
    try {
      console.log(`Attempting to fetch ${url} (attempt ${attempt}/${config.retryAttempts})`);
      const response = await axios.get(url, axiosConfig);
      return response;
    } catch (error: any) {
      const isLastAttempt = attempt === config.retryAttempts;

      console.error(`Attempt ${attempt} failed for ${url}:`, {
        code: error.code,
        message: error.message,
        status: error.response?.status
      });

      if (isLastAttempt) {
        throw error;
      }

      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, config.retryDelay * attempt));
    }
  }
}

export function handleScrapingError(error: any, source: string): void {
  const errorInfo = {
    source,
    code: error.code,
    message: error.message,
    status: error.response?.status,
    timestamp: new Date().toISOString()
  };

  console.error(`Scraping error from ${source}:`, errorInfo);
}

export function fixRelativeUrl(url: string, baseUrl: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `${baseUrl}${url}`;
  return `${baseUrl}/${url}`;
}

export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  errorMessage: string = "Operation timed out"
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error(errorMessage)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

// Cache scraping results with timestamp-based keys
export async function cacheScrapingResult<T>(
  source: string,
  data: T,
  ttl: number = CACHE_TTL.SCRAPER_RESULTS
): Promise<void> {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = CACHE_KEYS.scraperResult(source, timestamp);
  await cacheHelpers.set(key, data, ttl);
}

// Get cached scraping result
export async function getCachedScrapingResult<T>(
  source: string,
  maxAge: number = CACHE_TTL.SCRAPER_RESULTS
): Promise<T | null> {
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const key = CACHE_KEYS.scraperResult(source, timestamp);
  return await cacheHelpers.get<T>(key);
}

// Enhanced scraper with caching
export async function cachedScraper<T>(
  source: string,
  scraperFn: () => Promise<T>,
  options: {
    ttl?: number;
    useCache?: boolean;
  } = {}
): Promise<T> {
  const { ttl = CACHE_TTL.SCRAPER_RESULTS, useCache = true } = options;

  if (!useCache) {
    return await scraperFn();
  }

  const cacheKey = CACHE_KEYS.scraperResult(source, new Date().toISOString().split('T')[0]);

  return await cacheHelpers.getWithFallback(
    cacheKey,
    scraperFn,
    ttl
  );
}