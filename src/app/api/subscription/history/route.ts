// src/app/api/subscription/history/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userEmail = searchParams.get('email');
    const subscriptionId = searchParams.get('subscriptionId');

    if (!userEmail && !subscriptionId) {
      return NextResponse.json(
        { error: 'Email or subscription ID required' },
        { status: 400 }
      );
    }

    let query = supabase
      .from('payment_history')
      .select(`
        *,
        subscription:user_subscriptions(
          id,
          plan:subscription_plans(name)
        )
      `)
      .order('created_at', { ascending: false });

    if (subscriptionId) {
      query = query.eq('subscription_id', subscriptionId);
    } else if (userEmail) {
      // Get all subscriptions for the user first
      const { data: subs } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_email', userEmail);

      if (subs && subs.length > 0) {
        query = query.in('subscription_id', subs.map(s => s.id));
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      payments: data
    });
  } catch (error) {
    console.error('Error fetching payment history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payment history' },
      { status: 500 }
    );
  }
}