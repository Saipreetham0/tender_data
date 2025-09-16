


// src/app/api/subscription/current/route.ts - UPDATED WITH REDIS CACHING
import { NextResponse } from 'next/server';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';
import { sessionCache } from '@/lib/session-cache';
import { createRateLimitMiddleware } from '@/lib/rate-limiter';
import { supabase } from '@/lib/supabase';

const rateLimitCheck = createRateLimitMiddleware('SUBSCRIPTION');

export async function GET(request: Request) {
  // Apply rate limiting
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json(
      { success: false, error: 'Email parameter is required' },
      { status: 400 }
    );
  }

  const rateLimitResult = await rateLimitCheck(request, email);
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    // Get user ID from email first
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !userData) {
      // If user not found in profiles, return free tier subscription
      return NextResponse.json({
        success: true,
        subscription: {
          planId: 'free',
          status: 'active',
          expiresAt: null,
          features: ['basic_access', 'single_college'],
          billingCycle: null
        },
        cached: false
      });
    }

    const userId = userData.id;

    // Try to get subscription from Redis cache first
    const cachedSubscription = await sessionCache.getSubscription(userId);

    if (cachedSubscription) {
      return NextResponse.json({
        success: true,
        subscription: cachedSubscription,
        cached: true
      });
    }

    // If not in cache, fetch from database with fallback
    const subscription = await sessionCache.getSubscriptionWithFallback(
      userId,
      async () => {
        // This is the fallback function that fetches from database
        const dbSubscription = await RazorpayPaymentService.getCurrentSubscription(email);

        // Transform to our cached format if needed
        if (dbSubscription) {
          return {
            planId: dbSubscription.plan?.id || 'free',
            status: dbSubscription.status || 'inactive',
            expiresAt: dbSubscription.expiresAt || new Date().toISOString(),
            features: dbSubscription.plan?.features || [],
            billingCycle: dbSubscription.billingCycle || 'monthly'
          };
        }

        return null;
      }
    );

    return NextResponse.json({
      success: true,
      subscription,
      cached: false
    });

  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch current subscription' },
      { status: 500 }
    );
  }
}

