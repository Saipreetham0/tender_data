// src/app/api/admin/scraper/route.ts - Admin API for centralized scraper management

import { NextResponse } from 'next/server';
import { centralizedScraper, getCachedTenderData } from '@/lib/centralized-scraper';
import { createRateLimitMiddleware } from '@/lib/rate-limiter';

const rateLimitCheck = createRateLimitMiddleware('API');

export async function GET(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimitCheck(request, 'admin-scraper');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          jobs: centralizedScraper.getJobStatuses(),
          timestamp: new Date().toISOString()
        });

      case 'test-cache':
        const campusId = searchParams.get('campus') || 'basar';
        const cachedData = await getCachedTenderData(campusId);
        return NextResponse.json({
          success: true,
          campus: campusId,
          data: cachedData
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: status, test-cache'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Scraper API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  // Apply rate limiting
  const rateLimitResult = await rateLimitCheck(request, 'admin-scraper');
  if (rateLimitResult) {
    return rateLimitResult;
  }

  try {
    const { action, campus } = await request.json();

    switch (action) {
      case 'start':
        centralizedScraper.start();
        return NextResponse.json({
          success: true,
          message: 'Centralized scraper started',
          timestamp: new Date().toISOString()
        });

      case 'stop':
        centralizedScraper.stop();
        return NextResponse.json({
          success: true,
          message: 'Centralized scraper stopped',
          timestamp: new Date().toISOString()
        });

      case 'force-run':
        if (campus) {
          const result = await centralizedScraper.forceRun(campus);
          return NextResponse.json({
            success: true,
            message: result ? `Force run initiated for ${campus}` : `${campus} is already running or not found`,
            campus,
            executed: result
          });
        } else {
          await centralizedScraper.forceRunAll();
          return NextResponse.json({
            success: true,
            message: 'Force run initiated for all campuses'
          });
        }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: start, stop, force-run'
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Scraper API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}