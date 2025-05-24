// src/lib/subscription.ts
import { supabase } from './supabase';

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  max_tender_views?: number;
  email_notifications: boolean;
  real_time_notifications: boolean;
  export_features: boolean;
  api_access: boolean;
  analytics: boolean;
  priority_support: boolean;
}

export interface UserSubscription {
  id: string;
  user_email: string;
  plan_id: string;
  subscription_type: 'monthly' | 'yearly';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  starts_at: string;
  ends_at: string;
  amount_paid: number;
  auto_renew: boolean;
  plan?: SubscriptionPlan;
}

// Get all available subscription plans
export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true });

  if (error) {
    throw new Error(`Error fetching subscription plans: ${error.message}`);
  }

  return data || [];
}

// Get user's current subscription
export async function getUserSubscription(email: string): Promise<UserSubscription | null> {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_email', email)
    .eq('status', 'active')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw new Error(`Error fetching user subscription: ${error.message}`);
  }

  return data;
}

// Check if user has access to a feature
export async function hasFeatureAccess(
  email: string,
  feature: keyof SubscriptionPlan
): Promise<boolean> {
  const subscription = await getUserSubscription(email);

  if (!subscription || subscription.status !== 'active') {
    // Free tier permissions
    const freePlan = await getFreePlan();
    return freePlan ? freePlan[feature] === true : false;
  }

  return subscription.plan?.[feature] === true;
}

// Check daily usage limits
interface UsageData {
  tender_views?: number;
  api_calls?: number;
  exports?: number;
}

export async function checkUsageLimit(
  email: string,
  usageType: 'tender_views' | 'api_calls' | 'exports'
): Promise<{ allowed: boolean; currentUsage: number; limit?: number }> {
  const subscription = await getUserSubscription(email);
  const today = new Date().toISOString().split('T')[0];

  // Get current usage
  const { data: usage } = await supabase
    .from('user_usage')
    .select(usageType)
    .eq('user_email', email)
    .eq('date', today)
    .single();

  const currentUsage = (usage as UsageData)?.[usageType] || 0;

  if (!subscription || subscription.status !== 'active') {
    // Free tier limits
    const limit = usageType === 'tender_views' ? 10 : 5;
    return {
      allowed: currentUsage < limit,
      currentUsage,
      limit
    };
  }

  // Paid plans - unlimited (or high limits)
  return {
    allowed: true,
    currentUsage
  };
}

// Track usage
export async function trackUsage(
  email: string,
  usageType: 'tender_views' | 'api_calls' | 'exports'
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  const { error } = await supabase
    .from('user_usage')
    .upsert({
      user_email: email,
      date: today,
      [usageType]: 1
    }, {
      onConflict: 'user_email,date',
      ignoreDuplicates: false
    });

  if (error) {
    console.error('Error tracking usage:', error);
  }
}

// Create subscription
export async function createSubscription(
  email: string,
  planId: string,
  subscriptionType: 'monthly' | 'yearly',
  paymentId: string,
  amountPaid: number
): Promise<UserSubscription> {
  const startDate = new Date();
  const endDate = new Date(startDate);

  if (subscriptionType === 'monthly') {
    endDate.setMonth(endDate.getMonth() + 1);
  } else {
    endDate.setFullYear(endDate.getFullYear() + 1);
  }

  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_email: email,
      plan_id: planId,
      subscription_type: subscriptionType,
      status: 'active',
      starts_at: startDate.toISOString(),
      ends_at: endDate.toISOString(),
      payment_id: paymentId,
      amount_paid: amountPaid
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating subscription: ${error.message}`);
  }

  return data;
}

// Cancel subscription
export async function cancelSubscription(email: string): Promise<void> {
  const { error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      auto_renew: false
    })
    .eq('user_email', email)
    .eq('status', 'active');

  if (error) {
    throw new Error(`Error cancelling subscription: ${error.message}`);
  }
}

// Get free plan details
async function getFreePlan(): Promise<SubscriptionPlan | null> {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('name', 'Free')
    .single();

  if (error) {
    console.error('Error fetching free plan:', error);
    return null;
  }

  return data;
}

// Check if subscription is expiring soon
export async function getExpiringSubscriptions(days: number = 7): Promise<UserSubscription[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);

  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('status', 'active')
    .eq('auto_renew', true)
    .lte('ends_at', futureDate.toISOString());

  if (error) {
    throw new Error(`Error fetching expiring subscriptions: ${error.message}`);
  }

  return data || [];
}