


// // src/lib/razorpay-payment.ts - NEW: Simple payment service for one-time payments
// import Razorpay from 'razorpay';
// import { supabase } from './supabase';

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export interface CreatePaymentOrderParams {
//   userEmail: string;
//   planId: string;
//   subscriptionType: 'monthly' | 'yearly';
//   userId?: string;
// }

// export interface PaymentVerificationParams {
//   razorpay_order_id: string;
//   razorpay_payment_id: string;
//   razorpay_signature: string;
//   planId: string;
//   subscriptionType: 'monthly' | 'yearly';
//   userEmail: string;
// }

// export class RazorpayPaymentService {

//   /**
//    * Create a payment order for one-time payment
//    */
//   static async createPaymentOrder({
//     userEmail,
//     planId,
//     subscriptionType,
//     userId
//   }: CreatePaymentOrderParams) {
//     try {
//       // Get plan details
//       const { data: plan, error: planError } = await supabase
//         .from('subscription_plans')
//         .select('*')
//         .eq('id', planId)
//         .single();

//       if (planError || !plan) {
//         throw new Error('Invalid plan selected');
//       }

//       // Calculate amount based on subscription type
//       const amount = subscriptionType === 'yearly'
//         ? plan.price_yearly
//         : plan.price_monthly;

//       if (amount <= 0) {
//         throw new Error('Invalid plan amount');
//       }

//       // Create Razorpay order
//       const order = await razorpay.orders.create({
//         amount: Math.round(amount), // Amount in paise
//         currency: 'INR',
//         receipt: `receipt_${Date.now()}`,
//         notes: {
//           planId,
//           subscriptionType,
//           userEmail,
//           userId: userId || '',
//           planName: plan.name
//         }
//       });

//       return {
//         orderId: order.id,
//         amount: order.amount,
//         currency: order.currency,
//         plan: {
//           name: plan.name,
//           description: plan.description,
//           features: plan.features
//         }
//       };

//     } catch (error) {
//       console.error('Error creating payment order:', error);
//       throw new Error(error instanceof Error ? error.message : 'Failed to create payment order');
//     }
//   }

//   /**
//    * Verify payment and create fixed-duration subscription
//    */
//   static async verifyPaymentAndCreateSubscription({
//     razorpay_order_id,
//     razorpay_payment_id,
//     razorpay_signature,
//     planId,
//     subscriptionType,
//     userEmail
//   }: PaymentVerificationParams) {
//     try {
//       // Verify payment signature
//       const crypto = require('crypto');
//       const expectedSignature = crypto
//         .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
//         .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//         .digest('hex');

//       if (expectedSignature !== razorpay_signature) {
//         throw new Error('Invalid payment signature');
//       }

//       // Get plan details
//       const { data: plan, error: planError } = await supabase
//         .from('subscription_plans')
//         .select('*')
//         .eq('id', planId)
//         .single();

//       if (planError || !plan) {
//         throw new Error('Invalid plan selected');
//       }

//       // Calculate subscription dates
//       const startDate = new Date();
//       const endDate = new Date(startDate);

//       if (subscriptionType === 'monthly') {
//         endDate.setMonth(endDate.getMonth() + 1);
//       } else {
//         endDate.setFullYear(endDate.getFullYear() + 1);
//       }

//       // Create subscription record with fixed duration
//       const { data: subscription, error: subscriptionError } = await supabase
//         .from('user_subscriptions')
//         .insert({
//           user_email: userEmail,
//           plan_id: planId,
//           subscription_type: subscriptionType,
//           status: 'active',
//           payment_method: 'razorpay',
//           razorpay_order_id,
//           razorpay_payment_id,
//           starts_at: startDate.toISOString(),
//           ends_at: endDate.toISOString(),
//           amount_paid: subscriptionType === 'yearly' ? plan.price_yearly : plan.price_monthly,
//           created_at: new Date().toISOString()
//         })
//         .select()
//         .single();

//       if (subscriptionError) {
//         throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
//       }

//       // Store payment history
//       await supabase.from('payment_history').insert({
//         subscription_id: subscription.id,
//         amount: subscription.amount_paid,
//         currency: 'INR',
//         status: 'completed',
//         payment_method: 'razorpay',
//         gateway_response: {
//           order_id: razorpay_order_id,
//           payment_id: razorpay_payment_id,
//           signature: razorpay_signature
//         },
//         created_at: new Date().toISOString()
//       });

//       return subscription;

//     } catch (error) {
//       console.error('Error verifying payment:', error);
//       throw new Error(error instanceof Error ? error.message : 'Failed to verify payment');
//     }
//   }

//   /**
//    * Get current active subscription for user
//    */
//   static async getCurrentSubscription(userEmail: string) {
//     try {
//       const { data, error } = await supabase
//         .from('user_subscriptions')
//         .select(`
//           *,
//           plan:subscription_plans(*)
//         `)
//         .eq('user_email', userEmail)
//         .eq('status', 'active')
//         .gt('ends_at', new Date().toISOString()) // Not expired
//         .order('created_at', { ascending: false })
//         .limit(1)
//         .single();

//       if (error && error.code !== 'PGRST116') {
//         throw error;
//       }

//       return data;
//     } catch (error) {
//       console.error('Error fetching current subscription:', error);
//       return null;
//     }
//   }

//   /**
//    * Cancel subscription (mark as cancelled, but still active until end date)
//    */
//   static async cancelSubscription(subscriptionId: string, userEmail: string) {
//     try {
//       const { data, error } = await supabase
//         .from('user_subscriptions')
//         .update({
//           status: 'cancelled',
//           cancelled_at: new Date().toISOString()
//         })
//         .eq('id', subscriptionId)
//         .eq('user_email', userEmail)
//         .select()
//         .single();

//       if (error) {
//         throw new Error(`Failed to cancel subscription: ${error.message}`);
//       }

//       return data;
//     } catch (error) {
//       console.error('Error cancelling subscription:', error);
//       throw error;
//     }
//   }

//   /**
//    * Check if user can access a feature
//    */
//   static async canAccessFeature(
//     userEmail: string,
//     feature: 'filters' | 'keyword_filter' | 'advanced_filters' | 'api' | 'all_colleges' | 'realtime_alerts'
//   ): Promise<boolean> {
//     try {
//       const subscription = await this.getCurrentSubscription(userEmail);

//       if (!subscription?.plan) {
//         return false; // No active subscription
//       }

//       const plan = subscription.plan;

//       switch (feature) {
//         case 'all_colleges':
//           return plan.colleges_access >= 5;
//         case 'realtime_alerts':
//           return plan.alert_type === 'realtime';
//         case 'filters':
//           return plan.has_filters;
//         case 'keyword_filter':
//           return plan.has_keyword_filter;
//         case 'advanced_filters':
//           return plan.has_advanced_filters;
//         case 'api':
//           return plan.has_api_access;
//         default:
//           return false;
//       }
//     } catch (error) {
//       console.error('Error checking feature access:', error);
//       return false;
//     }
//   }

//   /**
//    * Get payment history for user
//    */
//   static async getPaymentHistory(userEmail: string, limit: number = 10) {
//     try {
//       // Get all subscription IDs for the user
//       const { data: subscriptions } = await supabase
//         .from('user_subscriptions')
//         .select('id')
//         .eq('user_email', userEmail);

//       if (!subscriptions?.length) {
//         return [];
//       }

//       const subscriptionIds = subscriptions.map(s => s.id);

//       const { data, error } = await supabase
//         .from('payment_history')
//         .select(`
//           *,
//           subscription:user_subscriptions(
//             id,
//             plan:subscription_plans(name)
//           )
//         `)
//         .in('subscription_id', subscriptionIds)
//         .order('created_at', { ascending: false })
//         .limit(limit);

//       if (error) throw error;
//       return data || [];
//     } catch (error) {
//       console.error('Error fetching payment history:', error);
//       return [];
//     }
//   }

//   /**
//    * Process expired subscriptions (to be called by cron job)
//    */
//   static async processExpiredSubscriptions() {
//     try {
//       const now = new Date().toISOString();

//       const { data: expiredSubscriptions, error } = await supabase
//         .from('user_subscriptions')
//         .update({ status: 'expired' })
//         .eq('status', 'active')
//         .lt('ends_at', now)
//         .select();

//       if (error) {
//         throw new Error(`Failed to process expired subscriptions: ${error.message}`);
//       }

//       console.log(`Processed ${expiredSubscriptions?.length || 0} expired subscriptions`);
//       return expiredSubscriptions?.length || 0;
//     } catch (error) {
//       console.error('Error processing expired subscriptions:', error);
//       throw error;
//     }
//   }
// }

// src/lib/razorpay-payment.ts - NEW: Simple payment service for one-time payments
import Razorpay from 'razorpay';
import { supabase } from './supabase';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreatePaymentOrderParams {
  userEmail: string;
  planId: string;
  subscriptionType: 'monthly' | 'yearly';
  userId?: string;
}

export interface PaymentVerificationParams {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
  planId: string;
  subscriptionType: 'monthly' | 'yearly';
  userEmail: string;
}

export class RazorpayPaymentService {

  /**
   * Create a payment order for one-time payment
   */
  static async createPaymentOrder({
    userEmail,
    planId,
    subscriptionType,
    userId
  }: CreatePaymentOrderParams) {
    try {
      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        throw new Error('Invalid plan selected');
      }

      // Calculate amount based on subscription type
      const amount = subscriptionType === 'yearly'
        ? plan.price_yearly
        : plan.price_monthly;

      if (amount <= 0) {
        throw new Error('Invalid plan amount');
      }

      // Create Razorpay order
      const order = await razorpay.orders.create({
        amount: Math.round(amount), // Amount in paise
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          planId,
          subscriptionType,
          userEmail,
          userId: userId || '',
          planName: plan.name
        }
      });

      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: {
          name: plan.name,
          description: plan.description,
          features: plan.features
        }
      };

    } catch (error) {
      console.error('Error creating payment order:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to create payment order');
    }
  }

  /**
   * Verify payment and create fixed-duration subscription
   */
  static async verifyPaymentAndCreateSubscription({
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    planId,
    subscriptionType,
    userEmail
  }: PaymentVerificationParams) {
    try {
      // Verify payment signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        throw new Error('Invalid payment signature');
      }

      // Get plan details
      const { data: plan, error: planError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('id', planId)
        .single();

      if (planError || !plan) {
        throw new Error('Invalid plan selected');
      }

      // Calculate subscription dates
      const startDate = new Date();
      const endDate = new Date(startDate);

      if (subscriptionType === 'monthly') {
        endDate.setMonth(endDate.getMonth() + 1);
      } else {
        endDate.setFullYear(endDate.getFullYear() + 1);
      }

      // Create subscription record with fixed duration
      const { data: subscription, error: subscriptionError } = await supabase
        .from('user_subscriptions')
        .insert({
          user_email: userEmail,
          plan_id: planId,
          subscription_type: subscriptionType,
          status: 'active',
          payment_method: 'razorpay',
          razorpay_order_id,
          razorpay_payment_id,
          starts_at: startDate.toISOString(),
          ends_at: endDate.toISOString(),
          amount_paid: subscriptionType === 'yearly' ? plan.price_yearly : plan.price_monthly,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (subscriptionError) {
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }

      // Store payment history
      await supabase.from('payment_history').insert({
        subscription_id: subscription.id,
        amount: subscription.amount_paid,
        currency: 'INR',
        status: 'completed',
        payment_method: 'razorpay',
        gateway_response: {
          order_id: razorpay_order_id,
          payment_id: razorpay_payment_id,
          signature: razorpay_signature
        },
        created_at: new Date().toISOString()
      });

      return subscription;

    } catch (error) {
      console.error('Error verifying payment:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to verify payment');
    }
  }

  /**
   * Get current active subscription for user
   */
  static async getCurrentSubscription(userEmail: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select(`
          *,
          plan:subscription_plans(*)
        `)
        .eq('user_email', userEmail)
        .eq('status', 'active')
        .gt('ends_at', new Date().toISOString()) // Not expired
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching current subscription:', error);
      return null;
    }
  }

  /**
   * Cancel subscription (mark as cancelled, but still active until end date)
   */
  static async cancelSubscription(subscriptionId: string, userEmail: string) {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_email', userEmail)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to cancel subscription: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  }

  /**
   * Check if user can access a feature
   */
  static async canAccessFeature(
    userEmail: string,
    feature: 'filters' | 'keyword_filter' | 'advanced_filters' | 'api' | 'all_colleges' | 'realtime_alerts'
  ): Promise<boolean> {
    try {
      const subscription = await this.getCurrentSubscription(userEmail);

      if (!subscription?.plan) {
        return false; // No active subscription
      }

      const plan = subscription.plan;

      switch (feature) {
        case 'all_colleges':
          return plan.colleges_access >= 5;
        case 'realtime_alerts':
          return plan.alert_type === 'realtime';
        case 'filters':
          return plan.has_filters;
        case 'keyword_filter':
          return plan.has_keyword_filter;
        case 'advanced_filters':
          return plan.has_advanced_filters;
        case 'api':
          return plan.has_api_access;
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking feature access:', error);
      return false;
    }
  }

  /**
   * Get payment history for user
   */
  static async getPaymentHistory(userEmail: string, limit: number = 10) {
    try {
      // Get all subscription IDs for the user
      const { data: subscriptions } = await supabase
        .from('user_subscriptions')
        .select('id')
        .eq('user_email', userEmail);

      if (!subscriptions?.length) {
        return [];
      }

      const subscriptionIds = subscriptions.map(s => s.id);

      const { data, error } = await supabase
        .from('payment_history')
        .select(`
          *,
          subscription:user_subscriptions(
            id,
            plan:subscription_plans(name)
          )
        `)
        .in('subscription_id', subscriptionIds)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  }

  /**
   * Process expired subscriptions (to be called by cron job)
   */
  static async processExpiredSubscriptions() {
    try {
      const now = new Date().toISOString();

      const { data: expiredSubscriptions, error } = await supabase
        .from('user_subscriptions')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('ends_at', now)
        .select();

      if (error) {
        throw new Error(`Failed to process expired subscriptions: ${error.message}`);
      }

      console.log(`Processed ${expiredSubscriptions?.length || 0} expired subscriptions`);
      return expiredSubscriptions?.length || 0;
    } catch (error) {
      console.error('Error processing expired subscriptions:', error);
      throw error;
    }
  }

  /**
   * Extend subscription by specified number of months (Admin only)
   */
  static async extendSubscription(subscriptionId: string, userEmail: string, months: number) {
    try {
      // Validate input
      if (!subscriptionId || !userEmail || !months || months <= 0) {
        throw new Error('Invalid parameters for subscription extension');
      }

      // Get current subscription
      const { data: subscription, error: fetchError } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('id', subscriptionId)
        .eq('user_email', userEmail)
        .single();

      if (fetchError || !subscription) {
        throw new Error('Subscription not found');
      }

      // Calculate new end date
      const currentEndDate = new Date(subscription.ends_at);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + months);

      // Update subscription
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('user_subscriptions')
        .update({
          ends_at: newEndDate.toISOString(),
          status: 'active', // Ensure it's active if it was expired
          updated_at: new Date().toISOString()
        })
        .eq('id', subscriptionId)
        .eq('user_email', userEmail)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to extend subscription: ${updateError.message}`);
      }

      // Log the extension in payment history
      await supabase.from('payment_history').insert({
        subscription_id: subscriptionId,
        amount: 0, // Admin extension, no payment
        currency: 'INR',
        status: 'completed',
        payment_method: 'admin_extension',
        gateway_response: {
          type: 'admin_extension',
          months_extended: months,
          extended_by: 'admin',
          extended_at: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      });

      return updatedSubscription;

    } catch (error) {
      console.error('Error extending subscription:', error);
      throw new Error(error instanceof Error ? error.message : 'Failed to extend subscription');
    }
  }
}
