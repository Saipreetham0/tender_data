// src/infrastructure/security/rate-limiter.middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string; // Custom error message
  skipSuccessfulRequests?: boolean; // Don't count successful requests
  skipFailedRequests?: boolean; // Don't count failed requests
  keyGenerator?: (request: NextRequest) => string; // Custom key generator
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  limit: number;
}

export interface RateLimitStore {
  get(key: string): Promise<{ count: number; resetTime: number } | null>;
  set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void>;
  increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }>;
}

// In-memory store for development (use Redis in production)
class MemoryRateLimitStore implements RateLimitStore {
  private store = new Map<string, { count: number; resetTime: number }>();

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const data = this.store.get(key);
    if (!data) return null;
    
    // Check if expired
    if (Date.now() > data.resetTime) {
      this.store.delete(key);
      return null;
    }
    
    return data;
  }

  async set(key: string, value: { count: number; resetTime: number }, ttl: number): Promise<void> {
    this.store.set(key, value);
    
    // Clean up expired entries
    setTimeout(() => {
      const current = this.store.get(key);
      if (current && Date.now() > current.resetTime) {
        this.store.delete(key);
      }
    }, ttl);
  }

  async increment(key: string, ttl: number): Promise<{ count: number; resetTime: number }> {
    const existing = await this.get(key);
    const now = Date.now();
    
    if (!existing) {
      const newData = { count: 1, resetTime: now + ttl };
      await this.set(key, newData, ttl);
      return newData;
    }
    
    const updated = { count: existing.count + 1, resetTime: existing.resetTime };
    await this.set(key, updated, existing.resetTime - now);
    return updated;
  }

  // Cleanup method for testing
  clear(): void {
    this.store.clear();
  }
}

export class RateLimiter {
  private store: RateLimitStore;
  private defaultConfig: RateLimitConfig;

  constructor(store?: RateLimitStore, defaultConfig?: Partial<RateLimitConfig>) {
    this.store = store || new MemoryRateLimitStore();
    this.defaultConfig = {
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: 'Too many requests, please try again later.',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      keyGenerator: this.defaultKeyGenerator.bind(this),
      ...defaultConfig,
    };
  }

  async checkLimit(
    request: NextRequest,
    config?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    const finalConfig = { ...this.defaultConfig, ...config };
    const key = finalConfig.keyGenerator!(request);
    
    try {
      const result = await this.store.increment(key, finalConfig.windowMs);
      
      return {
        allowed: result.count <= finalConfig.maxRequests,
        remaining: Math.max(0, finalConfig.maxRequests - result.count),
        resetTime: result.resetTime,
        limit: finalConfig.maxRequests,
      };
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request but log the error
      return {
        allowed: true,
        remaining: finalConfig.maxRequests,
        resetTime: Date.now() + finalConfig.windowMs,
        limit: finalConfig.maxRequests,
      };
    }
  }

  async middleware(
    request: NextRequest,
    config?: Partial<RateLimitConfig>
  ): Promise<NextResponse | null> {
    const result = await this.checkLimit(request, config);
    
    if (!result.allowed) {
      const finalConfig = { ...this.defaultConfig, ...config };
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: finalConfig.message,
            details: {
              limit: result.limit,
              remaining: result.remaining,
              resetTime: result.resetTime,
            },
          },
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': result.limit.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
          },
        }
      );
    }

    return null; // Allow the request to continue
  }

  private defaultKeyGenerator(request: NextRequest): string {
    const ip = this.getClientIP(request);
    const pathname = new URL(request.url).pathname;
    return `rate_limit:${ip}:${pathname}`;
  }

  private getClientIP(request: NextRequest): string {
    // Try various headers for IP address
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const xRealIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (xRealIP) return xRealIP;
    if (xForwardedFor) return xForwardedFor.split(',')[0].trim();
    
    return 'unknown';
  }

  // Predefined rate limit configurations
  static readonly configs = {
    // Authentication endpoints - stricter limits
    auth: {
      windowMs: 60000, // 1 minute
      maxRequests: 5, // 5 attempts per minute
      message: 'Too many authentication attempts. Please wait before trying again.',
    },
    
    // API endpoints - moderate limits
    api: {
      windowMs: 60000, // 1 minute
      maxRequests: 100, // 100 requests per minute
      message: 'API rate limit exceeded. Please slow down your requests.',
    },
    
    // Payment endpoints - very strict
    payment: {
      windowMs: 300000, // 5 minutes
      maxRequests: 3, // 3 attempts per 5 minutes
      message: 'Too many payment attempts. Please wait before trying again.',
    },
    
    // Search endpoints - moderate but per-user
    search: {
      windowMs: 60000, // 1 minute
      maxRequests: 30, // 30 searches per minute
      message: 'Search rate limit exceeded. Please wait before searching again.',
      keyGenerator: (request: NextRequest) => {
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';
        const userId = request.headers.get('x-user-id') || ip;
        return `search_limit:${userId}`;
      },
    },
    
    // File upload endpoints
    upload: {
      windowMs: 300000, // 5 minutes
      maxRequests: 10, // 10 uploads per 5 minutes
      message: 'Upload rate limit exceeded. Please wait before uploading again.',
    },
    
    // Password reset - very strict
    passwordReset: {
      windowMs: 900000, // 15 minutes
      maxRequests: 3, // 3 attempts per 15 minutes
      message: 'Too many password reset attempts. Please wait before trying again.',
    },
    
    // Admin endpoints - strict but higher for legitimate admin use
    admin: {
      windowMs: 60000, // 1 minute
      maxRequests: 200, // 200 requests per minute for admin operations
      message: 'Admin API rate limit exceeded.',
      keyGenerator: (request: NextRequest) => {
        const userId = request.headers.get('x-user-id') || 'unknown';
        return `admin_limit:${userId}`;
      },
    },
  };
}

// Export singleton instances for different use cases
export const authRateLimiter = new RateLimiter(undefined, RateLimiter.configs.auth);
export const apiRateLimiter = new RateLimiter(undefined, RateLimiter.configs.api);
export const paymentRateLimiter = new RateLimiter(undefined, RateLimiter.configs.payment);
export const searchRateLimiter = new RateLimiter(undefined, RateLimiter.configs.search);
export const uploadRateLimiter = new RateLimiter(undefined, RateLimiter.configs.upload);
export const passwordResetRateLimiter = new RateLimiter(undefined, RateLimiter.configs.passwordReset);
export const adminRateLimiter = new RateLimiter(undefined, RateLimiter.configs.admin);

// Default rate limiter
export const rateLimiter = new RateLimiter();

// Helper function for applying rate limiting in API routes
export async function withRateLimit(
  request: NextRequest,
  limiter: RateLimiter,
  config?: Partial<RateLimitConfig>
): Promise<NextResponse | null> {
  return limiter.middleware(request, config);
}

// Helper function for checking if request should be rate limited
export function shouldRateLimit(pathname: string): { limiter: RateLimiter; config?: Partial<RateLimitConfig> } | null {
  // Authentication routes
  if (pathname.startsWith('/api/auth/')) {
    return { limiter: authRateLimiter };
  }
  
  // Payment routes
  if (pathname.startsWith('/api/payment/') || pathname.startsWith('/api/subscription/')) {
    return { limiter: paymentRateLimiter };
  }
  
  // Search routes
  if (pathname.includes('/search') || pathname.includes('/tenders')) {
    return { limiter: searchRateLimiter };
  }
  
  // Upload routes
  if (pathname.includes('/upload')) {
    return { limiter: uploadRateLimiter };
  }
  
  // Password reset
  if (pathname.includes('/reset-password') || pathname.includes('/forgot-password')) {
    return { limiter: passwordResetRateLimiter };
  }
  
  // Admin routes
  if (pathname.startsWith('/api/admin/')) {
    return { limiter: adminRateLimiter };
  }
  
  // General API routes
  if (pathname.startsWith('/api/')) {
    return { limiter: apiRateLimiter };
  }
  
  return null;
}