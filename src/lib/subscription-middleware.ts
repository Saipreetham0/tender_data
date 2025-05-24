// src/lib/subscription-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { getUserSubscription, checkUsageLimit } from './subscription';

export async function subscriptionMiddleware(
  request: NextRequest,
  email: string,
  requiredFeature?: string,
  usageType?: 'tender_views' | 'api_calls' | 'exports'
) {
  try {
    // Check if user has required subscription
    if (requiredFeature) {
      // This would need to be implemented based on your subscription logic
      const subscription = await getUserSubscription(email);

      if (!subscription || subscription.status !== 'active') {
        return NextResponse.json(
          {
            success: false,
            error: 'Premium subscription required',
            code: 'SUBSCRIPTION_REQUIRED'
          },
          { status: 403 }
        );
      }
    }

    // Check usage limits
    if (usageType) {
      const usage = await checkUsageLimit(email, usageType);

      if (!usage.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Usage limit exceeded. Current: ${usage.currentUsage}${usage.limit ? `/${usage.limit}` : ''}`,
            code: 'USAGE_LIMIT_EXCEEDED',
            currentUsage: usage.currentUsage,
            limit: usage.limit
          },
          { status: 429 }
        );
      }
    }

    return null; // Continue processing
  } catch (error) {
    console.error('Subscription middleware error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to verify subscription'
      },
      { status: 500 }
    );
  }
}


