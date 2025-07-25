# API Documentation

## Overview

This document describes the REST API endpoints for the Tender Data SaaS application. The API provides access to tender information, user management, subscription handling, and payment processing.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://tender-data.vercel.app/api`

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Admin API Key Authentication

Some admin endpoints also accept API key authentication via query parameter:

```
GET /api/admin/health?key=<your-api-key>
```

## Rate Limiting

API endpoints are rate-limited to prevent abuse:

- **Auth endpoints**: 5 requests per minute
- **Payment endpoints**: 10 requests per minute  
- **Admin endpoints**: 20 requests per minute
- **Tender endpoints**: 30 requests per minute
- **General API**: 100 requests per minute

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in current window
- `X-RateLimit-Reset`: When the rate limit resets

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

Common HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `429` - Rate Limit Exceeded
- `500` - Internal Server Error

## Endpoints

### Authentication

#### Login
```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "role": "user"
  }
}
```

#### Register
```
POST /api/auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "organization": "Company Inc"
}
```

#### Logout
```
POST /api/auth/logout
```

**Headers:** `Authorization: Bearer <token>`

### User Management

#### Get Current User
```
GET /api/user/profile
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe",
    "organization": "Company Inc",
    "subscription": {
      "status": "active",
      "plan": "pro",
      "expiresAt": "2024-12-31T23:59:59.000Z"
    }
  }
}
```

#### Update User Profile
```
PUT /api/user/profile
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "fullName": "John Smith",
  "organization": "New Company",
  "phone": "+1234567890"
}
```

### Subscription Management

#### Get Subscription Plans
```
GET /api/subscription/plans
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan-id",
      "name": "Basic",
      "description": "Basic access to tenders",
      "priceMonthly": 299.00,
      "priceYearly": 2999.00,
      "features": ["Access to basic tenders", "Email notifications"]
    }
  ]
}
```

#### Get Current Subscription
```
GET /api/subscription/current
```

**Headers:** `Authorization: Bearer <token>`

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub-id",
    "planId": "plan-id",
    "status": "active",
    "type": "monthly",
    "expiresAt": "2024-12-31T23:59:59.000Z",
    "autoRenew": true
  }
}
```

#### Cancel Subscription
```
POST /api/subscription/cancel
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "reason": "Too expensive"
}
```

### Payment Processing

#### Create Payment Order
```
POST /api/payment/create-order
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "planId": "plan-id",
  "type": "monthly",
  "userEmail": "user@example.com",
  "amount": 299.00,
  "currency": "INR"
}
```

**Response:**
```json
{
  "success": true,
  "order": {
    "id": "order-id",
    "razorpayOrderId": "order_razorpay_id",
    "amount": 299.00,
    "currency": "INR",
    "keyId": "rzp_test_key_id"
  }
}
```

#### Verify Payment
```
POST /api/payment/verify
```

**Headers:** `Authorization: Bearer <token>`

**Body:**
```json
{
  "razorpay_order_id": "order_razorpay_id",
  "razorpay_payment_id": "pay_razorpay_id", 
  "razorpay_signature": "signature",
  "userEmail": "user@example.com"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub-id",
    "status": "active",
    "expiresAt": "2024-12-31T23:59:59.000Z"
  }
}
```

### Tender Data

#### Get Tenders by Source
```
GET /api/tenders/{source}
```

**Parameters:**
- `source`: One of `rgukt`, `rkvalley`, `basar`, `ongole`, `sklm`

**Query Parameters:**
- `limit`: Number of results (default: 50, max: 100)
- `offset`: Pagination offset (default: 0)
- `startDate`: ISO date string
- `endDate`: ISO date string

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Tender Name",
      "postedDate": "2024-01-01T00:00:00.000Z",
      "closingDate": "2024-01-31T23:59:59.000Z",
      "downloadLinks": [
        {
          "text": "Download PDF",
          "url": "https://example.com/tender.pdf"
        }
      ],
      "source": "rgukt"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150,
    "hasMore": true
  }
}
```

#### Search Tenders
```
GET /api/tenders/search
```

**Query Parameters:**
- `q`: Search query
- `source`: Filter by source
- `category`: Filter by category
- `limit`: Number of results
- `offset`: Pagination offset

### Admin Endpoints

#### System Health Check
```
GET /api/admin/health?key=<api-key>
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600000,
  "version": "1.0.0",
  "environment": "production",
  "checks": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 45
    },
    {
      "name": "payment_provider",
      "status": "healthy", 
      "responseTime": 120
    }
  ]
}
```

#### Get System Statistics
```
GET /api/admin/stats?key=<api-key>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalUsers": 1250,
    "activeSubscriptions": 450,
    "totalRevenue": 125000.00,
    "recentSignups": 25,
    "planDistribution": {
      "Basic": 200,
      "Pro": 200,
      "Enterprise": 50
    }
  }
}
```

#### Expire Subscriptions (Cron)
```
POST /api/admin/expire-subscriptions?key=<api-key>
```

**Response:**
```json
{
  "success": true,
  "expired": 5,
  "notified": 3,
  "message": "Processed 5 expired subscriptions"
}
```

#### Manual Cron Trigger
```
POST /api/cron?key=<api-key>
```

**Body:**
```json
{
  "jobName": "tender-scraper",
  "source": "rgukt",
  "force": false
}
```

### Webhook Endpoints

#### Razorpay Webhook
```
POST /api/webhooks/razorpay
```

**Headers:**
- `X-Razorpay-Signature`: Webhook signature

**Body:** Razorpay webhook payload

## Data Models

### User
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  organization?: string;
  phone?: string;
  role: 'user' | 'admin';
  subscriptionStatus: 'active' | 'inactive' | 'cancelled' | 'expired';
  createdAt: string;
  updatedAt: string;
}
```

### Subscription Plan
```typescript
interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  isActive: boolean;
}
```

### Tender
```typescript
interface Tender {
  name: string;
  postedDate: string;
  closingDate: string;
  downloadLinks: Array<{
    text: string;
    url: string;
  }>;
  source: string;
  description?: string;
  organization?: string;
  category?: string;
  estimatedValue?: number;
  location?: string;
}
```

### Payment Order
```typescript
interface PaymentOrder {
  id: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  status: 'created' | 'attempted' | 'paid' | 'failed' | 'expired';
  userEmail: string;
  planId: string;
  expiresAt: string;
}
```

## Security

### Input Validation

All API endpoints validate input using Zod schemas:
- Email addresses are validated and normalized
- Passwords must meet strength requirements
- UUIDs are validated for format
- Amounts are validated as positive numbers
- Enum values are strictly validated

### Rate Limiting

Rate limiting is enforced at the middleware level with different limits for different endpoint types. Clients receive appropriate headers and error responses when limits are exceeded.

### Authentication

JWT tokens are used for user authentication with:
- 24-hour expiration
- Secure signing with HMAC-SHA256
- Proper audience and issuer validation
- Automatic token refresh capabilities

### Authorization

Role-based access control:
- Users can only access their own data
- Admin endpoints require admin role
- Database RLS policies enforce data isolation
- API key authentication for system endpoints

### Payment Security

Payment processing includes:
- Webhook signature validation
- Payment amount verification
- Replay attack prevention
- Secure order validation
- Audit logging for all transactions

## SDKs and Libraries

### JavaScript/TypeScript
```typescript
import { TenderDataAPI } from '@tender-data/sdk';

const api = new TenderDataAPI({
  baseUrl: 'https://tender-data.vercel.app/api',
  apiKey: 'your-api-key'
});

// Get tenders
const tenders = await api.tenders.getBySource('rgukt');

// Create subscription
const subscription = await api.subscriptions.create({
  planId: 'plan-id',
  type: 'monthly'
});
```

### cURL Examples

```bash
# Get tenders
curl -X GET "https://tender-data.vercel.app/api/tenders/rgukt" \
  -H "Authorization: Bearer your-jwt-token"

# Create payment order
curl -X POST "https://tender-data.vercel.app/api/payment/create-order" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "plan-id",
    "type": "monthly",
    "userEmail": "user@example.com",
    "amount": 299.00
  }'
```

## Changelog

### Version 1.0.0 (2024-01-01)
- Initial API release
- JWT authentication
- Subscription management
- Payment processing
- Tender data endpoints
- Admin functionality
- Comprehensive security features

## Support

For API support and questions:
- Email: support@tender-data.com
- Documentation: https://docs.tender-data.com
- GitHub Issues: https://github.com/tender-data/api/issues