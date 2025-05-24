// src/app/api/subscription/usage/route.ts (Updated)
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const email = searchParams.get('email');
    const usageType = searchParams.get('type') as 'tender_views' | 'api_calls' | 'exports';

    if ((!userId && !email) || !usageType) {
      return NextResponse.json(
        { error: 'User ID/email and usage type are required' },
        { status: 400 }
      );
    }

    // Get current usage for today
    let query = supabase
      .from('user_usage')
      .select('*')
      .eq('date', new Date().toISOString().split('T')[0]);

    if (userId) {
      query = query.eq('user_id', userId);
    } else {
      query = query.eq('user_email', email);
    }

    const { data: usage, error } = await query.single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching usage:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch usage' },
        { status: 500 }
      );
    }

    const currentUsage = usage?.[usageType] || 0;

    // For now, assume free tier limits
    const limits = {
      tender_views: 10,
      api_calls: 50,
      exports: 5
    };

    return NextResponse.json({
      success: true,
      usage: {
        allowed: currentUsage < limits[usageType],
        currentUsage,
        limit: limits[usageType]
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
    const { user_id, email, usage_type } = await request.json();

    if ((!user_id && !email) || !usage_type) {
      return NextResponse.json(
        { error: 'User ID/email and usage type are required' },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Use upsert to increment usage
    interface UpdateData {
      date: string;
      user_id?: string;
      user_email?: string;
      tender_views?: number;
      api_calls?: number;
      exports?: number;
    }

    const updateData: UpdateData = {
      date: today,
      [usage_type]: 1
    };

    if (user_id) {
      updateData.user_id = user_id;
    }
    if (email) {
      updateData.user_email = email;
    }

    const { error } = await supabase
      .from('user_usage')
      .upsert(updateData, {
        onConflict: user_id ? 'user_id,date' : 'user_email,date',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error tracking usage:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to track usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track usage' },
      { status: 500 }
    );
  }
}