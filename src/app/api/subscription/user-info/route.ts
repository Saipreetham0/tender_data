// src/app/api/subscription/user-info/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Call the database function to get user subscription info
    const { data, error } = await supabase
      .rpc('get_user_subscription_info', { target_user_id: userId });

    if (error) {
      console.error('Error fetching user subscription info:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch subscription info'
        },
        { status: 500 }
      );
    }

    // The function returns an array, so get the first (and only) result
    const subscriptionInfo = data && data.length > 0 ? data[0] : {
      has_active_subscription: false,
      plan_name: 'Free',
      subscription_type: 'none',
      ends_at: null,
      days_remaining: 0,
      daily_tender_views: 0,
      daily_api_calls: 0,
      daily_exports: 0,
      max_tender_views: 10
    };

    return NextResponse.json({
      success: true,
      subscription: subscriptionInfo
    });
  } catch (error) {
    console.error('Error in user subscription info API:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    );
  }
}


