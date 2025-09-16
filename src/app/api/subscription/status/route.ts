import { NextResponse } from 'next/server';
import { sessionCache } from '@/lib/session-cache';
import { createRateLimitMiddleware } from '@/lib/rate-limiter';
import { supabase } from '@/lib/supabase';

const rateLimitCheck = createRateLimitMiddleware('SUBSCRIPTION');

interface SubscriptionStatus {
  hasAccess: boolean;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'free';
  expiresAt?: string;
  features: string[];
  remainingDays?: number;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const feature = searchParams.get('feature'); // Optional: check specific feature

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  // Apply rate limiting
  const rateLimitResult = await rateLimitCheck(request, email);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      return NextResponse.json({
        success: true,
        status: {
          hasAccess: false,
          planId: 'free',
          status: 'free',
          features: ['basic_access', 'single_college'],
          remainingDays: undefined
        } as SubscriptionStatus
      });
    }

    const userId = userData.id;

    // Get subscription from cache with fallback
    const subscription = await sessionCache.getSubscriptionWithFallback(
      userId,
      async () => {
        // Fallback: fetch from database
        const { data: subData, error: subError } = await supabase
          .from('user_subscriptions')
          .select(`
            *,
            subscription_plans(*)
          `)
          .eq('user_id', userId)
          .eq('status', 'active')
          .single();

        if (subError || !subData) {
          return null;
        }

        return {
          planId: subData.plan_id,
          status: subData.status as 'active' | 'cancelled' | 'expired',
          expiresAt: subData.expires_at,
          features: subData.subscription_plans?.features || [],
          billingCycle: subData.billing_cycle || 'monthly'
        };
      }
    );

    // Determine access status
    let status: SubscriptionStatus;

    if (!subscription || subscription.status !== 'active') {
      // Free tier
      status = {
        hasAccess: true, // Basic access
        planId: 'free',
        status: 'free',
        features: ['basic_access', 'single_college'],
        remainingDays: undefined
      };
    } else {
      // Calculate remaining days
      const expiresAt = new Date(subscription.expiresAt);
      const now = new Date();
      const remainingMs = expiresAt.getTime() - now.getTime();
      const remainingDays = Math.max(0, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)));

      status = {
        hasAccess: remainingDays > 0,
        planId: subscription.planId,
        status: remainingDays > 0 ? 'active' : 'expired',
        expiresAt: subscription.expiresAt,
        features: subscription.features,
        remainingDays
      };
    }

    // If checking specific feature
    if (feature) {
      const hasFeatureAccess = checkFeatureAccess(feature, status);
      return NextResponse.json({
        success: true,
        hasAccess: hasFeatureAccess,
        feature,
        status
      });
    }

    return NextResponse.json({
      success: true,
      status
    });

  } catch (error) {
    console.error('Error checking subscription status:', error);

    // Return free tier on error
    return NextResponse.json({
      success: true,
      status: {
        hasAccess: true,
        planId: 'free',
        status: 'free',
        features: ['basic_access', 'single_college'],
        remainingDays: undefined
      } as SubscriptionStatus
    });
  }
}

// Helper function to check feature access
function checkFeatureAccess(feature: string, status: SubscriptionStatus): boolean {
  // Free tier features
  const freeTierFeatures = ['basic_access', 'single_college'];

  if (freeTierFeatures.includes(feature)) {
    return true;
  }

  // Premium features require active subscription
  if (status.status !== 'active') {
    return false;
  }

  // Check if feature is in the plan
  return status.features.includes(feature);
}