// // src/lib/subscription-middleware.ts
// import { NextRequest, NextResponse } from 'next/server';
// import { getUserSubscription, checkUsageLimit } from './subscription';

// export async function subscriptionMiddleware(
//   request: NextRequest,
//   email: string,
//   requiredFeature?: string,
//   usageType?: 'tender_views' | 'api_calls' | 'exports'
// ) {
//   try {
//     // Check if user has required subscription
//     if (requiredFeature) {
//       // This would need to be implemented based on your subscription logic
//       const subscription = await getUserSubscription(email);

//       if (!subscription || subscription.status !== 'active') {
//         return NextResponse.json(
//           {
//             success: false,
//             error: 'Premium subscription required',
//             code: 'SUBSCRIPTION_REQUIRED'
//           },
//           { status: 403 }
//         );
//       }
//     }

//     // Check usage limits
//     if (usageType) {
//       const usage = await checkUsageLimit(email, usageType);

//       if (!usage.allowed) {
//         return NextResponse.json(
//           {
//             success: false,
//             error: `Usage limit exceeded. Current: ${usage.currentUsage}${usage.limit ? `/${usage.limit}` : ''}`,
//             code: 'USAGE_LIMIT_EXCEEDED',
//             currentUsage: usage.currentUsage,
//             limit: usage.limit
//           },
//           { status: 429 }
//         );
//       }
//     }

//     return null; // Continue processing
//   } catch (error) {
//     console.error('Subscription middleware error:', error);
//     return NextResponse.json(
//       {
//         success: false,
//         error: 'Failed to verify subscription'
//       },
//       { status: 500 }
//     );
//   }
// }


// src/lib/subscription-middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { RazorpaySubscriptionService } from './razorpay-service';
import { supabase } from './supabase';

export interface SubscriptionMiddlewareOptions {
  requiredFeature?: 'filters' | 'keyword_filter' | 'advanced_filters' | 'api' | 'all_colleges' | 'realtime_alerts';
  usageType?: 'tender_views' | 'api_calls' | 'exports';
  checkUsageLimit?: boolean;
  requireActiveSubscription?: boolean;
}

export interface Subscription {
  status: string;
  college_preferences?: string[];
}

export interface MiddlewareResult {
  allowed: boolean;
  error?: string;
  code?: string;
  usage?: {
    currentUsage: number;
    limit?: number;
    allowed: boolean;
  };
  subscription?: Subscription;
}

/**
 * Advanced subscription middleware for protecting API routes and features
 */
export class SubscriptionMiddleware {

  /**
   * Check subscription access for a user
   */
  static async checkAccess(
    userEmail: string,
    options: SubscriptionMiddlewareOptions = {}
  ): Promise<MiddlewareResult> {
    try {
      const {
        requiredFeature,
        usageType,
        checkUsageLimit = true,
        requireActiveSubscription = false
      } = options;

      // Get user's current subscription
      const subscription = await RazorpaySubscriptionService.getCurrentSubscription(userEmail);

      // Check if active subscription is required
      if (requireActiveSubscription && (!subscription || subscription.status !== 'active')) {
        return {
          allowed: false,
          error: 'Active subscription required',
          code: 'SUBSCRIPTION_REQUIRED'
        };
      }

      // Check feature access if specified
      if (requiredFeature) {
        const hasFeatureAccess = await RazorpaySubscriptionService.canAccessFeature(
          userEmail,
          requiredFeature
        );

        if (!hasFeatureAccess) {
          return {
            allowed: false,
            error: `Feature '${requiredFeature}' requires a premium subscription`,
            code: 'FEATURE_ACCESS_DENIED',
            subscription
          };
        }
      }

      // Check usage limits if specified
      if (usageType && checkUsageLimit) {
        const usage = await this.checkUsageLimit(userEmail, usageType, subscription);

        if (!usage.allowed) {
          return {
            allowed: false,
            error: `Usage limit exceeded for ${usageType}`,
            code: 'USAGE_LIMIT_EXCEEDED',
            usage,
            subscription
          };
        }

        return {
          allowed: true,
          usage,
          subscription
        };
      }

      return {
        allowed: true,
        subscription
      };

    } catch (error) {
      console.error('Subscription middleware error:', error);
      return {
        allowed: false,
        error: 'Failed to verify subscription access',
        code: 'MIDDLEWARE_ERROR'
      };
    }
  }

  /**
   * Check and enforce usage limits
   */
  private static async checkUsageLimit(
    userEmail: string,
    usageType: 'tender_views' | 'api_calls' | 'exports',
    subscription?: Subscription
  ) {
    const today = new Date().toISOString().split('T')[0];

    // Get current usage
    interface Usage {
      tender_views?: number;
      api_calls?: number;
      exports?: number;
    }

    const { data: usage } = await supabase
      .from('user_usage')
      .select(usageType)
      .eq('user_email', userEmail)
      .eq('date', today)
      .single();

    const currentUsage = (usage as Usage)?.[usageType] || 0;

    // If user has active subscription, allow unlimited usage
    if (subscription && subscription.status === 'active') {
      return {
        allowed: true,
        currentUsage,
        limit: undefined // Unlimited for paid users
      };
    }

    // Free tier limits
    const limits = {
      tender_views: 10,
      api_calls: 5,
      exports: 2
    };

    const limit = limits[usageType];
    const allowed = currentUsage < limit;

    return {
      allowed,
      currentUsage,
      limit
    };
  }

  /**
   * Track usage after successful API call
   */
  static async trackUsage(
    userEmail: string,
    usageType: 'tender_views' | 'api_calls' | 'exports'
  ): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Use PostgreSQL's ON CONFLICT to handle concurrent requests
      const { error } = await supabase.rpc('increment_user_usage', {
        p_user_email: userEmail,
        p_date: today,
        p_usage_type: usageType
      });

      if (error) {
        // Fallback to upsert if the function doesn't exist
        await supabase
          .from('user_usage')
          .upsert({
            user_email: userEmail,
            date: today,
            [usageType]: 1
          }, {
            onConflict: 'user_email,date',
            ignoreDuplicates: false
          });
      }
    } catch (error) {
      console.error('Error tracking usage:', error);
      // Don't throw - usage tracking failure shouldn't break the API
    }
  }

  /**
   * Create middleware function for Next.js API routes
   */
  static createApiMiddleware(options: SubscriptionMiddlewareOptions) {
    return async (request: NextRequest, userEmail: string): Promise<NextResponse | null> => {
      const result = await this.checkAccess(userEmail, options);

      if (!result.allowed) {
        const status = result.code === 'USAGE_LIMIT_EXCEEDED' ? 429 :
                      result.code === 'SUBSCRIPTION_REQUIRED' ? 402 : 403;

        return NextResponse.json(
          {
            success: false,
            error: result.error,
            code: result.code,
            ...(result.usage && { usage: result.usage }),
            ...(result.subscription && { subscription: result.subscription })
          },
          { status }
        );
      }

      // Track usage if specified
      if (options.usageType) {
        // Don't await - track in background
        this.trackUsage(userEmail, options.usageType).catch(console.error);
      }

      return null; // Continue processing
    };
  }

  /**
   * Get user's current usage stats
   */
  static async getUserUsageStats(userEmail: string, days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_email', userEmail)
        .gte('date', startDate.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      // Aggregate stats
      const stats = {
        totalTenderViews: 0,
        totalApiCalls: 0,
        totalExports: 0,
        dailyUsage: data || []
      };

      data?.forEach(day => {
        stats.totalTenderViews += day.tender_views || 0;
        stats.totalApiCalls += day.api_calls || 0;
        stats.totalExports += day.exports || 0;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching usage stats:', error);
      return null;
    }
  }

  /**
   * Check if user can access multiple colleges
   */
  static async canAccessMultipleColleges(userEmail: string): Promise<boolean> {
    return await RazorpaySubscriptionService.canAccessFeature(userEmail, 'all_colleges');
  }

  /**
   * Check if user has real-time alerts
   */
  static async hasRealTimeAlerts(userEmail: string): Promise<boolean> {
    return await RazorpaySubscriptionService.canAccessFeature(userEmail, 'realtime_alerts');
  }

  /**
   * Get user's allowed colleges based on subscription
   */
  static async getAllowedColleges(userEmail: string): Promise<string[]> {
    const canAccessAll = await this.canAccessMultipleColleges(userEmail);

    if (canAccessAll) {
      return ['all', 'rgukt', 'rkvalley', 'ongole', 'basar', 'sklm'];
    }

    // Free tier - get user's preferred college from their subscription or default to first one
    const subscription = await RazorpaySubscriptionService.getCurrentSubscription(userEmail);
    const preferences = subscription?.college_preferences || ['rgukt'];

    return preferences.slice(0, 1); // Only first college for free tier
  }
}

// Create database function for atomic usage increment
export const createUsageIncrementFunction = `
CREATE OR REPLACE FUNCTION increment_user_usage(
  p_user_email TEXT,
  p_date DATE,
  p_usage_type TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_usage (user_email, date, tender_views, api_calls, exports)
  VALUES (
    p_user_email,
    p_date,
    CASE WHEN p_usage_type = 'tender_views' THEN 1 ELSE 0 END,
    CASE WHEN p_usage_type = 'api_calls' THEN 1 ELSE 0 END,
    CASE WHEN p_usage_type = 'exports' THEN 1 ELSE 0 END
  )
  ON CONFLICT (user_email, date)
  DO UPDATE SET
    tender_views = user_usage.tender_views + CASE WHEN p_usage_type = 'tender_views' THEN 1 ELSE 0 END,
    api_calls = user_usage.api_calls + CASE WHEN p_usage_type = 'api_calls' THEN 1 ELSE 0 END,
    exports = user_usage.exports + CASE WHEN p_usage_type = 'exports' THEN 1 ELSE 0 END,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;
`;

// Example usage in API routes:

/*
// src/app/api/tenders/[campus]/route.ts
import { SubscriptionMiddleware } from '@/lib/subscription-middleware';

export async function GET(request: Request) {
  const userEmail = getUserEmailFromRequest(request); // Your auth implementation

  if (userEmail) {
    // Check if user can access this campus
    const middleware = SubscriptionMiddleware.createApiMiddleware({
      requiredFeature: 'all_colleges', // Only if accessing premium colleges
      usageType: 'tender_views',
      checkUsageLimit: true
    });

    const middlewareResult = await middleware(request, userEmail);
    if (middlewareResult) {
      return middlewareResult; // Return error response
    }
  }

  // Continue with tender fetching logic
  // ...
}

// src/app/api/export/route.ts
export async function POST(request: Request) {
  const userEmail = getUserEmailFromRequest(request);

  const middleware = SubscriptionMiddleware.createApiMiddleware({
    usageType: 'exports',
    checkUsageLimit: true
  });

  const middlewareResult = await middleware(request, userEmail);
  if (middlewareResult) {
    return middlewareResult;
  }

  // Continue with export logic
  // ...
}
*/