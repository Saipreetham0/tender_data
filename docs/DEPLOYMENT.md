# Production Deployment Guide

## Overview

This guide covers deploying the Tender Data SaaS application to production with proper security, monitoring, and scalability configurations.

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+ (Supabase)
- Vercel account (or similar hosting platform)
- Domain name and SSL certificate
- Third-party service accounts:
  - Razorpay (payment processing)
  - Resend (email service)
  - Google OAuth (authentication)

## Environment Setup

### 1. Create Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key-64-characters-long

# Payment Configuration
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your-razorpay-secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_WEBHOOK_SECRET=your-webhook-secret

# Email Configuration
RESEND_API_KEY=re_your_resend_key
RESEND_FROM_EMAIL=noreply@yourdomain.com
NOTIFICATION_EMAILS=admin@yourdomain.com,alerts@yourdomain.com

# OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# API Configuration
NEXT_PUBLIC_API_BASE_URL=https://yourdomain.com
VERCEL_URL=https://yourdomain.com
CRON_API_SECRET_KEY=your-cron-secret-key-32-characters-long

# Application Configuration
NODE_ENV=production
SERVICE_NAME=tender-data-app
```

### 2. Validate Environment Variables

Run the validation script:

```bash
npm run validate-env
```

## Database Setup

### 1. Run Database Migrations

Execute the schema file in your Supabase dashboard:

```bash
# Copy the contents of database/schema.sql
# and run in Supabase SQL editor
```

### 2. Set up Row Level Security (RLS)

The schema includes RLS policies, but verify they're enabled:

```sql
-- Check RLS status
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 3. Create Service Accounts

Set up service accounts for different operations:

```sql
-- Create monitoring user
CREATE USER monitoring_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO monitoring_user;

-- Create backup user
CREATE USER backup_user WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_user;
```

## Security Configuration

### 1. Enable Security Headers

Ensure your middleware includes all security headers:

```typescript
// Verified in src/middleware.ts
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Strict-Transport-Security: max-age=31536000
- Content-Security-Policy: (comprehensive policy)
- X-XSS-Protection: 1; mode=block
```

### 2. Configure CORS

Update allowed origins in middleware:

```typescript
const allowedOrigins = [
  'https://yourdomain.com',
  'https://www.yourdomain.com',
  // Add any other domains
];
```

### 3. Set up Rate Limiting

Configure rate limits for production:

```typescript
const RATE_LIMITS = {
  '/api/auth/': { windowMs: 60000, maxRequests: 5 },
  '/api/payment/': { windowMs: 60000, maxRequests: 10 },
  '/api/admin/': { windowMs: 60000, maxRequests: 20 },
  '/api/tenders/': { windowMs: 60000, maxRequests: 50 },
  '/api/': { windowMs: 60000, maxRequests: 100 },
};
```

### 4. Enable HTTPS

Configure SSL/TLS:

```typescript
// In next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};
```

## Deployment Steps

### 1. Build and Test

```bash
# Install dependencies
npm install

# Run tests
npm run test:ci

# Lint code
npm run lint

# Build application
npm run build

# Test production build locally
npm run start
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to production
vercel --prod
```

### 3. Configure Custom Domain

1. Add your domain in Vercel dashboard
2. Configure DNS records:
   ```
   A record: @ -> 76.76.21.21
   CNAME: www -> cname.vercel-dns.com
   ```

### 4. Set up SSL Certificate

Vercel automatically provides SSL certificates for custom domains.

## Database Optimizations

### 1. Index Optimization

Verify all indexes are created:

```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_tup_read DESC;
```

### 2. Connection Pooling

Configure connection pooling in Supabase:

```sql
-- Set connection limits
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
```

### 3. Backup Strategy

Set up automated backups:

```bash
# Daily backup script
pg_dump -h your-db-host -U backup_user -d your_database > backup_$(date +%Y%m%d).sql

# Upload to cloud storage
aws s3 cp backup_$(date +%Y%m%d).sql s3://your-backup-bucket/
```

## Monitoring Setup

### 1. Application Monitoring

Enable comprehensive logging:

```typescript
// In your application startup
import { validateEnvironmentSecrets } from '@/lib/secrets';
import { logger } from '@/lib/logger';

// Validate environment
validateEnvironmentSecrets();

// Log application startup
logger.info('Application starting', {
  environment: process.env.NODE_ENV,
  version: process.env.npm_package_version,
});
```

### 2. Database Monitoring

Set up database monitoring:

```sql
-- Enable pg_stat_statements
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### 3. External Monitoring

Configure external monitoring services:

```typescript
// Example: Sentry for error tracking
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

### 4. Health Checks

Set up health check monitoring:

```bash
# Monitor health endpoint
curl -f https://yourdomain.com/api/admin/health?key=your-api-key

# Set up uptime monitoring with services like:
# - UptimeRobot
# - Pingdom
# - StatusCake
```

## Performance Optimizations

### 1. CDN Configuration

Configure CDN for static assets:

```typescript
// In next.config.js
module.exports = {
  images: {
    domains: ['your-cdn-domain.com'],
  },
  assetPrefix: process.env.NODE_ENV === 'production' ? 'https://cdn.yourdomain.com' : '',
};
```

### 2. Caching Strategy

Implement caching:

```typescript
// Redis for session storage
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
});

// Cache API responses
export async function getCachedTenders(source: string) {
  const cacheKey = `tenders:${source}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const tenders = await fetchTenders(source);
  await redis.setex(cacheKey, 300, JSON.stringify(tenders)); // 5 minutes
  
  return tenders;
}
```

### 3. Database Optimization

Optimize database queries:

```sql
-- Analyze query performance
EXPLAIN ANALYZE SELECT * FROM tenders WHERE source = 'rgukt' ORDER BY created_at DESC;

-- Create composite indexes
CREATE INDEX idx_tenders_source_created_at ON tenders(source, created_at DESC);

-- Partition large tables
CREATE TABLE tenders_2024 PARTITION OF tenders 
FOR VALUES FROM ('2024-01-01') TO ('2025-01-01');
```

## Security Hardening

### 1. API Security

Implement additional security measures:

```typescript
// API rate limiting per user
const userRateLimit = new Map();

export function checkUserRateLimit(userId: string) {
  const now = Date.now();
  const userLimits = userRateLimit.get(userId) || [];
  
  // Remove old entries
  const validLimits = userLimits.filter(time => now - time < 60000);
  
  if (validLimits.length >= 100) {
    throw new Error('Rate limit exceeded');
  }
  
  validLimits.push(now);
  userRateLimit.set(userId, validLimits);
}
```

### 2. Input Validation

Ensure all inputs are validated:

```typescript
// Comprehensive validation
import { z } from 'zod';

const apiInputSchema = z.object({
  email: z.string().email().toLowerCase(),
  amount: z.number().positive().max(1000000),
  planId: z.string().uuid(),
});

export function validateInput(data: unknown) {
  return apiInputSchema.parse(data);
}
```

### 3. Secret Management

Use secure secret management:

```typescript
// Rotate secrets regularly
const secrets = {
  jwt: process.env.JWT_SECRET,
  razorpay: process.env.RAZORPAY_KEY_SECRET,
  database: process.env.SUPABASE_SERVICE_ROLE_KEY,
};

// Validate secret strength
Object.entries(secrets).forEach(([key, value]) => {
  if (!value || value.length < 32) {
    throw new Error(`${key} secret is too weak`);
  }
});
```

## Backup and Recovery

### 1. Database Backups

Set up automated backups:

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="your_database"

# Create backup
pg_dump -h your-host -U backup_user -d $DB_NAME > "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Upload to cloud storage
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" "s3://your-backup-bucket/database/"

# Keep only last 30 days
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete
```

### 2. Application Backups

Backup application code and configurations:

```bash
# Backup configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env.production \
  next.config.js \
  package.json \
  database/schema.sql

# Upload to secure storage
aws s3 cp config_backup_$(date +%Y%m%d).tar.gz s3://your-config-bucket/
```

### 3. Disaster Recovery

Create disaster recovery plan:

```yaml
# disaster-recovery.yml
recovery_procedures:
  database_failure:
    - Restore from latest backup
    - Verify data integrity
    - Update DNS if needed
  
  application_failure:
    - Redeploy from Git
    - Restore environment variables
    - Verify all services
  
  complete_failure:
    - Provision new infrastructure
    - Restore database from backup
    - Redeploy application
    - Update DNS records
```

## Scaling Considerations

### 1. Horizontal Scaling

Prepare for scaling:

```typescript
// Load balancer configuration
const loadBalancer = {
  algorithm: 'round_robin',
  health_check: '/api/admin/health',
  instances: [
    'https://app1.yourdomain.com',
    'https://app2.yourdomain.com',
  ],
};

// Session storage (Redis)
const sessionStore = new RedisStore({
  client: redisClient,
  prefix: 'sess:',
  ttl: 86400, // 24 hours
});
```

### 2. Database Scaling

Scale database operations:

```sql
-- Read replicas for read-heavy operations
CREATE PUBLICATION tender_data_pub FOR ALL TABLES;

-- Partitioning for large tables
CREATE TABLE tenders_partitioned (
  LIKE tenders INCLUDING ALL
) PARTITION BY RANGE (created_at);
```

### 3. CDN and Static Assets

Configure CDN for global distribution:

```typescript
// Static asset optimization
const CDN_CONFIG = {
  images: {
    domains: ['cdn.yourdomain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  static: {
    maxAge: 86400, // 24 hours
    staleWhileRevalidate: 3600, // 1 hour
  },
};
```

## Post-Deployment Checklist

### 1. Functional Testing

- [ ] User registration and login
- [ ] Payment processing
- [ ] Subscription management
- [ ] Tender data retrieval
- [ ] Admin functions
- [ ] Email notifications

### 2. Performance Testing

- [ ] Load testing with realistic traffic
- [ ] Database performance under load
- [ ] Memory usage monitoring
- [ ] Response time optimization

### 3. Security Testing

- [ ] Vulnerability scanning
- [ ] Penetration testing
- [ ] SSL/TLS verification
- [ ] Rate limiting validation

### 4. Monitoring Setup

- [ ] Application metrics
- [ ] Database monitoring
- [ ] Error tracking
- [ ] Uptime monitoring
- [ ] Alert configuration

## Maintenance

### 1. Regular Updates

```bash
# Monthly maintenance script
#!/bin/bash

# Update dependencies
npm update

# Security audit
npm audit

# Database maintenance
psql -c "VACUUM ANALYZE;"
psql -c "REINDEX DATABASE your_database;"

# Log rotation
find /var/log -name "*.log" -mtime +30 -delete
```

### 2. Performance Monitoring

```sql
-- Weekly performance review
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
WHERE calls > 100
ORDER BY total_time DESC
LIMIT 20;
```

### 3. Security Updates

```bash
# Security update checklist
- [ ] Update all dependencies
- [ ] Rotate secrets quarterly
- [ ] Review access logs
- [ ] Update security policies
- [ ] Run security scans
```

## Troubleshooting

### Common Issues

1. **High Database Load**
   ```sql
   -- Identify slow queries
   SELECT query, mean_time, calls FROM pg_stat_statements 
   ORDER BY mean_time DESC LIMIT 10;
   ```

2. **Memory Issues**
   ```bash
   # Monitor memory usage
   free -h
   ps aux --sort=-%mem | head -10
   ```

3. **Payment Failures**
   ```typescript
   // Check payment logs
   const failedPayments = await logger.query({
     level: 'error',
     message: { $regex: /payment/ },
     timestamp: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
   });
   ```

### Emergency Procedures

1. **Database Emergency**
   ```bash
   # Immediate backup
   pg_dump -h host -U user database > emergency_backup.sql
   
   # Enable read-only mode
   ALTER DATABASE your_db SET default_transaction_read_only = on;
   ```

2. **Application Emergency**
   ```bash
   # Quick rollback
   vercel --prod --force
   
   # Enable maintenance mode
   echo "MAINTENANCE_MODE=true" >> .env.production
   ```

## Support

For deployment support:
- Documentation: https://docs.yourdomain.com
- Support: support@yourdomain.com
- Emergency: +1-xxx-xxx-xxxx