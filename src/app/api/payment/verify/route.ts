// src/app/api/payment/verify/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createSubscription } from '@/lib/subscription';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      planId,
      subscriptionType,
      userEmail,
      amount
    } = await request.json();

    // Verify payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      );
    }

    // Create subscription
    const subscription = await createSubscription(
      userEmail,
      planId,
      subscriptionType,
      razorpay_payment_id,
      amount / 100 // Convert from paise to rupees
    );

    // Store payment history
    await supabase.from('payment_history').insert({
      subscription_id: subscription.id,
      payment_gateway: 'razorpay',
      gateway_payment_id: razorpay_payment_id,
      amount: amount / 100,
      currency: 'INR',
      status: 'completed',
      gateway_response: {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        signature: razorpay_signature
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified and subscription activated',
      subscription
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}