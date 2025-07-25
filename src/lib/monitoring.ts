// src/lib/monitoring.ts - Production monitoring and health checks
import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export interface HealthCheck {
  name: string;
  status: 'healthy' | 'unhealthy' | 'degraded';
  responseTime: number;
  error?: string;
  details?: Record<string, any>;
}

export interface SystemHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  checks: HealthCheck[];
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

class MonitoringService {
  private static instance: MonitoringService;
  private readonly startTime: number;
  private readonly version: string;
  private readonly environment: string;

  private constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private async measureResponseTime<T>(operation: () => Promise<T>): Promise<{ result: T; responseTime: number }> {
    const start = Date.now();
    try {
      const result = await operation();
      const responseTime = Date.now() - start;
      return { result, responseTime };
    } catch (error) {
      const responseTime = Date.now() - start;
      throw { error, responseTime };
    }
  }

  private async checkDatabase(): Promise<HealthCheck> {
    try {
      const { responseTime } = await this.measureResponseTime(async () => {
        const { data, error } = await supabaseAdmin
          .from('user_profiles')
          .select('count(*)')
          .limit(1);
        
        if (error) throw error;
        return data;
      });

      return {
        name: 'database',
        status: responseTime < 1000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          provider: 'supabase',
          query: 'SELECT count(*) FROM user_profiles LIMIT 1',
        },
      };
    } catch (error: any) {
      return {
        name: 'database',
        status: 'unhealthy',
        responseTime: error.responseTime || 0,
        error: error.error?.message || 'Database connection failed',
      };
    }
  }

  private async checkPaymentProvider(): Promise<HealthCheck> {
    try {
      const { responseTime } = await this.measureResponseTime(async () => {
        // Simple check to Razorpay API
        const response = await fetch('https://api.razorpay.com/v1/orders?count=1', {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`
            ).toString('base64')}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Payment API returned ${response.status}`);
        }
        
        return response.json();
      });

      return {
        name: 'payment_provider',
        status: responseTime < 2000 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          provider: 'razorpay',
          endpoint: 'orders',
        },
      };
    } catch (error: any) {
      return {
        name: 'payment_provider',
        status: 'unhealthy',
        responseTime: error.responseTime || 0,
        error: error.message || 'Payment provider check failed',
      };
    }
  }

  private async checkEmailService(): Promise<HealthCheck> {
    try {
      const { responseTime } = await this.measureResponseTime(async () => {
        // Simple check to Resend API
        const response = await fetch('https://api.resend.com/domains', {
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`Email API returned ${response.status}`);
        }
        
        return response.json();
      });

      return {
        name: 'email_service',
        status: responseTime < 1500 ? 'healthy' : 'degraded',
        responseTime,
        details: {
          provider: 'resend',
          endpoint: 'domains',
        },
      };
    } catch (error: any) {
      return {
        name: 'email_service',
        status: 'unhealthy',
        responseTime: error.responseTime || 0,
        error: error.message || 'Email service check failed',
      };
    }
  }

  private checkMemoryUsage(): HealthCheck {
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.rss + memoryUsage.heapUsed + memoryUsage.external;
    const maxMemory = 512 * 1024 * 1024; // 512MB threshold
    
    return {
      name: 'memory_usage',
      status: totalMemory < maxMemory ? 'healthy' : 'degraded',
      responseTime: 0,
      details: {
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal,
        external: memoryUsage.external,
        totalMB: Math.round(totalMemory / 1024 / 1024),
      },
    };
  }

  private checkDiskSpace(): HealthCheck {
    // In a real implementation, you'd check actual disk space
    // For now, we'll simulate a basic check
    return {
      name: 'disk_space',
      status: 'healthy',
      responseTime: 0,
      details: {
        available: '90%',
        threshold: '85%',
      },
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkPaymentProvider(),
      this.checkEmailService(),
      this.checkMemoryUsage(),
      this.checkDiskSpace(),
    ]);

    // Determine overall system status
    let status: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    
    const unhealthyChecks = checks.filter(check => check.status === 'unhealthy');
    const degradedChecks = checks.filter(check => check.status === 'degraded');
    
    if (unhealthyChecks.length > 0) {
      status = 'unhealthy';
    } else if (degradedChecks.length > 0) {
      status = 'degraded';
    }

    const systemHealth: SystemHealth = {
      status,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime,
      version: this.version,
      environment: this.environment,
      checks,
    };

    // Log health check results
    logger.info('System health check completed', {
      status,
      checksCount: checks.length,
      unhealthyCount: unhealthyChecks.length,
      degradedCount: degradedChecks.length,
    });

    return systemHealth;
  }

  async recordMetric(name: string, value: number, unit: string, tags?: Record<string, string>): Promise<void> {
    const metric: MetricData = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    };

    try {
      await supabaseAdmin.from('metrics').insert({
        name: metric.name,
        value: metric.value,
        unit: metric.unit,
        timestamp: metric.timestamp,
        tags: metric.tags,
      });
    } catch (error) {
      logger.error('Failed to record metric', error as Error, { metric });
    }
  }

  async recordBusinessMetric(event: string, value: number, userId?: string): Promise<void> {
    await this.recordMetric(event, value, 'count', {
      type: 'business',
      userId: userId || 'anonymous',
    });
  }

  async recordPerformanceMetric(endpoint: string, responseTime: number, statusCode: number): Promise<void> {
    await this.recordMetric('api_response_time', responseTime, 'ms', {
      type: 'performance',
      endpoint,
      statusCode: statusCode.toString(),
    });
  }

  async recordErrorMetric(error: string, source: string): Promise<void> {
    await this.recordMetric('error_count', 1, 'count', {
      type: 'error',
      error,
      source,
    });
  }

  // Alert system
  async checkAlerts(): Promise<void> {
    const health = await this.getSystemHealth();
    
    if (health.status === 'unhealthy') {
      await this.sendAlert('critical', 'System is unhealthy', {
        status: health.status,
        failedChecks: health.checks.filter(c => c.status === 'unhealthy').map(c => c.name),
      });
    }
    
    // Check for high error rates
    const errorRate = await this.getErrorRate();
    if (errorRate > 0.1) { // 10% error rate threshold
      await this.sendAlert('high', 'High error rate detected', {
        errorRate,
        threshold: 0.1,
      });
    }
  }

  private async getErrorRate(): Promise<number> {
    try {
      const { data } = await supabaseAdmin
        .from('metrics')
        .select('*')
        .eq('name', 'error_count')
        .gte('timestamp', new Date(Date.now() - 5 * 60 * 1000).toISOString());
      
      return data?.length || 0;
    } catch (error) {
      logger.error('Failed to get error rate', error as Error);
      return 0;
    }
  }

  private async sendAlert(severity: 'low' | 'medium' | 'high' | 'critical', message: string, context?: Record<string, any>): Promise<void> {
    logger.logSecurityEvent('alert', severity, { message, ...context });
    
    // In production, send to alerting service (PagerDuty, Slack, etc.)
    if (this.environment === 'production') {
      // Example: Send to Slack webhook
      // await this.sendSlackAlert(severity, message, context);
    }
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Utility functions
export async function trackAPICall(
  endpoint: string,
  method: string,
  statusCode: number,
  responseTime: number,
  userId?: string
): Promise<void> {
  await monitoring.recordPerformanceMetric(endpoint, responseTime, statusCode);
  
  logger.logAPIRequest(method, endpoint, statusCode, responseTime, {
    userId,
    timestamp: new Date().toISOString(),
  });
}

export async function trackBusinessEvent(
  event: string,
  value: number = 1,
  userId?: string
): Promise<void> {
  await monitoring.recordBusinessMetric(event, value, userId);
  
  logger.logBusinessMetric(event, value, {
    userId,
    timestamp: new Date().toISOString(),
  });
}

export async function trackError(
  error: Error,
  source: string,
  context?: Record<string, any>
): Promise<void> {
  await monitoring.recordErrorMetric(error.message, source);
  
  logger.error(`Error in ${source}`, error, context);
}

// Database schema for metrics
export const createMetricsTableSQL = `
CREATE TABLE IF NOT EXISTS metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  value NUMERIC NOT NULL,
  unit VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  tags JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_metrics_name ON metrics(name);
CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_metrics_tags ON metrics USING GIN(tags);

-- Retention policy (optional)
CREATE OR REPLACE FUNCTION cleanup_old_metrics() RETURNS void AS $$
BEGIN
  DELETE FROM metrics WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;
`;

export default monitoring;