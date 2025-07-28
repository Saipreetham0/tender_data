# RGUKT Tenders SaaS Platform - API Documentation

## Overview

The RGUKT Tenders SaaS Platform provides a comprehensive REST API for managing tender data, subscriptions, payments, and administrative functions. This documentation covers all available endpoints, authentication methods, and integration patterns.

**Base URL**: `https://your-domain.com/api`  
**Version**: 1.0  
**Last Updated**: January 2025

---

## Table of Contents

1. [Authentication](#authentication)
2. [Tender APIs](#tender-apis)
3. [Subscription Management](#subscription-management)
4. [Payment APIs](#payment-apis)
5. [Email Subscription APIs](#email-subscription-apis)
6. [Admin APIs](#admin-apis)
7. [Cron & Automation APIs](#cron--automation-apis)
8. [Testing & Utility APIs](#testing--utility-apis)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Webhooks](#webhooks)

---

## Authentication

The API uses multiple authentication methods depending on the endpoint:

### 1. Public Endpoints (No Authentication)
- Tender data endpoints
- Subscription plans
- Email subscription (POST)

### 2. API Key Authentication
Used for admin and cron endpoints.

**Header**: `?key=YOUR_API_KEY`  
**Environment Variable**: `CRON_API_SECRET_KEY`

```bash
curl "https://your-domain.com/api/admin/health?key=your-secret-key"
```

### 3. Email-based Authentication
Used for subscription management endpoints.

**Parameter**: `email` (query parameter)

### 4. Token-based Authentication
Used for email unsubscribe functionality.

**Parameter**: `token` (query parameter)

---

## Tender APIs

### Overview
These endpoints provide access to tender data from different RGUKT university campuses through web scraping.

### Base Path: `/api/tenders`

#### 1. Get RGUKT Main Campus Tenders

```http
GET /api/tenders/rgukt
```

**Description**: Scrapes and returns tender data from RGUKT main campus.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "Supply of Laboratory Equipment",
      "postedDate": "15-01-2025",
      "closingDate": "30-01-2025",
      "downloadLinks": [
        {
          "url": "https://example.com/tender.pdf",
          "text": "Download Tender Document"
        }
      ],
      "source": "RGUKT Main"
    }
  ],
  "totalTenders": 25,
  "lastUpdated": "2025-01-27T10:30:00Z"
}
```

#### 2. Get RK Valley Campus Tenders

```http
GET /api/tenders/rkvalley
```

**Description**: Scrapes and returns tender data from RGUKT RK Valley campus.

#### 3. Get Ongole Campus Tenders

```http
GET /api/tenders/ongole
```

**Description**: Scrapes and returns tender data from RGUKT Ongole campus.

#### 4. Get Basar Campus Tenders

```http
GET /api/tenders/basar
```

**Description**: Scrapes and returns tender data from RGUKT Basar campus.

#### 5. Get Srikakulam Campus Tenders

```http
GET /api/tenders/sklm
```

**Description**: Scrapes and returns tender data from RGUKT Srikakulam campus with pagination support.

**Query Parameters**:
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response** (includes pagination):
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalTenders": 47,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Subscription Management

### Base Path: `/api/subscription`

#### 1. Get Subscription Plans

```http
GET /api/subscription/plans
```

**Description**: Returns all available subscription plans.

**Response**:
```json
{
  "success": true,
  "plans": [
    {
      "id": "basic-monthly",
      "name": "Basic Plan",
      "description": "Access to all tender data",
      "price": 299,
      "currency": "INR",
      "duration": "monthly",
      "features": [
        "All campus tender access",
        "Email notifications",
        "Search and filter"
      ]
    }
  ]
}
```

#### 2. Get Current Subscription

```http
GET /api/subscription/current?email=user@example.com
```

**Description**: Returns current subscription details for a user.

**Query Parameters**:
- `email` (required): User email address

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": "sub_123",
    "plan": {
      "name": "Premium Plan",
      "price": 499
    },
    "status": "active",
    "startDate": "2025-01-01",
    "endDate": "2025-02-01",
    "autoRenew": true
  }
}
```

#### 3. Get Subscription History

```http
GET /api/subscription/history?email=user@example.com&limit=10
```

**Description**: Returns payment and subscription history for a user.

**Query Parameters**:
- `email` (required): User email address
- `limit` (optional): Number of records to return (default: 10)

#### 4. Cancel Subscription

```http
POST /api/subscription/cancel
```

**Description**: Cancels a user's subscription.

**Request Body**:
```json
{
  "subscriptionId": "sub_123",
  "userEmail": "user@example.com"
}
```

#### 5. Extend Subscription (Admin Only)

```http
POST /api/subscription/extend?key=your-api-key
```

**Description**: Extends a subscription (admin only).

**Request Body**:
```json
{
  "subscriptionId": "sub_123",
  "userEmail": "user@example.com",
  "months": 3
}
```

---

## Payment APIs

### Base Path: `/api/payment`

#### 1. Create Payment Order

```http
POST /api/payment/create-order
```

**Description**: Creates a Razorpay payment order for subscription.

**Request Body**:
```json
{
  "planId": "premium-monthly",
  "subscriptionType": "monthly",
  "userEmail": "user@example.com",
  "userId": "user_123"
}
```

**Response**:
```json
{
  "success": true,
  "order": {
    "id": "order_123",
    "amount": 49900,
    "currency": "INR",
    "status": "created"
  },
  "key": "rzp_test_123",
  "planDetails": {
    "name": "Premium Plan",
    "price": 499
  }
}
```

#### 2. Verify Payment

```http
POST /api/payment/verify
```

**Description**: Verifies payment and activates subscription.

**Request Body**:
```json
{
  "razorpay_order_id": "order_123",
  "razorpay_payment_id": "pay_123",
  "razorpay_signature": "signature_hash",
  "planId": "premium-monthly",
  "userEmail": "user@example.com",
  "subscriptionType": "monthly"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Payment verified and subscription activated",
  "subscription": {
    "id": "sub_123",
    "status": "active",
    "startDate": "2025-01-27",
    "endDate": "2025-02-27"
  }
}
```

---

## Email Subscription APIs

### Base Path: `/api/subscribe`

#### 1. Subscribe to Email Notifications

```http
POST /api/subscribe
```

**Description**: Subscribe users to email notifications for tender updates.

**Request Body**:
```json
{
  "email": "user@example.com",
  "campus": "rgukt"
}
```

**Campus Options**:
- `rgukt` - RGUKT Main
- `rkvalley` - RK Valley
- `ongole` - Ongole
- `basar` - Basar
- `sklm` - Srikakulam
- `all` - All campuses

**Response**:
```json
{
  "success": true,
  "message": "Successfully subscribed to RGUKT Main notifications",
  "subscription": {
    "email": "user@example.com",
    "campus": "rgukt",
    "status": "active"
  }
}
```

#### 2. Unsubscribe from Email Notifications

```http
GET /api/subscribe?token=unsubscribe_token_123
```

**Description**: Unsubscribe users via token-based link (typically from email).

**Query Parameters**:
- `token` (required): Unsubscribe token from email

---

## Admin APIs

### Base Path: `/api/admin`

#### 1. System Health Check

```http
GET /api/admin/health?key=your-api-key
```

**Description**: Comprehensive system health check including database, subscriptions, and performance metrics.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-01-27T10:30:00Z",
  "checks": {
    "database": {
      "status": "healthy",
      "responseTime": 25
    },
    "subscriptions": {
      "total": 150,
      "active": 142,
      "expired": 8
    },
    "system": {
      "uptime": "72h 15m",
      "memory": "512MB",
      "nodeVersion": "18.17.0"
    }
  }
}
```

#### 2. System Statistics

```http
GET /api/admin/stats?key=your-api-key
```

**Description**: Detailed system statistics including user metrics, tender data, and usage analytics.

**Response**:
```json
{
  "success": true,
  "stats": {
    "subscriptions": {
      "total": 150,
      "active": 142,
      "byPlan": {
        "basic": 85,
        "premium": 57
      }
    },
    "tenders": {
      "total": 1250,
      "bySource": {
        "RGUKT Main": 320,
        "RK Valley": 280
      }
    },
    "usage": {
      "apiCalls": 15420,
      "emailsSent": 2340
    }
  }
}
```

#### 3. Database Cleanup

```http
POST /api/admin/cleanup?key=your-api-key
```

**Description**: Clean up old records from database (cron logs, usage data, etc.).

**Request Body**:
```json
{
  "days": 30
}
```

**Response**:
```json
{
  "success": true,
  "message": "Database cleanup completed",
  "deleted": {
    "cronLogs": 1250,
    "usageData": 3420,
    "subscriptionEvents": 680
  }
}
```

#### 4. Process Expired Subscriptions

```http
GET /api/admin/expire-subscriptions?key=your-api-key
```

**Description**: Process and update expired subscriptions.

**Response**:
```json
{
  "success": true,
  "message": "Processed 8 expired subscriptions",
  "processed": 8,
  "updated": 8
}
```

#### 5. Test Subscription Expiry

```http
GET /api/admin/test-expire?key=your-api-key
```

**Description**: Test subscription expiry logic without updating data.

**Response**:
```json
{
  "success": true,
  "expiredSubscriptions": [
    {
      "id": "sub_123",
      "userEmail": "user@example.com",
      "endDate": "2025-01-25"
    }
  ],
  "expiringIn7Days": [
    {
      "id": "sub_456",
      "userEmail": "user2@example.com",
      "endDate": "2025-02-03"
    }
  ]
}
```

---

## Cron & Automation APIs

### Base Path: `/api`

#### 1. Main Cron Job

```http
GET /api/cron?key=your-api-key
```

**Description**: Main automated job for scraping tender data from all campuses and sending notifications.

**Rate Limiting**: Minimum 5-minute interval between executions.

**Response**:
```json
{
  "success": true,
  "message": "Tenders scraping and update job completed successfully",
  "timestamp": "2025-01-27T10:30:00Z",
  "results": [
    {
      "campus": {
        "id": "rgukt",
        "name": "RGUKT Main"
      },
      "success": true,
      "tendersCount": 25,
      "newTendersCount": 3,
      "duration": 2450
    }
  ]
}
```

#### 2. Cron Status

```http
GET /api/cron-status?key=your-api-key
```

**Description**: Get status and recent execution logs of cron jobs.

**Response**:
```json
{
  "success": true,
  "status": "working",
  "lastExecution": "2025-01-27T09:00:00Z",
  "recentLogs": [
    {
      "timestamp": "2025-01-27T09:00:00Z",
      "status": "completed",
      "message": "Job completed successfully",
      "duration": 12500
    }
  ]
}
```

---

## Testing & Utility APIs

### Base Path: `/api`

#### 1. Test Email System

```http
GET /api/test-email?key=your-api-key
```

**Description**: Test email delivery system with system information.

**Response**:
```json
{
  "success": true,
  "message": "Test email sent successfully",
  "recipient": "admin@yourdomain.com",
  "timestamp": "2025-01-27T10:30:00Z"
}
```

#### 2. Test Tender Notifications

```http
GET /api/test-tender-notification?key=your-api-key
```

**Description**: Test tender notification system with sample data.

**Response**:
```json
{
  "success": true,
  "message": "Test tender notification sent successfully",
  "sampleTenders": 3,
  "notificationsSent": 15
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "success": false,
  "error": "Error message description",
  "code": "ERROR_CODE",
  "timestamp": "2025-01-27T10:30:00Z",
  "details": {
    "field": "Additional error details"
  }
}
```

### Common HTTP Status Codes

- `200` - Success
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (invalid or missing authentication)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `429` - Too Many Requests (rate limiting)
- `500` - Internal Server Error

### Error Codes

- `VALIDATION_ERROR` - Input validation failed
- `AUTHENTICATION_ERROR` - Invalid or missing authentication
- `PAYMENT_ERROR` - Payment processing failed
- `DATABASE_ERROR` - Database operation failed
- `EXTERNAL_SERVICE_ERROR` - External service (Razorpay, Resend) error
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

---

## Rate Limiting

### Current Implementation

- **Cron Endpoint**: 5-minute minimum interval between executions
- **Other Endpoints**: No rate limiting implemented

### Recommended Limits (for future implementation)

- **Public APIs**: 100 requests/hour per IP
- **Authenticated APIs**: 1000 requests/hour per user
- **Admin APIs**: 10000 requests/hour

---

## Webhooks

### Razorpay Webhooks

The platform handles Razorpay webhooks for payment processing. Configure your Razorpay webhook endpoint to:

**Endpoint**: `https://your-domain.com/api/payment/webhook`  
**Events**: `payment.captured`, `payment.failed`, `subscription.completed`

---

## SDKs and Examples

### JavaScript/Node.js Example

```javascript
// Subscribe to email notifications
const response = await fetch('/api/subscribe', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: 'user@example.com',
    campus: 'rgukt'
  })
});

const result = await response.json();
console.log(result);
```

### curl Examples

```bash
# Get tender data
curl "https://your-domain.com/api/tenders/rgukt"

# Create payment order
curl -X POST "https://your-domain.com/api/payment/create-order" \
  -H "Content-Type: application/json" \
  -d '{
    "planId": "premium-monthly",
    "subscriptionType": "monthly",
    "userEmail": "user@example.com"
  }'

# Admin health check
curl "https://your-domain.com/api/admin/health?key=your-secret-key"
```

---

## Development & Testing

### Environment Variables Required

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Authentication
JWT_SECRET=your-jwt-secret

# Payment
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Email
RESEND_API_KEY=your-resend-api-key

# API Security
CRON_API_SECRET_KEY=your-secret-key
```

### Testing Endpoints

Use the testing endpoints to verify system functionality:

1. Test email delivery: `/api/test-email`
2. Test notifications: `/api/test-tender-notification`
3. Health check: `/api/admin/health`
4. Cron status: `/api/cron-status`

---

## Support & Contact

For API support, integration help, or bug reports:

- **Email**: api-support@yourdomain.com
- **Documentation**: https://docs.yourdomain.com
- **Status Page**: https://status.yourdomain.com

---

*Last updated: January 2025*  
*API Version: 1.0*