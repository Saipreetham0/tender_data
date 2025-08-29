// src/infrastructure/monitoring/logger.ts

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  userEmail?: string;
  endpoint?: string;
  method?: string;
  ip?: string;
  userAgent?: string;
  duration?: number;
  statusCode?: number;
  error?: Error | object;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  environment: string;
  service: string;
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel;
  private service: string;
  private environment: string;

  constructor(
    logLevel: LogLevel = LogLevel.INFO,
    service: string = 'tender-portal',
    environment: string = process.env.NODE_ENV || 'development'
  ) {
    this.logLevel = logLevel;
    this.service = service;
    this.environment = environment;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      const logLevel = Logger.parseLogLevel(process.env.LOG_LEVEL || 'info');
      Logger.instance = new Logger(logLevel);
    }
    return Logger.instance;
  }

  private static parseLogLevel(level: string): LogLevel {
    switch (level.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel;
  }

  private createLogEntry(level: LogLevel, message: string, context: LogContext = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
      environment: this.environment,
      service: this.service,
    };
  }

  private sanitizeContext(context: LogContext): LogContext {
    const sanitized = { ...context };
    
    // Remove sensitive information
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    sensitiveFields.forEach(field => {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    });

    // Sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = this.sanitizeNestedObject(sanitized[key]);
      }
    });

    return sanitized;
  }

  private sanitizeNestedObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    const sanitized = Array.isArray(obj) ? [] : {};
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];

    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        (sanitized as any)[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        (sanitized as any)[key] = this.sanitizeNestedObject(value);
      } else {
        (sanitized as any)[key] = value;
      }
    }

    return sanitized;
  }

  private formatError(error: Error): object {
    return {
      name: error.name,
      message: error.message,
      stack: this.environment === 'development' ? error.stack : undefined,
    };
  }

  private writeLog(entry: LogEntry): void {
    const formattedEntry = {
      ...entry,
      context: {
        ...entry.context,
        error: entry.context.error instanceof Error ? this.formatError(entry.context.error) : entry.context.error,
      },
    };

    // Console output with colors in development
    if (this.environment === 'development') {
      this.writeToConsole(entry.level, entry.message, formattedEntry.context);
    } else {
      // Structured JSON logging for production
      console.log(JSON.stringify(formattedEntry));
    }

    // Send to external logging service in production
    if (this.environment === 'production') {
      this.sendToExternalService(formattedEntry);
    }
  }

  private writeToConsole(level: LogLevel, message: string, context: LogContext): void {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    
    let colorCode = '\x1b[0m'; // Reset
    switch (level) {
      case LogLevel.DEBUG: colorCode = '\x1b[36m'; break; // Cyan
      case LogLevel.INFO: colorCode = '\x1b[32m'; break;  // Green
      case LogLevel.WARN: colorCode = '\x1b[33m'; break;  // Yellow
      case LogLevel.ERROR: colorCode = '\x1b[31m'; break; // Red
    }

    const resetColor = '\x1b[0m';
    const formattedMessage = `${colorCode}[${timestamp}] ${levelName}: ${message}${resetColor}`;
    
    if (Object.keys(context).length > 0) {
      console.log(formattedMessage, context);
    } else {
      console.log(formattedMessage);
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // Implement integration with external logging service
    // Examples: Winston with transport, Datadog, Splunk, etc.
    try {
      // Example implementation would go here
      // For now, we'll just use a placeholder
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  // Public logging methods
  debug(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      const entry = this.createLogEntry(LogLevel.DEBUG, message, context);
      this.writeLog(entry);
    }
  }

  info(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.INFO)) {
      const entry = this.createLogEntry(LogLevel.INFO, message, context);
      this.writeLog(entry);
    }
  }

  warn(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.WARN)) {
      const entry = this.createLogEntry(LogLevel.WARN, message, context);
      this.writeLog(entry);
    }
  }

  error(message: string, context: LogContext = {}): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      const entry = this.createLogEntry(LogLevel.ERROR, message, context);
      this.writeLog(entry);
    }
  }

  // Specialized logging methods
  audit(action: string, context: LogContext = {}): void {
    this.info(`AUDIT: ${action}`, {
      ...context,
      type: 'audit',
      action,
    });
  }

  security(message: string, context: LogContext = {}): void {
    this.warn(`SECURITY: ${message}`, {
      ...context,
      type: 'security',
    });
  }

  performance(operation: string, duration: number, context: LogContext = {}): void {
    this.info(`PERFORMANCE: ${operation} completed in ${duration}ms`, {
      ...context,
      type: 'performance',
      operation,
      duration,
    });
  }

  // Request logging helpers
  logRequest(method: string, path: string, context: LogContext = {}): void {
    this.info(`${method} ${path}`, {
      ...context,
      type: 'request',
      method,
      path,
    });
  }

  logResponse(method: string, path: string, statusCode: number, duration: number, context: LogContext = {}): void {
    const level = statusCode >= 500 ? LogLevel.ERROR : statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO;
    const entry = this.createLogEntry(level, `${method} ${path} ${statusCode} - ${duration}ms`, {
      ...context,
      type: 'response',
      method,
      path,
      statusCode,
      duration,
    });
    this.writeLog(entry);
  }

  // Database operation logging
  logDatabaseOperation(operation: string, table: string, duration: number, context: LogContext = {}): void {
    this.debug(`Database ${operation} on ${table} completed in ${duration}ms`, {
      ...context,
      type: 'database',
      operation,
      table,
      duration,
    });
  }

  // Authentication logging
  logAuthEvent(event: string, userId?: string, context: LogContext = {}): void {
    this.info(`Auth: ${event}`, {
      ...context,
      type: 'auth',
      event,
      userId,
    });
  }

  // Payment logging
  logPaymentEvent(event: string, amount?: number, currency?: string, context: LogContext = {}): void {
    this.info(`Payment: ${event}`, {
      ...context,
      type: 'payment',
      event,
      amount,
      currency,
    });
  }

  // Error with stack trace
  exception(error: Error, context: LogContext = {}): void {
    this.error(error.message, {
      ...context,
      error,
      type: 'exception',
    });
  }

  // Create child logger with additional context
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.logLevel, this.service, this.environment);
    const originalCreateLogEntry = childLogger.createLogEntry.bind(childLogger);
    
    childLogger.createLogEntry = (level: LogLevel, message: string, context: LogContext = {}) => {
      return originalCreateLogEntry(level, message, { ...additionalContext, ...context });
    };
    
    return childLogger;
  }

  // Timing utility
  time(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.performance(label, duration);
    };
  }
}

// Create and export default logger instance
export const logger = Logger.getInstance();

// Export convenience functions
export const logRequest = logger.logRequest.bind(logger);
export const logResponse = logger.logResponse.bind(logger);
export const logAuth = logger.logAuthEvent.bind(logger);
export const logPayment = logger.logPaymentEvent.bind(logger);
export const logAudit = logger.audit.bind(logger);
export const logSecurity = logger.security.bind(logger);
export const logPerformance = logger.performance.bind(logger);
export const logException = logger.exception.bind(logger);

// Request/Response logging middleware helper
export function createRequestLogger(requestId: string) {
  return logger.child({ requestId });
}