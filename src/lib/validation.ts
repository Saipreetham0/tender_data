// src/lib/validation.ts
import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email format').toLowerCase();
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const phoneSchema = z.string().regex(/^\+?[\d\s\-\(\)]+$/, 'Invalid phone number format');
export const uuidSchema = z.string().uuid('Invalid UUID format');

// User schemas
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long'),
  organization: z.string().max(100, 'Organization name too long').optional(),
  phone: phoneSchema.optional(),
});

export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const userUpdateSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100, 'Full name too long').optional(),
  organization: z.string().max(100, 'Organization name too long').optional(),
  phone: phoneSchema.optional(),
  preferences: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
});

// Subscription schemas
export const subscriptionPlanSchema = z.object({
  planId: uuidSchema,
  planName: z.string().min(1, 'Plan name is required'),
  type: z.enum(['monthly', 'yearly'], { errorMap: () => ({ message: 'Type must be monthly or yearly' }) }),
  price: z.number().min(0, 'Price must be non-negative'),
  features: z.array(z.string()).optional(),
});

export const subscriptionCreateSchema = z.object({
  planId: uuidSchema,
  type: z.enum(['monthly', 'yearly']),
  userEmail: emailSchema,
});

export const subscriptionUpdateSchema = z.object({
  status: z.enum(['active', 'cancelled', 'expired', 'pending']).optional(),
  endsAt: z.string().datetime().optional(),
  planId: uuidSchema.optional(),
});

// Payment schemas
export const paymentOrderSchema = z.object({
  planId: uuidSchema,
  type: z.enum(['monthly', 'yearly']),
  userEmail: emailSchema,
  amount: z.number().min(1, 'Amount must be greater than 0'),
  currency: z.string().length(3, 'Currency must be 3 characters').default('INR'),
});

export const paymentVerificationSchema = z.object({
  razorpay_order_id: z.string().min(1, 'Order ID is required'),
  razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
  razorpay_signature: z.string().min(1, 'Signature is required'),
  userEmail: emailSchema,
});

// Tender schemas
export const tenderDownloadLinkSchema = z.object({
  text: z.string().min(1, 'Link text is required'),
  url: z.string().url('Invalid URL format'),
});

export const tenderSchema = z.object({
  name: z.string().min(1, 'Tender name is required').max(500, 'Tender name too long'),
  postedDate: z.string().datetime('Invalid posted date format'),
  closingDate: z.string().datetime('Invalid closing date format'),
  downloadLinks: z.array(tenderDownloadLinkSchema).min(1, 'At least one download link is required'),
  source: z.string().min(1, 'Source is required').max(100, 'Source name too long'),
});

export const tenderQuerySchema = z.object({
  source: z.string().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

// Admin schemas
export const adminStatsQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
});

export const cronJobSchema = z.object({
  jobName: z.string().min(1, 'Job name is required'),
  source: z.string().min(1, 'Source is required'),
  force: z.boolean().default(false),
});

// API Response schemas
export const apiResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const paginatedResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(z.any()),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  timestamp: z.string().datetime(),
});

// Health check schema
export const healthCheckSchema = z.object({
  status: z.enum(['healthy', 'unhealthy', 'degraded']),
  timestamp: z.string().datetime(),
  services: z.record(z.object({
    status: z.enum(['healthy', 'unhealthy']),
    responseTime: z.number().optional(),
    error: z.string().optional(),
  })),
});

// Rate limit schemas
export const rateLimitSchema = z.object({
  identifier: z.string().min(1, 'Identifier is required'),
  windowMs: z.number().min(1000).max(3600000).default(60000), // 1 second to 1 hour
  maxRequests: z.number().min(1).max(10000).default(100),
});

// Validation middleware helper
export function validateSchema<T>(schema: z.ZodSchema<T>) {
  return (data: unknown): T => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
        throw new Error(`Validation failed: ${errorMessages.join(', ')}`);
      }
      throw error;
    }
  };
}

// Sanitization functions
export function sanitizeString(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizeHTML(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Input validation utility
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateAndSanitize<T>(schema: z.ZodSchema<T>, data: unknown): T {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      throw new ValidationError(firstError.message, firstError.path.join('.'));
    }
    throw error;
  }
}

// Custom validation functions
export function isValidDateRange(startDate: string, endDate: string): boolean {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
}

export function isValidSubscriptionType(type: string): boolean {
  return ['monthly', 'yearly'].includes(type);
}

export function isValidSubscriptionStatus(status: string): boolean {
  return ['active', 'cancelled', 'expired', 'pending'].includes(status);
}

export function validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}