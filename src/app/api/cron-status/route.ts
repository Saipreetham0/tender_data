// src/app/api/cron-status/route.ts
import { NextResponse } from 'next/server';
import { getRecentCronLogs, getLastCronExecutionTime } from '@/lib/cronLogger';

// Secret key for securing the endpoint
const API_SECRET_KEY = process.env.CRON_API_SECRET_KEY;

export async function GET(request: Request) {
  try {
    // Validate the request with authorization
    const { searchParams } = new URL(request.url);
    const secretKey = searchParams.get('key');

    if (!secretKey || secretKey !== API_SECRET_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // How many logs to retrieve
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Get recent logs and last execution time
    const recentLogs = await getRecentCronLogs(limit);
    const lastExecutionTime = await getLastCronExecutionTime('tender-scraping');

    // Check if the cron is working properly
    const now = new Date();
    const lastExecDate = lastExecutionTime ? new Date(lastExecutionTime) : null;

    // If no execution or last execution was more than 2 hours ago, consider it not working
    // (Since your cron is scheduled hourly)
    const isWorking = lastExecDate && (now.getTime() - lastExecDate.getTime() < 2 * 60 * 60 * 1000);

    // Calculate next scheduled run
    const nextRun = lastExecDate ? new Date(lastExecDate.getTime() + 60 * 60 * 1000) : null;

    return NextResponse.json({
      success: true,
      status: {
        isWorking,
        lastExecutionTime,
        nextScheduledRun: nextRun?.toISOString(),
        currentServerTime: now.toISOString()
      },
      recentLogs
    });
  } catch (error) {
    console.error('Error in cron status API route:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}