// src/app/api/subscription/usage/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { RazorpayPaymentService } from '@/lib/razorpay-payment';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const type = searchParams.get('type');

    if (!email || !type) {
      return NextResponse.json(
        { success: false, error: 'Email and type parameters are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Get current usage
    interface Usage {
      [key: string]: number;
    }

    const { data: usage } = await supabase
      .from('user_usage')
      .select(type)
      .eq('user_email', email)
      .eq('date', today)
      .single();

    const currentUsage = (usage && typeof usage === 'object' && !('error' in usage))
      ? (usage as Usage)[type] || 0
      : 0;

    // Check if user has active subscription
    const subscription = await RazorpayPaymentService.getCurrentSubscription(email);

    let limit = null;
    let allowed = true;

    if (!subscription || subscription.status !== 'active') {
      // Free tier limits
      switch (type) {
        case 'tender_views':
          limit = 10;
          break;
        case 'api_calls':
          limit = 5;
          break;
        case 'exports':
          limit = 2;
          break;
        default:
          limit = 5;
      }
      allowed = currentUsage < limit;
    }
    // Paid users have unlimited access (allowed = true)

    return NextResponse.json({
      success: true,
      usage: {
        allowed,
        currentUsage,
        limit
      }
    });
  } catch (error) {
    console.error('Error checking usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check usage' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { email, usageType } = await request.json();

    if (!email || !usageType) {
      return NextResponse.json(
        { success: false, error: 'Email and usageType are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Increment usage using upsert
    const { error } = await supabase
      .from('user_usage')
      .upsert({
        user_email: email,
        date: today,
        [usageType]: 1
      }, {
        onConflict: 'user_email,date',
        ignoreDuplicates: false
      });

    if (error) {
      // If upsert fails, try to increment existing record
      const { data: existing } = await supabase
        .from('user_usage')
        .select(usageType)
        .eq('user_email', email)
        .eq('date', today)
        .single();

      if (existing) {
        await supabase
          .from('user_usage')
          .update({
            [usageType]: (Number(existing[usageType]) || 0) + 1
          })
          .eq('user_email', email)
          .eq('date', today);
      }
    }

    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}