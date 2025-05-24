// src/app/api/subscription/webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
// import { supabase } from '@/lib/supabase';

// Razorpay webhook handler for subscription events
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);

    switch (event.event) {
      case 'payment.captured':
        // Handle successful payment
        console.log('Payment captured:', event.payload.payment.entity);
        break;

      case 'payment.failed':
        // Handle failed payment
        console.log('Payment failed:', event.payload.payment.entity);
        break;

      case 'subscription.cancelled':
        // Handle subscription cancellation
        console.log('Subscription cancelled:', event.payload.subscription.entity);
        break;

      default:
        console.log('Unhandled webhook event:', event.event);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}