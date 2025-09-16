# Redis Implementation Documentation

## Overview

This document outlines the comprehensive Redis implementation using Upstash Redis for the tender data SaaS project. Redis is used for caching, rate limiting, session management, and analytics storage.

## Setup and Configuration

### 1. Package Installation
```bash
npm install @upstash/redis
```

### 2. Environment Variables
Added to `.env`:
```env
UPSTASH_REDIS_REST_URL=https://amazing-goose-44672.upstash.io
UPSTASH_REDIS_REST_TOKEN=Aa6AAAIncDE2ZjJiYjIxMDBkNDA0Y2JhYTQ1ZDkyMWQ1ZGFlNWY3YXAxNDQ2NzI
```

## Core Implementation Files

### 1. Redis Client Configuration (`src/lib/redis.ts`)

**Features:**
- Upstash Redis client initialization
- Cache TTL constants for different data types
- Cache key generators with consistent naming
- Helper functions for common operations
- Error handling with fallback mechanisms

**Cache TTL Values:**
- Tender Data: 15 minutes
- Scraper Results: 30 minutes
- User Sessions: 24 hours
- Subscription Data: 1 hour
- Rate Limits: 15 minutes
- Analytics: 6 hours

**Key Functions:**
- `getWithFallback()` - Get data with automatic fallback to source
- `set()` - Store data with TTL
- `get()` - Retrieve cached data
- `del()` - Delete cached data
- `incr()` - Increment counters (for rate limiting)

### 2. Rate Limiting (`src/lib/rate-limiter.ts`)

**Rate Limit Configurations:**
- API Endpoints: 100 requests/minute
- Scrapers: 10 requests/minute
- Authentication: 5 attempts/minute
- Subscription: 30 requests/minute

**Features:**
- Redis-based request counting
- Automatic expiration of rate limit windows
- Graceful degradation if Redis is unavailable
- Rate limit headers in responses
- Middleware helper for Next.js routes

**Usage Example:**
```typescript
import { createRateLimitMiddleware } from '@/lib/rate-limiter'

const rateLimitCheck = createRateLimitMiddleware('API')
const result = await rateLimitCheck(request, userIpOrId)

if (result) {
  return result // Rate limit exceeded response
}
// Continue with normal request processing
```

### 3. Session Caching (`src/lib/session-cache.ts`)

**Session Data Structure:**
```typescript
interface CachedSession {
  userId: string
  email: string
  role: 'user' | 'admin'
  subscription?: {
    planId: string
    status: string
    expiresAt: string
  }
  lastActive: string
}
```

**Features:**
- User session storage and retrieval
- Subscription data caching
- Last active timestamp tracking
- Analytics data caching
- Fallback mechanisms for database queries

### 4. Scraper Result Caching (`src/lib/scraper-utils.ts`)

**Enhanced Functions:**
- `cacheScrapingResult()` - Store scraping results with date-based keys
- `getCachedScrapingResult()` - Retrieve cached results
- `cachedScraper()` - Wrapper function with automatic caching

**Benefits:**
- Reduces load on target websites
- Faster response times
- Resilience against scraping failures
- Date-based cache keys for daily data refresh

## Implementation in Tender Routes

### Updated Routes:
- **Basar Route** (`src/app/api/tenders/basar/route.ts`) - ✅ Implemented
- **RGUKT Route** (`src/app/api/tenders/rgukt/route.ts`) - ⏸️ Temporarily held per user request

### Cache Integration:
```typescript
export async function GET() {
  try {
    const cacheKey = CACHE_KEYS.tenderData('basar');

    const tenders = await cacheHelpers.getWithFallback(
      cacheKey,
      scrapeBasarTenders,
      CACHE_TTL.TENDER_DATA
    );

    const response: APIResponse = {
      success: true,
      data: tenders,
      timestamp: new Date().toISOString(),
      source: "RGUKT Basar",
    };
    return NextResponse.json(response);
  } catch (error) {
    // Error handling...
  }
}
```

## Benefits and Performance Impact

### 1. Performance Improvements
- **Response Time**: 15-minute cache reduces scraping overhead
- **Rate Limiting**: Prevents API abuse and ensures fair usage
- **Session Management**: Faster user authentication checks
- **Analytics**: Quick access to computed metrics

### 2. Reliability Enhancements
- **Fallback Mechanisms**: Graceful degradation when Redis is unavailable
- **Error Handling**: Comprehensive error logging and recovery
- **Cache Invalidation**: Automatic TTL-based cache refresh

### 3. Cost Optimization
- **Reduced Scraping**: Less load on target websites
- **Efficient Queries**: Cached subscription and user data
- **Bandwidth Savings**: Cached responses reduce server load

## Usage Patterns

### 1. Tender Data Caching
```typescript
// Automatic caching in API routes
const tenders = await cacheHelpers.getWithFallback(
  CACHE_KEYS.tenderData('source'),
  scraperFunction,
  CACHE_TTL.TENDER_DATA
);
```

### 2. Rate Limiting in API Routes
```typescript
// Apply rate limiting to protect endpoints
const rateLimitResult = await checkRateLimit(
  userIdentifier,
  endpoint,
  getRateLimitConfig('API')
);

if (!rateLimitResult.success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
}
```

### 3. Session Management
```typescript
// Cache user session data
await sessionCache.setSession(userId, sessionData);

// Retrieve with automatic DB fallback
const subscription = await sessionCache.getSubscriptionWithFallback(
  userId,
  () => fetchSubscriptionFromDatabase(userId)
);
```

### 4. Analytics Caching
```typescript
// Cache expensive analytics calculations
const analytics = await analyticsCache.getAnalyticsWithFallback(
  'user-growth',
  'monthly',
  () => calculateUserGrowthAnalytics()
);
```

## Monitoring and Maintenance

### 1. Cache Hit Rates
Monitor Redis operations through logs and implement metrics collection for:
- Cache hit/miss ratios
- Rate limit effectiveness
- Session cache utilization

### 2. Error Handling
All Redis operations include try-catch blocks that:
- Log errors for debugging
- Provide fallback to original data sources
- Maintain application functionality even if Redis is down

### 3. Cost Monitoring
With Upstash's serverless pricing model:
- Monitor request counts
- Track storage usage
- Optimize TTL values based on usage patterns

## Security Considerations

### 1. Environment Variables
- Redis credentials stored securely in environment variables
- No hardcoded tokens or URLs

### 2. Data Sanitization
- All cached data is validated before storage
- Sensitive information is not cached (passwords, payment details)

### 3. Rate Limiting Protection
- Prevents abuse of API endpoints
- Protects against scraping bot attacks
- Ensures fair usage across users

## Future Enhancements

### 1. Real-time Features
- Implement pub/sub for real-time tender notifications
- Live dashboard updates
- WebSocket session management

### 2. Advanced Analytics
- Cache complex analytics queries
- User behavior tracking
- Performance metrics storage

### 3. Enhanced Caching Strategies
- Smart cache warming
- Predictive caching based on user patterns
- Multi-level cache hierarchies

## Troubleshooting

### Common Issues:
1. **Redis Connection Errors**: Check environment variables and network connectivity
2. **Cache Misses**: Verify TTL settings and cache key generation
3. **Rate Limit Issues**: Adjust rate limit configurations based on usage patterns

### Debug Commands:
```bash
# Test Redis connection
NODE_ENV=development node -e "
const { redis } = require('./src/lib/redis');
redis.ping().then(console.log).catch(console.error);
"

# Check cache content
NODE_ENV=development node -e "
const { cacheHelpers, CACHE_KEYS } = require('./src/lib/redis');
cacheHelpers.get(CACHE_KEYS.tenderData('basar')).then(console.log);
"
```

This implementation provides a robust, scalable caching layer that significantly improves application performance while maintaining reliability and security.