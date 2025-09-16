// src/app/api/system/init/route.ts - System initialization endpoint

import { NextResponse } from 'next/server';
import { centralizedScraper } from '@/lib/centralized-scraper';

export async function POST(request: Request) {
  try {
    // Start the centralized scraper system
    centralizedScraper.start();

    return NextResponse.json({
      success: true,
      message: 'System initialized successfully',
      timestamp: new Date().toISOString(),
      services: {
        centralizedScraper: 'started'
      }
    });

  } catch (error) {
    console.error('System initialization error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initialize system',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    const scraperStatus = centralizedScraper.getJobStatuses();

    return NextResponse.json({
      success: true,
      system: {
        status: 'running',
        timestamp: new Date().toISOString(),
        scraperJobs: scraperStatus
      }
    });

  } catch (error) {
    console.error('System status error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to get system status'
    }, { status: 500 });
  }
}