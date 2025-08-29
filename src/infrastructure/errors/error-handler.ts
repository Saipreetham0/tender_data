// src/infrastructure/errors/error-handler.ts
import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

// Base error class
abstract class AppError extends Error {
  abstract readonly statusCode: number;
  abstract readonly code: string;
  abstract readonly isOperational: boolean;

  constructor(message: string, public readonly context?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Authentication errors
class AuthError extends AppError {
  readonly statusCode = 401;
  readonly code = 'AUTH_ERROR';
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

class AuthorizationError extends AppError {
  readonly statusCode = 403;
  readonly code = 'AUTHORIZATION_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Insufficient permissions', context?: Record<string, any>) {
    super(message, context);
  }
}

// Validation errors
class ValidationError extends AppError {
  readonly statusCode = 400;
  readonly code = 'VALIDATION_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly details?: any, context?: Record<string, any>) {
    super(message, context);
  }
}

// Not found errors
class NotFoundError extends AppError {
  readonly statusCode = 404;
  readonly code = 'NOT_FOUND';
  readonly isOperational = true;

  constructor(resource: string, context?: Record<string, any>) {
    super(`${resource} not found`, context);
  }
}

// Conflict errors
class ConflictError extends AppError {
  readonly statusCode = 409;
  readonly code = 'CONFLICT';
  readonly isOperational = true;

  constructor(message: string, context?: Record<string, any>) {
    super(message, context);
  }
}

// Rate limiting errors
class RateLimitError extends AppError {
  readonly statusCode = 429;
  readonly code = 'RATE_LIMIT_EXCEEDED';
  readonly isOperational = true;

  constructor(
    message: string = 'Rate limit exceeded',
    public readonly retryAfter?: number,
    context?: Record<string, any>
  ) {
    super(message, context);
  }
}

// Payment errors
class PaymentError extends AppError {
  readonly statusCode = 402;
  readonly code = 'PAYMENT_ERROR';
  readonly isOperational = true;

  constructor(message: string, public readonly paymentCode?: string, context?: Record<string, any>) {
    super(message, context);
  }
}

// External service errors
class ExternalServiceError extends AppError {
  readonly statusCode = 502;
  readonly code = 'EXTERNAL_SERVICE_ERROR';
  readonly isOperational = true;

  constructor(
    service: string,
    message: string = 'External service unavailable',
    context?: Record<string, any>
  ) {
    super(`${service}: ${message}`, context);
  }
}

// Database errors
class DatabaseError extends AppError {
  readonly statusCode = 500;
  readonly code = 'DATABASE_ERROR';
  readonly isOperational = true;

  constructor(message: string = 'Database operation failed', context?: Record<string, any>) {
    super(message, context);
  }
}

// Internal server errors
class InternalServerError extends AppError {
  readonly statusCode = 500;
  readonly code = 'INTERNAL_SERVER_ERROR';
  readonly isOperational = false;

  constructor(message: string = 'Internal server error', context?: Record<string, any>) {
    super(message, context);
  }
}

// Error response interface
export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    requestId?: string;
    path?: string;
  };
}

// Error handler class
export class ErrorHandler {
  private static instance: ErrorHandler;

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle errors in API routes
   */
  handleApiError(error: unknown, request: NextRequest): NextResponse<ErrorResponse> {
    const requestId = request.headers.get('x-request-id') || 'unknown';
    const path = new URL(request.url).pathname;

    // Log error
    this.logError(error, { requestId, path, method: request.method });

    // Convert to standardized error
    const appError = this.normalizeError(error);

    // Create error response
    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        code: appError.code,
        message: this.getSafeErrorMessage(appError),
        details: this.getSafeErrorDetails(appError),
        timestamp: new Date().toISOString(),
        requestId,
        path,
      },
    };

    // Add additional headers for specific error types
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (appError instanceof RateLimitError && appError.retryAfter) {
      headers['Retry-After'] = appError.retryAfter.toString();
    }

    return NextResponse.json(errorResponse, {
      status: appError.statusCode,
      headers,
    });
  }

  /**
   * Handle errors in React components
   */
  handleClientError(error: unknown, errorInfo?: any): void {
    console.error('Client error:', error, errorInfo);

    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(error, 'client', errorInfo);
    }
  }

  /**
   * Convert any error to AppError
   */
  private normalizeError(error: unknown): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Zod validation error
    if (error instanceof ZodError) {
      const firstError = error.issues[0];
      return new ValidationError(
        firstError.message,
        {
          field: firstError.path.join('.'),
          code: firstError.code,
          errors: error.issues,
        }
      );
    }

    // Standard Error
    if (error instanceof Error) {
      // Check for specific error patterns
      if (error.message.includes('unauthorized') || error.message.includes('authentication')) {
        return new AuthError(error.message);
      }

      if (error.message.includes('forbidden') || error.message.includes('permission')) {
        return new AuthorizationError(error.message);
      }

      if (error.message.includes('not found')) {
        return new NotFoundError('Resource');
      }

      if (error.message.includes('conflict') || error.message.includes('already exists')) {
        return new ConflictError(error.message);
      }

      if (error.message.includes('rate limit')) {
        return new RateLimitError(error.message);
      }

      if (error.message.includes('payment') || error.message.includes('razorpay')) {
        return new PaymentError(error.message);
      }

      if (error.message.includes('database') || error.message.includes('supabase')) {
        return new DatabaseError(error.message);
      }

      // Generic error
      return new InternalServerError(error.message);
    }

    // Unknown error type
    return new InternalServerError('An unexpected error occurred');
  }

  /**
   * Get safe error message for client
   */
  private getSafeErrorMessage(error: AppError): string {
    // For operational errors, return the actual message
    if (error.isOperational) {
      return error.message;
    }

    // For non-operational errors in production, return generic message
    if (process.env.NODE_ENV === 'production') {
      return 'An internal server error occurred';
    }

    // In development, return actual message
    return error.message;
  }

  /**
   * Get safe error details for client
   */
  private getSafeErrorDetails(error: AppError): any {
    // Only include details for validation errors and operational errors
    if (error instanceof ValidationError) {
      return error.details;
    }

    if (error.isOperational && error.context) {
      // Filter out sensitive information
      const safeContext = { ...error.context };
      delete safeContext.password;
      delete safeContext.token;
      delete safeContext.secret;
      delete safeContext.key;
      return safeContext;
    }

    return undefined;
  }

  /**
   * Log error with context
   */
  private logError(error: unknown, context: Record<string, any> = {}): void {
    const timestamp = new Date().toISOString();
    const errorInfo = {
      timestamp,
      error: {
        name: error instanceof Error ? error.name : 'Unknown',
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      context,
      environment: process.env.NODE_ENV,
    };

    // Console logging
    if (error instanceof AppError && error.isOperational) {
      console.warn('Operational error:', errorInfo);
    } else {
      console.error('Non-operational error:', errorInfo);
    }

    // Send to external error tracking in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToErrorTracking(error, 'server', context);
    }
  }

  /**
   * Send error to external tracking service
   */
  private sendToErrorTracking(error: unknown, source: 'client' | 'server', context?: any): void {
    // Implementation for external error tracking service (e.g., Sentry)
    try {
      // Example: Sentry.captureException(error, { tags: { source }, extra: context });
      console.log('Would send to error tracking:', { error, source, context });
    } catch (trackingError) {
      console.error('Failed to send error to tracking service:', trackingError);
    }
  }

  /**
   * Create error handler for async functions
   */
  static asyncHandler(fn: (req: NextRequest) => Promise<NextResponse>) {
    return async (request: NextRequest): Promise<NextResponse> => {
      try {
        return await fn(request);
      } catch (error) {
        return ErrorHandler.getInstance().handleApiError(error, request);
      }
    };
  }

  /**
   * Create error handler for API routes with specific method
   */
  static createApiHandler(handlers: {
    GET?: (req: NextRequest) => Promise<NextResponse>;
    POST?: (req: NextRequest) => Promise<NextResponse>;
    PUT?: (req: NextRequest) => Promise<NextResponse>;
    DELETE?: (req: NextRequest) => Promise<NextResponse>;
    PATCH?: (req: NextRequest) => Promise<NextResponse>;
  }) {
    const wrappedHandlers: any = {};

    Object.entries(handlers).forEach(([method, handler]) => {
      if (handler) {
        wrappedHandlers[method] = ErrorHandler.asyncHandler(handler);
      }
    });

    return wrappedHandlers;
  }
}

// Utility functions
export const asyncHandler = ErrorHandler.asyncHandler;
export const createApiHandler = ErrorHandler.createApiHandler.bind(ErrorHandler);

// Export commonly used error classes
export {
  AppError,
  AuthError,
  AuthorizationError,
  ValidationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  PaymentError,
  ExternalServiceError,
  DatabaseError,
  InternalServerError,
};

// Global error handler instance
export const errorHandler = ErrorHandler.getInstance();