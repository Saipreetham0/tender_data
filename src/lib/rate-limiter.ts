import { cacheHelpers, CACHE_KEYS, CACHE_TTL } from './redis'

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

export interface RateLimitResult {
  success: boolean
  remainingRequests: number
  resetTime: number
  totalRequests: number
}

const RATE_LIMITS = {
  API: { maxRequests: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  SCRAPER: { maxRequests: 10, windowMs: 60 * 1000 }, // 10 requests per minute for scrapers
  AUTH: { maxRequests: 5, windowMs: 60 * 1000 }, // 5 login attempts per minute
  SUBSCRIPTION: { maxRequests: 30, windowMs: 60 * 1000 }, // 30 requests per minute
} as const

export async function checkRateLimit(
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const rateLimitConfig = config || RATE_LIMITS.API
  const key = CACHE_KEYS.rateLimit(identifier, endpoint)

  try {
    const currentCount = await cacheHelpers.incr(
      key,
      Math.ceil(rateLimitConfig.windowMs / 1000)
    )

    const resetTime = Date.now() + rateLimitConfig.windowMs
    const remainingRequests = Math.max(0, rateLimitConfig.maxRequests - currentCount)

    return {
      success: currentCount <= rateLimitConfig.maxRequests,
      remainingRequests,
      resetTime,
      totalRequests: currentCount
    }
  } catch (error) {
    console.error('Rate limit check failed:', error)
    // Fail open - allow request if Redis is down
    return {
      success: true,
      remainingRequests: rateLimitConfig.maxRequests,
      resetTime: Date.now() + rateLimitConfig.windowMs,
      totalRequests: 0
    }
  }
}

export function getRateLimitConfig(type: keyof typeof RATE_LIMITS): RateLimitConfig {
  return RATE_LIMITS[type]
}

// Middleware helper for Next.js API routes
export function createRateLimitMiddleware(
  limitType: keyof typeof RATE_LIMITS = 'API'
) {
  return async (req: Request, identifier: string) => {
    const url = new URL(req.url)
    const endpoint = url.pathname

    const result = await checkRateLimit(
      identifier,
      endpoint,
      getRateLimitConfig(limitType)
    )

    if (!result.success) {
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
          remainingRequests: result.remainingRequests
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': getRateLimitConfig(limitType).maxRequests.toString(),
            'X-RateLimit-Remaining': result.remainingRequests.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    return null // No rate limit hit, continue
  }
}