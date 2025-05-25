
// src/app/api/admin/cleanup/route.ts
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    // Check for API key
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');
    const secretKey = process.env.CRON_API_SECRET_KEY;

    if (!apiKey || apiKey !== secretKey) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { days = 30 } = await request.json();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let deletedRecords = 0;

    // Clean up old usage data
    const { error: usageError, count: usageCount } = await supabase
      .from('user_usage')
      .delete()
      .lt('date', cutoffDate.toISOString().split('T')[0]);

    if (usageError) {
      console.error('Error cleaning usage data:', usageError);
    } else {
      deletedRecords += usageCount || 0;
    }

    // Clean up old cron logs
    const { error: cronError, count: cronCount } = await supabase
      .from('cron_logs')
      .delete()
      .lt('timestamp', cutoffDate.toISOString());

    if (cronError) {
      console.error('Error cleaning cron logs:', cronError);
    } else {
      deletedRecords += cronCount || 0;
    }

    // Clean up old subscription events (keep longer - 90 days)
    const eventsCutoff = new Date();
    eventsCutoff.setDate(eventsCutoff.getDate() - 90);

    const { error: eventsError, count: eventsCount } = await supabase
      .from('subscription_events')
      .delete()
      .lt('created_at', eventsCutoff.toISOString());

    if (eventsError) {
      console.error('Error cleaning subscription events:', eventsError);
    } else {
      deletedRecords += eventsCount || 0;
    }

    return NextResponse.json({
      success: true,
      message: `Cleanup completed. ${deletedRecords} records deleted.`,
      deletedRecords,
      cutoffDate: cutoffDate.toISOString(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during cleanup:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Cleanup failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}