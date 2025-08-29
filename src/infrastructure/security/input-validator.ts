// src/infrastructure/security/input-validator.ts
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

export class ValidationError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class InputValidator {
  // Common validation schemas
  static readonly schemas = {
    email: z.string().email('Invalid email format').max(254, 'Email too long'),
    
    password: z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password too long')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
    
    name: z.string()
      .min(1, 'Name is required')
      .max(100, 'Name too long')
      .regex(/^[a-zA-Z\s'-]+$/, 'Name contains invalid characters'),
    
    phone: z.string()
      .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
      .optional(),
    
    url: z.string().url('Invalid URL format').max(2048, 'URL too long'),
    
    uuid: z.string().uuid('Invalid UUID format'),
    
    objectId: z.string()
      .min(1, 'ID is required')
      .max(100, 'ID too long')
      .regex(/^[a-zA-Z0-9_-]+$/, 'ID contains invalid characters'),
    
    searchQuery: z.string()
      .min(1, 'Search query cannot be empty')
      .max(200, 'Search query too long')
      .refine(val => !this.containsMaliciousPatterns(val), 'Invalid search query'),
    
    safeText: z.string()
      .max(1000, 'Text too long')
      .refine(val => !this.containsMaliciousPatterns(val), 'Text contains unsafe content'),
    
    amount: z.number()
      .positive('Amount must be positive')
      .max(99999999, 'Amount too large')
      .multipleOf(0.01, 'Invalid amount precision'),
    
    pagination: z.object({
      page: z.number().int().min(1, 'Page must be at least 1').max(1000, 'Page number too large'),
      limit: z.number().int().min(1, 'Limit must be at least 1').max(100, 'Limit too large'),
    }),
  };

  // Authentication schemas
  static readonly authSchemas = {
    signIn: z.object({
      email: this.schemas.email,
      password: z.string().min(1, 'Password is required').max(128, 'Password too long'),
    }),
    
    signUp: z.object({
      email: this.schemas.email,
      password: this.schemas.password,
      fullName: this.schemas.name,
      phone: this.schemas.phone,
    }),
    
    resetPassword: z.object({
      email: this.schemas.email,
    }),
    
    updateProfile: z.object({
      fullName: this.schemas.name.optional(),
      phone: this.schemas.phone,
      collegeName: z.string().max(200, 'College name too long').optional(),
      department: z.string().max(100, 'Department name too long').optional(),
    }),
  };

  // Subscription schemas
  static readonly subscriptionSchemas = {
    createSubscription: z.object({
      planId: this.schemas.uuid,
      subscriptionType: z.enum(['monthly', 'yearly']),
    }),
    
    cancelSubscription: z.object({
      subscriptionId: this.schemas.uuid,
      reason: z.string().max(500, 'Reason too long').optional(),
    }),
  };

  // Payment schemas
  static readonly paymentSchemas = {
    createOrder: z.object({
      planId: this.schemas.uuid,
      subscriptionType: z.enum(['monthly', 'yearly']),
      userEmail: this.schemas.email,
      userId: this.schemas.uuid.optional(),
    }),
    
    verifyPayment: z.object({
      razorpay_order_id: z.string().min(1, 'Order ID is required'),
      razorpay_payment_id: z.string().min(1, 'Payment ID is required'),
      razorpay_signature: z.string().min(1, 'Signature is required'),
      planId: this.schemas.uuid,
      subscriptionType: z.enum(['monthly', 'yearly']),
      userEmail: this.schemas.email,
    }),
  };

  // Admin schemas
  static readonly adminSchemas = {
    createUser: z.object({
      email: this.schemas.email,
      fullName: this.schemas.name,
      role: z.enum(['user', 'admin']),
    }),
    
    updateUserStatus: z.object({
      userId: this.schemas.uuid,
      status: z.enum(['active', 'suspended', 'deleted']),
    }),
  };

  // Search and filter schemas
  static readonly searchSchemas = {
    tenderSearch: z.object({
      query: this.schemas.searchQuery.optional(),
      college: z.string().max(200, 'College filter too long').optional(),
      department: z.string().max(100, 'Department filter too long').optional(),
      minValue: z.number().positive('Minimum value must be positive').optional(),
      maxValue: z.number().positive('Maximum value must be positive').optional(),
      dateFrom: z.string().datetime('Invalid date format').optional(),
      dateTo: z.string().datetime('Invalid date format').optional(),
      page: z.number().int().min(1).max(1000).default(1),
      limit: z.number().int().min(1).max(50).default(20),
    }).refine(
      (data) => !data.minValue || !data.maxValue || data.minValue <= data.maxValue,
      {
        message: 'Minimum value cannot be greater than maximum value',
        path: ['minValue'],
      }
    ),
  };

  /**
   * Validate and sanitize input data
   */
  static validateAndSanitize<T>(
    data: unknown,
    schema: z.ZodSchema<T>
  ): T {
    try {
      // First validate with Zod
      const validated = schema.parse(data);
      
      // Then sanitize string fields
      return this.sanitizeObject(validated) as T;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.issues[0];
        throw new ValidationError(
          'VALIDATION_ERROR',
          firstError.message,
          {
            field: firstError.path.join('.'),
            code: firstError.code,
            errors: error.issues,
          }
        );
      }
      throw error;
    }
  }

  /**
   * Sanitize an object recursively
   */
  static sanitizeObject(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  }

  /**
   * Sanitize a string to prevent XSS and other attacks
   */
  static sanitizeString(input: string): string {
    if (typeof input !== 'string') {
      return input;
    }

    // Basic HTML sanitization using DOMPurify
    let sanitized = DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
    });

    // Additional sanitization
    sanitized = sanitized
      .trim()
      // Remove any remaining HTML/XML tags
      .replace(/<[^>]*>/g, '')
      // Remove dangerous JavaScript patterns
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/data:\s*text\/html/gi, '')
      // Remove SQL injection patterns
      .replace(/(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/gi, '')
      // Remove common XSS vectors
      .replace(/(<script|<\/script>|<iframe|<\/iframe>|<object|<\/object>)/gi, '');

    return sanitized;
  }

  /**
   * Check if input contains malicious patterns
   */
  static containsMaliciousPatterns(input: string): boolean {
    const maliciousPatterns = [
      // XSS patterns
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /vbscript:/gi,
      /on\w+\s*=/gi,
      /data:\s*text\/html/gi,
      
      // SQL injection patterns
      /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\s+(all\s+)?)/gi,
      /(;|\s)(drop|create|alter|exec|execute)\s/gi,
      /'\s*(or|and)\s*'?\d/gi,
      /'\s*(or|and)\s*'.*?'/gi,
      
      // Path traversal
      /(\.\.\/)|(\.\.\\)/g,
      
      // Command injection
      /(\||;|&|`|\$\(|\${)/g,
      
      // Template injection
      /\{\{.*?\}\}/g,
      /\$\{.*?\}/g,
      
      // LDAP injection
      /(\(|\)|\||&)/g,
    ];

    return maliciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate file upload
   */
  static validateFileUpload(file: File, options: {
    maxSize?: number;
    allowedTypes?: string[];
    allowedExtensions?: string[];
  } = {}): void {
    const {
      maxSize = 5 * 1024 * 1024, // 5MB default
      allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf'],
    } = options;

    // Check file size
    if (file.size > maxSize) {
      throw new ValidationError(
        'FILE_TOO_LARGE',
        `File size exceeds limit of ${Math.round(maxSize / 1024 / 1024)}MB`
      );
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      throw new ValidationError(
        'INVALID_FILE_TYPE',
        `File type ${file.type} is not allowed`
      );
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowedExtensions.includes(extension)) {
      throw new ValidationError(
        'INVALID_FILE_EXTENSION',
        `File extension ${extension} is not allowed`
      );
    }

    // Check for malicious file names
    if (this.containsMaliciousPatterns(file.name)) {
      throw new ValidationError(
        'MALICIOUS_FILENAME',
        'File name contains potentially dangerous characters'
      );
    }
  }

  /**
   * Validate and sanitize URL parameters
   */
  static validateUrlParams(
    params: Record<string, string | string[] | undefined>,
    schema: z.ZodSchema
  ): any {
    // Convert string arrays to single strings (take first value)
    const cleanParams: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (Array.isArray(value)) {
        cleanParams[key] = value[0];
      } else {
        cleanParams[key] = value;
      }
    }

    return this.validateAndSanitize(cleanParams, schema);
  }

  /**
   * Create a custom validator for specific use cases
   */
  static createCustomValidator<T>(
    schema: z.ZodSchema<T>,
    additionalValidation?: (data: T) => void
  ) {
    return (data: unknown): T => {
      const validated = this.validateAndSanitize(data, schema);
      
      if (additionalValidation) {
        additionalValidation(validated);
      }
      
      return validated;
    };
  }
}

// Export commonly used validators
export const validateAuth = {
  signIn: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.authSchemas.signIn),
  signUp: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.authSchemas.signUp),
  resetPassword: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.authSchemas.resetPassword),
  updateProfile: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.authSchemas.updateProfile),
};

export const validateSubscription = {
  create: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.subscriptionSchemas.createSubscription),
  cancel: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.subscriptionSchemas.cancelSubscription),
};

export const validatePayment = {
  createOrder: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.paymentSchemas.createOrder),
  verifyPayment: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.paymentSchemas.verifyPayment),
};

export const validateSearch = {
  tenders: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.searchSchemas.tenderSearch),
};

export const validateAdmin = {
  createUser: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.adminSchemas.createUser),
  updateUserStatus: (data: unknown) => InputValidator.validateAndSanitize(data, InputValidator.adminSchemas.updateUserStatus),
};