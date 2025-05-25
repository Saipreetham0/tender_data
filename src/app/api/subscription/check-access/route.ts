// src/app/api/subscription/check-access/route.ts
import { NextResponse } from 'next/server';
import { canAccessFeature } from '@/lib/razorpay-subscription';

export async function POST(request: Request) {
  try {
    const { userEmail, feature } = await request.json();

    const hasAccess = await canAccessFeature(userEmail, feature);

    return NextResponse.json({
      success: true,
      hasAccess
    });
  } catch (error) {
    console.error('Error checking access:', error);
    return NextResponse.json(
      { error: 'Failed to check access' },
      { status: 500 }
    );
  }
}