// src/lib/logger.ts - Production-ready logging system
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  requestId?: string;
  userId?: string;
  ip?: string;
  userAgent?: string;
  service?: string;
  environment?: string;
}

export interface LogMetrics {
  responseTime?: number;
  statusCode?: number;
  method?: string;
  path?: string;
  userAgent?: string;
  ip?: string;
}

class Logger {
  private static instance: Logger;
  private readonly service: string;
  private readonly environment: string;

  private constructor() {
    this.service = process.env.SERVICE_NAME || 'tender-data-app';
    this.environment = process.env.NODE_ENV || 'development';
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private async writeToDatabase(entry: LogEntry): Promise<void> {
    try {
      await supabaseAdmin.from('application_logs').insert({
        level: entry.level,
        message: entry.message,
        timestamp: entry.timestamp,
        context: entry.context,
        error: entry.error,
        request_id: entry.requestId,
        user_id: entry.userId,
        ip: entry.ip,
        user_agent: entry.userAgent,
        service: entry.service,
        environment: entry.environment,
      });
    } catch (error) {
      // Fallback to console if database logging fails
      console.error('Failed to write log to database:', error);
    }
  }

  private formatConsoleLog(entry: LogEntry): string {
    const timestamp = new Date(entry.timestamp).toISOString();
    const level = entry.level.toUpperCase().padEnd(5);
    const context = entry.context ? JSON.stringify(entry.context) : '';
    const error = entry.error ? `\nError: ${entry.error.name}: ${entry.error.message}` : '';
    
    return `[${timestamp}] ${level} ${entry.message} ${context}${error}`;
  }

  private async log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): Promise<void> {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      service: this.service,
      environment: this.environment,
    };

    // Console logging
    console.log(this.formatConsoleLog(entry));

    // Database logging (async, non-blocking)
    if (this.environment === 'production' || this.environment === 'staging') {
      this.writeToDatabase(entry).catch(console.error);
    }

    // In production, send to external logging service
    if (this.environment === 'production') {
      // Example: Send to external service like Datadog, New Relic, etc.
      // await this.sendToExternalService(entry);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    if (this.environment === 'development') {
      this.log('debug', message, context);
    }
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('fatal', message, context, error);
  }

  // Structured logging methods
  async logAPIRequest(
    method: string,
    path: string,
    statusCode: number,
    responseTime: number,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log('info', `${method} ${path} ${statusCode}`, {
      ...context,
      method,
      path,
      statusCode,
      responseTime,
      type: 'api_request',
    });
  }

  async logPaymentEvent(
    event: string,
    paymentId: string,
    amount: number,
    status: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log('info', `Payment ${event}: ${paymentId}`, {
      ...context,
      event,
      paymentId,
      amount,
      status,
      type: 'payment',
    });
  }

  async logAuthEvent(
    event: string,
    userId: string,
    email: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log('info', `Auth ${event}: ${email}`, {
      ...context,
      event,
      userId,
      email,
      type: 'auth',
    });
  }

  async logSubscriptionEvent(
    event: string,
    userId: string,
    planId: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log('info', `Subscription ${event}: ${planId}`, {
      ...context,
      event,
      userId,
      planId,
      type: 'subscription',
    });
  }

  async logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: Record<string, any>
  ): Promise<void> {
    const level: LogLevel = severity === 'critical' ? 'fatal' : severity === 'high' ? 'error' : 'warn';
    await this.log(level, `Security ${event}`, {
      ...context,
      event,
      severity,
      type: 'security',
    });
  }

  // Performance monitoring
  async logPerformanceMetric(
    metric: string,
    value: number,
    unit: string,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log('info', `Performance: ${metric} = ${value}${unit}`, {
      ...context,
      metric,
      value,
      unit,
      type: 'performance',
    });
  }

  // Business metrics
  async logBusinessMetric(
    metric: string,
    value: number,
    context?: Record<string, any>
  ): Promise<void> {
    await this.log('info', `Business: ${metric} = ${value}`, {
      ...context,
      metric,
      value,
      type: 'business',
    });
  }

  // Cron job logging
  async logCronJob(
    jobName: string,
    status: 'started' | 'completed' | 'failed',
    duration?: number,
    context?: Record<string, any>
  ): Promise<void> {
    const level: LogLevel = status === 'failed' ? 'error' : 'info';
    await this.log(level, `Cron job ${jobName} ${status}`, {
      ...context,
      jobName,
      status,
      duration,
      type: 'cron',
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Utility functions for common logging patterns
export function createRequestLogger(requestId: string, userId?: string, ip?: string) {
  return {
    debug: (message: string, context?: Record<string, any>) =>
      logger.debug(message, { ...context, requestId, userId, ip }),
    info: (message: string, context?: Record<string, any>) =>
      logger.info(message, { ...context, requestId, userId, ip }),
    warn: (message: string, context?: Record<string, any>) =>
      logger.warn(message, { ...context, requestId, userId, ip }),
    error: (message: string, error?: Error, context?: Record<string, any>) =>
      logger.error(message, error, { ...context, requestId, userId, ip }),
  };
}

// Middleware for API request logging
export function logAPIMiddleware(
  method: string,
  path: string,
  statusCode: number,
  responseTime: number,
  userId?: string,
  ip?: string
) {
  logger.logAPIRequest(method, path, statusCode, responseTime, {
    userId,
    ip,
    timestamp: new Date().toISOString(),
  });
}

// Error tracking integration
export function trackError(error: Error, context?: Record<string, any>) {
  logger.error(error.message, error, context);
  
  // In production, send to error tracking service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry, Bugsnag, etc.
    // errorTracking.captureException(error, { extra: context });
  }
}

// Database table creation SQL (run this in Supabase)
export const createLogTableSQL = `
CREATE TABLE IF NOT EXISTS application_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  level VARCHAR(10) NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  context JSONB,
  error JSONB,
  request_id VARCHAR(100),
  user_id UUID,
  ip VARCHAR(45),
  user_agent TEXT,
  service VARCHAR(100),
  environment VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_application_logs_timestamp ON application_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_application_logs_level ON application_logs(level);
CREATE INDEX IF NOT EXISTS idx_application_logs_service ON application_logs(service);
CREATE INDEX IF NOT EXISTS idx_application_logs_user_id ON application_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_application_logs_request_id ON application_logs(request_id);

-- Retention policy (optional)
-- Delete logs older than 90 days
CREATE OR REPLACE FUNCTION cleanup_old_logs() RETURNS void AS $$
BEGIN
  DELETE FROM application_logs WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
`;

export default logger;