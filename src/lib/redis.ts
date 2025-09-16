import { Redis } from '@upstash/redis'

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('Missing Redis configuration. Please set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN environment variables.')
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
})

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  TENDER_DATA: 60 * 15, // 15 minutes
  SCRAPER_RESULTS: 60 * 30, // 30 minutes
  USER_SESSION: 60 * 60 * 24, // 24 hours
  SUBSCRIPTION_DATA: 60 * 60, // 1 hour
  RATE_LIMIT: 60 * 15, // 15 minutes
  ANALYTICS: 60 * 60 * 6, // 6 hours
} as const

// Cache key generators
export const CACHE_KEYS = {
  tenderData: (source: string, page?: number) => `tender:${source}${page ? `:page:${page}` : ''}`,
  scraperResult: (source: string, timestamp: string) => `scraper:${source}:${timestamp}`,
  userSession: (userId: string) => `session:${userId}`,
  subscriptionData: (userId: string) => `subscription:${userId}`,
  rateLimit: (identifier: string, endpoint: string) => `ratelimit:${endpoint}:${identifier}`,
  analytics: (type: string, period: string) => `analytics:${type}:${period}`,
} as const

// Helper functions for common cache operations
export const cacheHelpers = {
  // Get data with fallback
  async getWithFallback<T>(
    key: string,
    fallbackFn: () => Promise<T>,
    ttl: number = CACHE_TTL.TENDER_DATA
  ): Promise<T> {
    try {
      const cached = await redis.get<T>(key)
      if (cached !== null) {
        return cached
      }

      const fresh = await fallbackFn()
      await redis.setex(key, ttl, fresh)
      return fresh
    } catch (error) {
      console.error('Cache operation failed:', error)
      return await fallbackFn()
    }
  },

  // Set data with TTL
  async set<T>(key: string, data: T, ttl: number): Promise<void> {
    try {
      await redis.setex(key, ttl, data)
    } catch (error) {
      console.error('Failed to set cache:', error)
    }
  },

  // Get data
  async get<T>(key: string): Promise<T | null> {
    try {
      return await redis.get<T>(key)
    } catch (error) {
      console.error('Failed to get cache:', error)
      return null
    }
  },

  // Delete data
  async del(key: string): Promise<void> {
    try {
      await redis.del(key)
    } catch (error) {
      console.error('Failed to delete cache:', error)
    }
  },

  // Increment counter (useful for rate limiting)
  async incr(key: string, ttl?: number): Promise<number> {
    try {
      const count = await redis.incr(key)
      if (ttl && count === 1) {
        await redis.expire(key, ttl)
      }
      return count
    } catch (error) {
      console.error('Failed to increment counter:', error)
      return 0
    }
  }
}

export default redis