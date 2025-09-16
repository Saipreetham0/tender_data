// src/lib/api-client.ts - Enterprise API client with batching and interceptors
interface BatchedRequest {
  url: string;
  options?: RequestInit;
  resolve: (value: Response) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

interface RequestCache {
  [key: string]: {
    data: any;
    status: number;
    statusText: string;
    headers: Record<string, string>;
    timestamp: number;
  };
}

class ApiClient {
  private static instance: ApiClient;
  private batchQueue: BatchedRequest[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private requestCache: RequestCache = {};
  private readonly BATCH_DELAY = 10; // 10ms batch window
  private readonly CACHE_TTL = 5000; // 5 second cache for identical requests

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  private constructor() {
    // Cleanup old cache entries every minute
    setInterval(() => {
      const now = Date.now();
      Object.keys(this.requestCache).forEach(key => {
        if (now - this.requestCache[key].timestamp > this.CACHE_TTL) {
          delete this.requestCache[key];
        }
      });
    }, 60000);
  }

  private getCacheKey(url: string, options?: RequestInit): string {
    const method = options?.method || 'GET';
    const body = options?.body || '';
    return `${method}:${url}:${body}`;
  }

  private async processBatch(): Promise<void> {
    if (this.batchQueue.length === 0) return;

    const batch = [...this.batchQueue];
    this.batchQueue = [];

    // Group by domain to respect browser connection limits
    const groupedByDomain = batch.reduce((groups, request) => {
      const url = new URL(request.url, window.location.origin);
      const domain = url.hostname;

      if (!groups[domain]) {
        groups[domain] = [];
      }
      groups[domain].push(request);
      return groups;
    }, {} as Record<string, BatchedRequest[]>);

    // Process each domain group with concurrency limit
    await Promise.all(
      Object.values(groupedByDomain).map(domainRequests =>
        this.processDomainBatch(domainRequests)
      )
    );
  }

  private async processDomainBatch(requests: BatchedRequest[]): Promise<void> {
    // Limit concurrent requests per domain (browser limit is ~6)
    const CONCURRENCY_LIMIT = 4;
    const chunks = [];

    for (let i = 0; i < requests.length; i += CONCURRENCY_LIMIT) {
      chunks.push(requests.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (request) => {
          try {
            const response = await fetch(request.url, request.options);
            request.resolve(response);
          } catch (error) {
            request.reject(error as Error);
          }
        })
      );
    }
  }

  async fetch(url: string, options?: RequestInit): Promise<Response> {
    const cacheKey = this.getCacheKey(url, options);
    const now = Date.now();

    // Check cache for identical requests
    if (this.requestCache[cacheKey] &&
        now - this.requestCache[cacheKey].timestamp < this.CACHE_TTL) {
      const cached = this.requestCache[cacheKey];
      // Create a new Response from cached data
      return new Response(JSON.stringify(cached.data), {
        status: cached.status,
        statusText: cached.statusText,
        headers: new Headers(cached.headers)
      });
    }

    // Create promise for this request
    const requestPromise = new Promise<Response>(async (resolve, reject) => {
      try {
        let response: Response;

        // For subscription APIs, use batching
        if (url.includes('/api/subscription/')) {
          response = await new Promise<Response>((batchResolve, batchReject) => {
            this.batchQueue.push({
              url,
              options,
              resolve: batchResolve,
              reject: batchReject,
              timestamp: now,
            });

            // Schedule batch processing
            if (this.batchTimer) {
              clearTimeout(this.batchTimer);
            }

            this.batchTimer = setTimeout(() => {
              this.processBatch();
              this.batchTimer = null;
            }, this.BATCH_DELAY);
          });
        } else {
          // Non-subscription APIs go through immediately
          response = await fetch(url, options);
        }

        // Cache the response data
        const responseClone = response.clone();
        const data = await responseClone.json().catch(() => null);

        this.requestCache[cacheKey] = {
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          timestamp: now,
        };

        resolve(response);
      } catch (error) {
        reject(error);
      }
    });

    return requestPromise;
  }

  // Enhanced fetch with retry logic
  async fetchWithRetry(
    url: string,
    options?: RequestInit,
    maxRetries = 3,
    retryDelay = 1000
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.fetch(url, options);

        if (!response.ok && response.status >= 500 && attempt < maxRetries) {
          throw new Error(`Server error: ${response.status}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay * Math.pow(2, attempt))
          );
        }
      }
    }

    throw lastError;
  }

  // Clear cache
  clearCache(): void {
    this.requestCache = {};
  }

  // Get cache statistics
  getCacheStats() {
    return {
      cacheSize: Object.keys(this.requestCache).length,
      queueSize: this.batchQueue.length,
      oldestCacheEntry: Math.min(
        ...Object.values(this.requestCache).map(entry => entry.timestamp)
      ),
    };
  }
}

// Export singleton
export const apiClient = ApiClient.getInstance();

// Drop-in replacement for fetch
export const batchedFetch = (url: string, options?: RequestInit) =>
  apiClient.fetch(url, options);

// Simple retry fetch without caching to avoid stream issues
export const retryFetch = async (
  url: string,
  options?: RequestInit,
  maxRetries = 3
): Promise<Response> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && response.status >= 500 && attempt < maxRetries) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        await new Promise(resolve =>
          setTimeout(resolve, 1000 * Math.pow(2, attempt))
        );
      }
    }
  }

  throw lastError;
};