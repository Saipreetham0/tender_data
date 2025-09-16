# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests in CI mode (no watch, with coverage)
npm run test:ci

# Run specific test patterns
NODE_ENV=test npm run test -- --testPathPattern="src/lib/__tests__" --passWithNoTests
```

### Database Operations
```bash
# Test database connection and table accessibility
NODE_ENV=development node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('subscriptions').select('count(*)').limit(1).then(({data, error}) => {
  if (error) {
    console.log('Table check error:', error.message);
  } else {
    console.log('Table exists and accessible');
  }
}).catch(e => console.log('Connection error:', e.message));
"

# Run admin setup scripts
node scripts/setup-admin-system.js
node scripts/create-admin-role.js
node scripts/diagnose-auth-issues.js
```

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript with strict mode
- **Database**: PostgreSQL via Supabase with Row Level Security (RLS)
- **Authentication**: Custom JWT + Supabase Auth with role-based access control
- **Payments**: Razorpay integration with webhook validation
- **UI**: React with Tailwind CSS and Radix UI components
- **Testing**: Jest with Testing Library

### Key Application Structure

#### Authentication System
- **JWT-based**: Custom JWT authentication in `src/lib/auth-jwt.ts`
- **Admin Auth**: Separate admin authentication system in `src/lib/admin-auth.ts`
- **Role-based**: User roles (user, admin) with permissions system
- **Session Management**: JWT token management with refresh tokens

#### Subscription Management
- **Multi-tier Plans**: Subscription plans with automated billing
- **Payment Processing**: Secure Razorpay integration with webhook validation
- **Access Control**: Subscription-based feature access via `SubscriptionGate` component

#### Database Architecture
- **PostgreSQL Schema**: Comprehensive schema in `database/schema.sql`
- **Row Level Security**: Database-level security policies
- **Audit Logging**: Complete activity and security event tracking
- **Indexing**: Optimized database indexes for performance

#### API Structure
- **Route Groups**: Organized API routes in `src/app/api/`
- **Admin APIs**: Protected admin endpoints under `/api/admin/`
- **Validation**: Zod schema validation for all inputs
- **Rate Limiting**: Configurable rate limits per endpoint

### Security Features
- **Input Validation**: Comprehensive validation using Zod schemas in `src/lib/validation.ts`
- **Payment Security**: Webhook validation and fraud prevention in `src/lib/payment-security.ts`
- **Secret Management**: Secure secret handling in `src/lib/secrets.ts`
- **Monitoring**: Security event tracking and logging

### Component Architecture
- **UI Components**: Reusable components in `src/components/ui/`
- **Admin Components**: Admin-specific components in `src/components/admin/`
- **Dashboard**: Main dashboard components in `src/components/Dashboard/`
- **Subscription**: Subscription management components in `src/components/subscription/`

### Data Scrapers
- **Direct Scrapers**: Web scraping functionality in `src/lib/direct-scrapers.ts`
- **Robust Scraping**: Enhanced with retry logic in `src/lib/scraper-utils.ts`
- **Fallback System**: Graceful degradation in `src/lib/scraper-fallback.ts`
- **SKLM Alternative**: Simple HTML scraper in `src/lib/sklm-simple-scraper.ts`
- **Tender Sources**: Multiple tender data sources (basar, ongole, rkvalley, sklm, nuzvidu)
- **Redis Caching**: All scraper routes now use Redis for 15-minute caching
- **Automated Collection**: Scheduled data collection with comprehensive error handling and recovery

## Development Patterns

### Testing Strategy
- **High Coverage**: Maintains >70% test coverage across branches, functions, lines, statements
- **Security Testing**: Comprehensive tests for auth, payment, and validation systems
- **Test Location**: Tests in `src/lib/__tests__/` directory
- **Test Configuration**: Custom Jest config with Next.js integration

### Error Handling
- **Global Error Boundary**: Application-wide error handling
- **API Error Responses**: Standardized error responses
- **Logging System**: Structured logging in `src/lib/logger.ts`
- **Monitoring**: Application monitoring in `src/lib/monitoring.ts`

### Environment Management
- **Environment Validation**: Validates required environment variables
- **Development vs Production**: Different configurations for each environment
- **Secret Handling**: Secure management of API keys and secrets

## Important Files and Directories

### Core Library Files
- `src/lib/auth-jwt.ts` - JWT authentication and user management
- `src/lib/admin-auth.ts` - Admin authentication and permissions
- `src/lib/validation.ts` - Input validation schemas
- `src/lib/payment-security.ts` - Payment processing security
- `src/lib/subscription.ts` - Subscription management logic
- `src/lib/supabase.ts` - Database client configuration
- `src/lib/redis.ts` - Redis client and caching utilities
- `src/lib/rate-limiter.ts` - Redis-based rate limiting
- `src/lib/session-cache.ts` - Session and subscription caching

### Database
- `database/schema.sql` - Complete database schema with RLS policies
- `database/` directory contains migration files and setup scripts

### Configuration
- `jest.config.js` - Test configuration with coverage thresholds
- `next.config.mjs` - Next.js configuration
- `tsconfig.json` - TypeScript configuration with strict mode
- `tailwind.config.ts` - Tailwind CSS configuration

### Scripts
- `scripts/` directory contains utility scripts for admin setup and diagnostics

## Performance and Production

### Build Process
- **Production Build**: Optimized builds with environment validation
- **Type Checking**: Strict TypeScript checking
- **Linting**: ESLint configuration for code quality

### Deployment
- **Environment Variables**: Comprehensive environment variable management
- **Database Migration**: SQL schema deployment
- **Health Checks**: System health monitoring endpoints
- **Monitoring**: Application metrics and logging

## Common Tasks

When working with this codebase:

1. **Run tests after changes**: Always run `npm test` before committing
2. **Check types**: Ensure TypeScript compilation with `npm run build`
3. **Database changes**: Update `database/schema.sql` for schema changes
4. **API changes**: Update validation schemas in `src/lib/validation.ts`
5. **Authentication**: Use the established JWT system, don't create new auth methods
6. **Admin features**: Use the admin authentication system for admin-only features
7. **Payments**: Follow the secure payment processing patterns in payment-security.ts