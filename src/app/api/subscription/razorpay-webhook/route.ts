// src/app/api/subscription/razorpay-webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { updateSubscriptionStatus } from '@/lib/razorpay-subscription';
import { supabase } from '@/lib/supabase';

// Verify webhook signature
function verifyWebhookSignature(
  body: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

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
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET!;
    const isValid = verifyWebhookSignature(body, signature, webhookSecret);

    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    const event = JSON.parse(body);
    console.log('Received webhook event:', event.event);

    // Handle different webhook events
    switch (event.event) {
      case 'subscription.authenticated':
        // First payment has been authorized
        await handleSubscriptionAuthenticated(event.payload.subscription.entity);
        break;

      case 'subscription.activated':
        // Subscription is active after first successful payment
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;

      case 'subscription.charged':
        // Recurring payment successful
        await handleSubscriptionCharged(event.payload);
        break;

      case 'subscription.completed':
        // All charges completed
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;

      case 'subscription.updated':
        // Subscription details updated
        await handleSubscriptionUpdated(event.payload.subscription.entity);
        break;

      case 'subscription.pending':
        // Payment pending
        await handleSubscriptionPending(event.payload.subscription.entity);
        break;

      case 'subscription.halted':
        // Subscription halted due to payment failures
        await handleSubscriptionHalted(event.payload.subscription.entity);
        break;

      case 'subscription.cancelled':
        // Subscription cancelled
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;

      case 'subscription.paused':
        // Subscription paused
        await handleSubscriptionPaused(event.payload.subscription.entity);
        break;

      case 'subscription.resumed':
        // Subscription resumed
        await handleSubscriptionResumed(event.payload.subscription.entity);
        break;

      case 'payment.failed':
        // Payment failed
        await handlePaymentFailed(event.payload.payment.entity);
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

// Handler functions for different events
async function handleSubscriptionAuthenticated(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'authenticated', subscription);
}

async function handleSubscriptionActivated(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'active', subscription);

  // Update starts_at if this is the first activation
  await supabase
    .from('user_subscriptions')
    .update({
      starts_at: new Date(subscription.start_at * 1000).toISOString(),
      paid_count: subscription.paid_count
    })
    .eq('razorpay_subscription_id', subscription.id);
}

async function handleSubscriptionCharged(payload: any) {
  const subscription = payload.subscription.entity;
  const payment = payload.payment.entity;

  // Update subscription status
  await updateSubscriptionStatus(subscription.id, 'active', subscription);

  // Record payment
  await supabase
    .from('payment_history')
    .insert({
      subscription_id: await getSubscriptionIdFromRazorpayId(subscription.id),
      razorpay_payment_id: payment.id,
      razorpay_order_id: payment.order_id,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      method: payment.method,
      card_last4: payment.card?.last4,
      bank: payment.bank,
      vpa: payment.vpa,
      wallet: payment.wallet,
      international: payment.international || false,
      created_at: new Date(payment.created_at * 1000).toISOString()
    });

  // Update paid count and amount
  await supabase
    .from('user_subscriptions')
    .update({
      paid_count: subscription.paid_count,
      amount_paid: payment.amount + subscription.amount_paid
    })
    .eq('razorpay_subscription_id', subscription.id);

  // Log event
  const subscriptionId = await getSubscriptionIdFromRazorpayId(subscription.id);
  if (subscriptionId) {
    await logSubscriptionEvent(
      subscriptionId,
      'charged',
      { payment_id: payment.id, amount: payment.amount }
    );
  }
}

async function handleSubscriptionCompleted(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'completed', subscription);
}

async function handleSubscriptionUpdated(subscription: any) {
  await updateSubscriptionStatus(subscription.id, subscription.status, subscription);
}

async function handleSubscriptionPending(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'pending', subscription);
}

async function handleSubscriptionHalted(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'halted', subscription);

  // Send notification to user about payment issues
  // You can implement email notification here
}

async function handleSubscriptionCancelled(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'cancelled', subscription);
}

async function handleSubscriptionPaused(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'paused', subscription);
}

async function handleSubscriptionResumed(subscription: any) {
  await updateSubscriptionStatus(subscription.id, 'active', subscription);
}

async function handlePaymentFailed(payment: any) {
  // Find subscription
  const subscriptionId = await getSubscriptionIdFromRazorpayId(payment.subscription_id);

  if (subscriptionId) {
    // Record failed payment
    await supabase
      .from('payment_history')
      .insert({
        subscription_id: subscriptionId,
        razorpay_payment_id: payment.id,
        razorpay_order_id: payment.order_id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'failed',
        method: payment.method,
        error_code: payment.error_code,
        error_description: payment.error_description,
        error_reason: payment.error_reason,
        created_at: new Date(payment.created_at * 1000).toISOString()
      });

    // Log event
    await logSubscriptionEvent(subscriptionId, 'payment_failed', {
      payment_id: payment.id,
      error: payment.error_description
    });
  }
}

// Helper function to get subscription ID from Razorpay ID
async function getSubscriptionIdFromRazorpayId(razorpayId: string): Promise<string | null> {
  const { data } = await supabase
    .from('user_subscriptions')
    .select('id')
    .eq('razorpay_subscription_id', razorpayId)
    .single();

  return data?.id || null;
}

// Log subscription event
async function logSubscriptionEvent(
  subscriptionId: string,
  eventType: string,
  eventData?: any
) {
  if (!subscriptionId) return;

  try {
    await supabase
      .from('subscription_events')
      .insert({
        subscription_id: subscriptionId,
        event_type: eventType,
        event_data: eventData || {}
      });
  } catch (error) {
    console.error('Error logging subscription event:', error);
  }
}