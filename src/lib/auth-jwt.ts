// src/lib/auth-jwt.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('JWT_SECRET environment variable is not set. Using a default secret for development.');
  } else {
    throw new Error('JWT_SECRET environment variable is required');
  }
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface AuthUser {
  id: string;
  email: string;
  role: 'user' | 'admin';
  subscription?: {
    status: 'active' | 'cancelled' | 'expired';
    plan: string;
    expiresAt: string;
  };
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: 'user' | 'admin';
  iat?: number;
  exp?: number;
}

export class AuthError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthService {
  private static readonly TOKEN_EXPIRY = '2d';
  private static readonly REFRESH_TOKEN_EXPIRY = '7d';

  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
  }

  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  static generateToken(payload: TokenPayload): string {
    const secret = jwtSecret || 'development-secret-key-please-change-in-production';
    return jwt.sign(payload, secret, { 
      expiresIn: this.TOKEN_EXPIRY,
      issuer: 'tender-data-app',
      audience: 'tender-data-users'
    });
  }

  static generateRefreshToken(payload: TokenPayload): string {
    const secret = jwtSecret || 'development-secret-key-please-change-in-production';
    return jwt.sign(payload, secret, { 
      expiresIn: this.REFRESH_TOKEN_EXPIRY,
      issuer: 'tender-data-app',
      audience: 'tender-data-users'
    });
  }

  static verifyToken(token: string): TokenPayload {
    try {
      const secret = jwtSecret || 'development-secret-key-please-change-in-production';
      return jwt.verify(token, secret, {
        issuer: 'tender-data-app',
        audience: 'tender-data-users'
      }) as TokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new AuthError('Token expired', 'TOKEN_EXPIRED');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new AuthError('Invalid token', 'INVALID_TOKEN');
      }
      throw new AuthError('Token verification failed', 'VERIFICATION_FAILED');
    }
  }

  static async getUserFromToken(token: string): Promise<AuthUser | null> {
    try {
      const payload = this.verifyToken(token);
      
      // Fetch user details from database
      const { data: user, error } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, role, subscription_status, subscription_plan, subscription_expires_at')
        .eq('id', payload.userId)
        .single();

      if (error || !user) {
        return null;
      }

      // Check if user has active subscription
      const subscription = user.subscription_status && user.subscription_plan ? {
        status: user.subscription_status,
        plan: user.subscription_plan,
        expiresAt: user.subscription_expires_at
      } : undefined;

      return {
        id: user.id,
        email: user.email,
        role: user.role || 'user',
        subscription
      };
    } catch (error) {
      console.error('Error getting user from token:', error);
      return null;
    }
  }

  static async authenticateAdmin(apiKey: string): Promise<boolean> {
    const validApiKey = process.env.CRON_API_SECRET_KEY;
    if (!validApiKey) {
      throw new AuthError('API key not configured', 'CONFIG_ERROR');
    }
    
    return apiKey === validApiKey;
  }

  static async requireAuth(request: NextRequest): Promise<AuthUser> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthError('Missing or invalid authorization header', 'MISSING_TOKEN');
    }

    const token = authHeader.substring(7);
    const user = await this.getUserFromToken(token);
    
    if (!user) {
      throw new AuthError('Invalid or expired token', 'INVALID_TOKEN');
    }

    return user;
  }

  static async requireAdminAuth(request: NextRequest): Promise<AuthUser> {
    const user = await this.requireAuth(request);
    
    if (user.role !== 'admin') {
      throw new AuthError('Admin access required', 'INSUFFICIENT_PERMISSIONS');
    }

    return user;
  }

  static async requireActiveSubscription(request: NextRequest): Promise<AuthUser> {
    const user = await this.requireAuth(request);
    
    if (!user.subscription || user.subscription.status !== 'active') {
      throw new AuthError('Active subscription required', 'SUBSCRIPTION_REQUIRED');
    }

    // Check if subscription is expired
    if (new Date(user.subscription.expiresAt) < new Date()) {
      throw new AuthError('Subscription expired', 'SUBSCRIPTION_EXPIRED');
    }

    return user;
  }

  static extractTokenFromRequest(request: NextRequest): string | null {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

// Rate limiting store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export class RateLimiter {
  private static readonly DEFAULT_WINDOW = 60000; // 1 minute
  private static readonly DEFAULT_MAX_REQUESTS = 100;

  static async checkLimit(
    identifier: string,
    windowMs: number = this.DEFAULT_WINDOW,
    maxRequests: number = this.DEFAULT_MAX_REQUESTS
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const key = `${identifier}:${Math.floor(now / windowMs)}`;
    
    const current = rateLimitStore.get(key) || { count: 0, resetTime: now + windowMs };
    
    if (now > current.resetTime) {
      // Reset the counter
      current.count = 0;
      current.resetTime = now + windowMs;
    }

    current.count++;
    rateLimitStore.set(key, current);

    return {
      allowed: current.count <= maxRequests,
      remaining: Math.max(0, maxRequests - current.count),
      resetTime: current.resetTime
    };
  }

  static async requireRateLimit(
    identifier: string,
    windowMs?: number,
    maxRequests?: number
  ): Promise<void> {
    const result = await this.checkLimit(identifier, windowMs, maxRequests);
    
    if (!result.allowed) {
      throw new AuthError('Rate limit exceeded', 'RATE_LIMIT_EXCEEDED');
    }
  }
}

// API key validation for backwards compatibility
export async function validateApiKey(apiKey: string): Promise<boolean> {
  return AuthService.authenticateAdmin(apiKey);
}

// Helper function to get client IP
export function getClientIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const remoteAddr = request.headers.get('x-vercel-forwarded-for');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  if (remoteAddr) {
    return remoteAddr;
  }
  
  return 'unknown';
}