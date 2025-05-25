

// src/app/api/admin/update-pricing/route.ts
import { NextResponse } from 'next/server';
import { SubscriptionInitService } from '@/lib/subscription-init';

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

    const { planName, monthlyPrice, yearlyPrice } = await request.json();

    if (!planName || monthlyPrice === undefined || yearlyPrice === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planName, monthlyPrice, yearlyPrice' },
        { status: 400 }
      );
    }

    // Update plan pricing
    await SubscriptionInitService.updatePlanPricing(planName, monthlyPrice, yearlyPrice);

    return NextResponse.json({
      success: true,
      message: `Pricing updated for ${planName} plan`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating pricing:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Pricing update failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}



