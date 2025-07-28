// src/middleware.ts - Production-ready middleware with security and rate limiting
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { RateLimiter, getClientIP } from "./lib/auth-jwt";

// Rate limiting configuration
const RATE_LIMITS = {
  '/api/auth/': { windowMs: 60000, maxRequests: 5 }, // 5 requests per minute for auth
  '/api/payment/': { windowMs: 60000, maxRequests: 10 }, // 10 requests per minute for payments
  '/api/admin/': { windowMs: 60000, maxRequests: 20 }, // 20 requests per minute for admin
  '/api/tenders/': { windowMs: 60000, maxRequests: 30 }, // 30 requests per minute for tenders
  '/api/': { windowMs: 60000, maxRequests: 100 }, // 100 requests per minute for other APIs
};

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': getAllowedOrigin(request),
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const clientIP = getClientIP(request);
    
    // Find applicable rate limit
    const rateLimitKey = Object.keys(RATE_LIMITS).find(key => pathname.startsWith(key));
    const rateLimit = rateLimitKey ? RATE_LIMITS[rateLimitKey as keyof typeof RATE_LIMITS] : RATE_LIMITS['/api/'];
    
    try {
      const result = await RateLimiter.checkLimit(
        `${clientIP}:${rateLimitKey || 'api'}`,
        rateLimit.windowMs,
        rateLimit.maxRequests
      );
      
      if (!result.allowed) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
          },
          { 
            status: 429,
            headers: {
              'X-RateLimit-Limit': rateLimit.maxRequests.toString(),
              'X-RateLimit-Remaining': result.remaining.toString(),
              'X-RateLimit-Reset': result.resetTime.toString(),
              'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            }
          }
        );
      }
      
      // Add rate limit headers to response
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', rateLimit.maxRequests.toString());
      response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
      response.headers.set('X-RateLimit-Reset', result.resetTime.toString());
      
      // Add security headers
      addSecurityHeaders(response, request);
      
      return response;
    } catch (error) {
      console.error('Rate limiting error:', error);
      // Continue without rate limiting on error
    }
  }

  // Add security headers to all responses
  const response = NextResponse.next();
  addSecurityHeaders(response, request);
  
  return response;
}

function getAllowedOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin');
  const allowedOrigins = [
    process.env.NEXT_PUBLIC_API_BASE_URL,
    'https://tender-data.vercel.app',
    'https://localhost:3000',
  ].filter(Boolean);
  
  if (origin && allowedOrigins.includes(origin)) {
    return origin;
  }
  
  return allowedOrigins[0] || '*';
}

function addSecurityHeaders(response: NextResponse, request: NextRequest) {
  // Security headers
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://*.razorpay.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.supabase.co https://*.razorpay.com https://accounts.google.com",
    "frame-src https://*.razorpay.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests"
  ].join('; ');
  
  response.headers.set("Content-Security-Policy", csp);
  
  // HSTS for HTTPS
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
  
  // CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", getAllowedOrigin(request));
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, X-Requested-With"
    );
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
  
  // Add request ID for tracing
  response.headers.set("X-Request-ID", generateRequestId());
}

function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
    '/api/(.*)',
  ],
};
