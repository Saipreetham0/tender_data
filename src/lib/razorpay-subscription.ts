// src/lib/razorpay-subscription.ts
import Razorpay from 'razorpay';
import { supabase } from './supabase';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

interface CreateSubscriptionParams {
  userId?: string;
  userEmail: string;
  planId: string;
  subscriptionType: 'monthly' | 'yearly';
  collegePreferences?: string[];
}

interface RazorpayPlan {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: {
    id: string;
    name: string;
    amount: number;
    currency: string;
  };
}

interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
  ended_at: number | null;
  quantity: number;
  notes: Record<string, any>;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  customer_notify: boolean;
  created_at: number;
  expire_by: number | null;
}

// Create or get Razorpay plans
export async function ensureRazorpayPlans() {
  try {
    // Get all active plans from database
    const { data: dbPlans, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .neq('name', 'Free') // Skip free plan
      .neq('name', 'Enterprise'); // Skip enterprise (custom pricing)

    if (error) throw error;
    if (!dbPlans) return;

    for (const plan of dbPlans) {
      // Create monthly plan if it doesn't exist
      if (plan.price_monthly > 0 && !plan.razorpay_plan_id_monthly) {
        const monthlyPlan = await createRazorpayPlan({
          period: 'monthly',
          interval: 1,
          item: {
            name: `${plan.name} - Monthly`,
            amount: plan.price_monthly,
            currency: 'INR',
            description: plan.description || `${plan.name} monthly subscription`
          },
          notes: {
            plan_id: plan.id,
            plan_name: plan.name,
            type: 'monthly'
          }
        });

        // Update database with Razorpay plan ID
        await supabase
          .from('subscription_plans')
          .update({ razorpay_plan_id_monthly: monthlyPlan.id })
          .eq('id', plan.id);
      }

      // Create yearly plan if it doesn't exist
      if (plan.price_yearly > 0 && !plan.razorpay_plan_id_yearly) {
        const yearlyPlan = await createRazorpayPlan({
          period: 'yearly',
          interval: 1,
          item: {
            name: `${plan.name} - Yearly`,
            amount: plan.price_yearly,
            currency: 'INR',
            description: plan.description || `${plan.name} yearly subscription`
          },
          notes: {
            plan_id: plan.id,
            plan_name: plan.name,
            type: 'yearly'
          }
        });

        // Update database with Razorpay plan ID
        await supabase
          .from('subscription_plans')
          .update({ razorpay_plan_id_yearly: yearlyPlan.id })
          .eq('id', plan.id);
      }
    }

    console.log('Razorpay plans synchronized successfully');
  } catch (error) {
    console.error('Error ensuring Razorpay plans:', error);
    throw error;
  }
}

// Create a Razorpay plan
async function createRazorpayPlan(params: {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  item: {
    name: string;
    amount: number;
    currency: string;
    description?: string;
  };
  notes?: Record<string, any>;
}): Promise<RazorpayPlan> {
  try {
    const plan = await razorpay.plans.create(params);
    return plan as RazorpayPlan;
  } catch (error) {
    console.error('Error creating Razorpay plan:', error);
    throw error;
  }
}

// Create or get Razorpay customer
async function ensureRazorpayCustomer(email: string, name?: string): Promise<string> {
  try {
    // Check if customer already exists in our database
    const { data: existingUser } = await supabase
      .from('user_subscriptions')
      .select('razorpay_customer_id')
      .eq('user_email', email)
      .not('razorpay_customer_id', 'is', null)
      .limit(1)
      .single();

    if (existingUser?.razorpay_customer_id) {
      return existingUser.razorpay_customer_id;
    }

    // Create new customer in Razorpay
    const customer = await razorpay.customers.create({
      email,
      name: name || email.split('@')[0],
      notes: {
        source: 'rgukt_tenders'
      }
    });

    return customer.id;
  } catch (error) {
    console.error('Error ensuring Razorpay customer:', error);
    throw error;
  }
}

// Create a subscription
export async function createRazorpaySubscription({
  userId,
  userEmail,
  planId,
  subscriptionType,
  collegePreferences = ['all']
}: CreateSubscriptionParams) {
  try {
    // Get plan details from database
    const { data: plan, error: planError } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      throw new Error('Invalid plan selected');
    }

    // Get the appropriate Razorpay plan ID
    const razorpayPlanId = subscriptionType === 'monthly'
      ? plan.razorpay_plan_id_monthly
      : plan.razorpay_plan_id_yearly;

    if (!razorpayPlanId) {
      throw new Error('Razorpay plan not configured for this subscription type');
    }

    // Ensure customer exists
    const customerId = await ensureRazorpayCustomer(userEmail);

    // Create subscription in Razorpay
    const subscription = await razorpay.subscriptions.create({
      plan_id: razorpayPlanId,
      customer_notify: 1,
      quantity: 1,
      total_count: subscriptionType === 'monthly' ? 12 : 1, // 12 months or 1 year
      notes: {
        user_id: userId || '',
        user_email: userEmail,
        plan_name: plan.name,
        subscription_type: subscriptionType
      }
    }) as RazorpaySubscription;

    // Store subscription in database
    const { data: dbSubscription, error: dbError } = await supabase
      .from('user_subscriptions')
      .insert({
        user_id: userId,
        user_email: userEmail,
        plan_id: planId,
        subscription_type: subscriptionType,
        razorpay_subscription_id: subscription.id,
        razorpay_customer_id: customerId,
        status: subscription.status,
        starts_at: new Date(subscription.start_at * 1000).toISOString(),
        current_period_start: new Date(subscription.current_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_end * 1000).toISOString(),
        next_billing_at: new Date(subscription.charge_at * 1000).toISOString(),
        total_count: subscription.total_count,
        college_preferences: collegePreferences,
        amount_paid: 0 // Will be updated when payment is made
      })
      .select()
      .single();

    if (dbError) {
      // If database insert fails, cancel the Razorpay subscription
      await razorpay.subscriptions.cancel(subscription.id);
      throw dbError;
    }

    // Log subscription event
    await logSubscriptionEvent(dbSubscription.id, 'created', {
      razorpay_subscription_id: subscription.id,
      plan_name: plan.name,
      subscription_type: subscriptionType
    });

    return {
      subscription: dbSubscription,
      razorpaySubscription: subscription,
      plan: plan
    };
  } catch (error) {
    console.error('Error creating subscription:', error);
    throw error;
  }
}

// Update subscription status from webhook
export async function updateSubscriptionStatus(
  razorpaySubscriptionId: string,
  status: string,
  eventData?: any
) {
  try {
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .update({
        status,
        updated_at: new Date().toISOString(),
        ...(eventData?.current_start && {
          current_period_start: new Date(eventData.current_start * 1000).toISOString()
        }),
        ...(eventData?.current_end && {
          current_period_end: new Date(eventData.current_end * 1000).toISOString()
        }),
        ...(eventData?.charge_at && {
          next_billing_at: new Date(eventData.charge_at * 1000).toISOString()
        }),
        ...(eventData?.ended_at && {
          ends_at: new Date(eventData.ended_at * 1000).toISOString()
        })
      })
      .eq('razorpay_subscription_id', razorpaySubscriptionId)
      .select()
      .single();

    if (error) throw error;

    // Log the event
    await logSubscriptionEvent(subscription.id, status, eventData);

    return subscription;
  } catch (error) {
    console.error('Error updating subscription status:', error);
    throw error;
  }
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  try {
    // Get subscription details
    const { data: subscription, error } = await supabase
      .from('user_subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (error || !subscription) {
      throw new Error('Subscription not found');
    }

    // Cancel in Razorpay
    if (subscription.razorpay_subscription_id) {
      await razorpay.subscriptions.cancel(subscription.razorpay_subscription_id, false); // false means cancel at cycle end
    }

    // Update database
    const { data: updated } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    // Log event
    await logSubscriptionEvent(subscriptionId, 'cancelled', {
      cancelled_at_cycle_end: true
    });

    return updated;
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    throw error;
  }
}

// Pause subscription
export async function pauseSubscription(subscriptionId: string, pauseUntil?: Date) {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('razorpay_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription?.razorpay_subscription_id) {
      throw new Error('Subscription not found');
    }

    // Pause in Razorpay
    await razorpay.subscriptions.pause(subscription.razorpay_subscription_id, {
      pause_at: 'now'
    });

    // Update database
    const { data: updated } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'paused',
        pause_start: new Date().toISOString(),
        pause_end: pauseUntil?.toISOString()
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    // Log event
    await logSubscriptionEvent(subscriptionId, 'paused', {
      pause_until: pauseUntil
    });

    return updated;
  } catch (error) {
    console.error('Error pausing subscription:', error);
    throw error;
  }
}

// Resume subscription
export async function resumeSubscription(subscriptionId: string) {
  try {
    const { data: subscription } = await supabase
      .from('user_subscriptions')
      .select('razorpay_subscription_id')
      .eq('id', subscriptionId)
      .single();

    if (!subscription?.razorpay_subscription_id) {
      throw new Error('Subscription not found');
    }

    // Resume in Razorpay
    await razorpay.subscriptions.resume(subscription.razorpay_subscription_id, {
      resume_at: 'now'
    });

    // Update database
    const { data: updated } = await supabase
      .from('user_subscriptions')
      .update({
        status: 'active',
        pause_start: null,
        pause_end: null
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    // Log event
    await logSubscriptionEvent(subscriptionId, 'resumed');

    return updated;
  } catch (error) {
    console.error('Error resuming subscription:', error);
    throw error;
  }
}

// Change subscription plan
export async function changeSubscriptionPlan(
  subscriptionId: string,
  newPlanId: string,
  subscriptionType: 'monthly' | 'yearly'
) {
  try {
    // Get current subscription
    const { data: currentSub } = await supabase
      .from('user_subscriptions')
      .select('*, plan:subscription_plans(*)')
      .eq('id', subscriptionId)
      .single();

    if (!currentSub) {
      throw new Error('Subscription not found');
    }

    // Get new plan details
    const { data: newPlan } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('id', newPlanId)
      .single();

    if (!newPlan) {
      throw new Error('New plan not found');
    }

    const newRazorpayPlanId = subscriptionType === 'monthly'
      ? newPlan.razorpay_plan_id_monthly
      : newPlan.razorpay_plan_id_yearly;

    // Update subscription in Razorpay
    await razorpay.subscriptions.update(currentSub.razorpay_subscription_id, {
      plan_id: newRazorpayPlanId,
      quantity: 1,
      schedule_change_at: 'cycle_end' // Change at end of current billing cycle
    });

    // Update database
    const { data: updated } = await supabase
      .from('user_subscriptions')
      .update({
        plan_id: newPlanId,
        subscription_type: subscriptionType
      })
      .eq('id', subscriptionId)
      .select()
      .single();

    // Log event
    await logSubscriptionEvent(subscriptionId, 'plan_changed', {
      old_plan: currentSub.plan.name,
      new_plan: newPlan.name,
      change_at: 'cycle_end'
    });

    return updated;
  } catch (error) {
    console.error('Error changing subscription plan:', error);
    throw error;
  }
}

// Log subscription event
async function logSubscriptionEvent(
  subscriptionId: string,
  eventType: string,
  eventData?: any
) {
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

// Get subscription details with plan info
export async function getSubscriptionWithPlan(subscriptionId: string) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('id', subscriptionId)
    .single();

  if (error) throw error;
  return data;
}

// Check if user can access a feature based on their subscription
export async function canAccessFeature(
  userEmail: string,
  feature: 'filters' | 'keyword_filter' | 'advanced_filters' | 'api' | 'all_colleges'
): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('user_subscriptions')
      .select(`
        status,
        plan:subscription_plans!inner (
          colleges_access,
          has_filters,
          has_keyword_filter,
          has_advanced_filters,
          has_api_access
        )
      `)
      .eq('user_email', userEmail)
      .eq('status', 'active')
      .single();

    if (!data?.plan?.[0]) return false;

    switch (feature) {
      case 'all_colleges':
        return data.plan[0].colleges_access >= 5;
      case 'filters':
        return data.plan[0].has_filters;
      case 'keyword_filter':
        return data.plan[0].has_keyword_filter;
      case 'advanced_filters':
        return data.plan[0].has_advanced_filters;
      case 'api':
        return data.plan[0].has_api_access;
      default:
        return false;
    }
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
}