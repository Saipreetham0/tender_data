// // src/lib/razorpay-payment.ts
// import Razorpay from "razorpay";
// import crypto from "crypto";
// import { supabase } from "./supabase";
// import type { SubscriptionPlan, PaymentHistory } from "@/types/subscription";
// // import { logCronExecution } from './cronLogger';

// // Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export interface CreatePaymentParams {
//   userId?: string;
//   userEmail: string;
//   planId: string;
//   subscriptionType: "monthly" | "yearly";
//   collegePreferences?: string[];
// }

// export interface PaymentOrder {
//   id: string;
//   amount: number;
//   currency: string;
//   receipt: string;
//   status: string;
//   created_at: number;
// }

// export interface PaymentVerification {
//   razorpay_order_id: string;
//   razorpay_payment_id: string;
//   razorpay_signature: string;
// }

// export interface UserSubscription {
//   id: string;
//   user_id?: string;
//   user_email: string;
//   plan_id: string;
//   subscription_type: "monthly" | "yearly";
//   status: "active" | "cancelled" | "expired" | "pending";
//   starts_at: string;
//   current_period_start: string;
//   current_period_end: string;
//   next_billing_at: string;
//   cancelled_at?: string;
//   college_preferences?: string[];
//   amount_paid: number;
//   payment_method: string;
//   razorpay_order_id?: string;
//   razorpay_payment_id?: string;
//   created_at: string;
//   updated_at: string;
//   plan?: SubscriptionPlan;
// }

// interface SubscriptionData {
//   userId?: string;
//   userEmail: string;
//   planId: string;
//   subscriptionType: "monthly" | "yearly";
//   collegePreferences: string[];
//   amount: number;
//   orderId: string;
// }

// export class RazorpayPaymentService {
//   /**
//    * Create a payment order for subscription
//    */
//   static async createPaymentOrder({
//     userId,
//     userEmail,
//     planId,
//     subscriptionType,
//     collegePreferences = ["all"],
//   }: CreatePaymentParams): Promise<{
//     order: PaymentOrder;
//     plan: SubscriptionPlan;
//     subscriptionData: SubscriptionData;
//   }> {
//     try {
//       // Get plan details from database
//       const { data: plan, error: planError } = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .eq("id", planId)
//         .single();

//       if (planError || !plan) {
//         throw new Error("Invalid plan selected");
//       }

//       // Check if this is a free plan
//       if (plan.name.toLowerCase() === "free") {
//         throw new Error("Free plan does not require payment");
//       }

//       // Check if user already has an active subscription
//       const existingSubscription = await this.getCurrentSubscription(userEmail);
//       if (existingSubscription && existingSubscription.status === "active") {
//         throw new Error("User already has an active subscription");
//       }

//       // Calculate amount based on subscription type
//       const amount =
//         subscriptionType === "yearly" ? plan.price_yearly : plan.price_monthly;

//       if (amount <= 0) {
//         throw new Error("Invalid plan amount");
//       }

//       // Create Razorpay order
//       const order = await razorpay.orders.create({
//         amount: amount, // Amount is already in paise in our database
//         currency: "INR",
//         receipt: `sub_${Date.now()}_${userEmail.split("@")[0]}`,
//         notes: {
//           planId,
//           subscriptionType,
//           userEmail,
//           userId: userId || "",
//           planName: plan.name,
//           collegePreferences: collegePreferences.join(","),
//         },
//       });

//       // Store pending subscription data (will be activated after payment)
//       const subscriptionData: SubscriptionData = {
//         userId,
//         userEmail,
//         planId,
//         subscriptionType,
//         collegePreferences,
//         amount,
//         orderId: order.id,
//       };

//       console.log(`Payment order created: ${order.id} for ${userEmail}`);

//       return {
//         order: order as PaymentOrder,
//         plan: plan as SubscriptionPlan,
//         subscriptionData,
//       };
//     } catch (error) {
//       console.error("Error creating payment order:", error);
//       throw error;
//     }
//   }

//   /**
//    * Verify payment and activate subscription
//    */
//   static async verifyPaymentAndActivateSubscription(
//     paymentVerification: PaymentVerification,
//     orderData: {
//       planId: string;
//       subscriptionType: "monthly" | "yearly";
//       userEmail: string;
//       userId?: string;
//       collegePreferences?: string[];
//     }
//   ): Promise<UserSubscription> {
//     try {
//       // Verify payment signature
//       const isValid = this.verifyPaymentSignature(paymentVerification);
//       if (!isValid) {
//         throw new Error("Invalid payment signature");
//       }

//       // Get order details from Razorpay
//       const order = await razorpay.orders.fetch(
//         paymentVerification.razorpay_order_id
//       );

//       // Get plan details
//       const { data: plan, error: planError } = await supabase
//         .from("subscription_plans")
//         .select("*")
//         .eq("id", orderData.planId)
//         .single();

//       if (planError || !plan) {
//         throw new Error("Plan not found");
//       }

//       // Calculate billing dates
//       const startDate = new Date();
//       const endDate = new Date(startDate);
//       const nextBillingDate = new Date(startDate);

//       if (orderData.subscriptionType === "monthly") {
//         endDate.setMonth(endDate.getMonth() + 1);
//         nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
//       } else {
//         endDate.setFullYear(endDate.getFullYear() + 1);
//         nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
//       }

//       // Create subscription in database
//       const { data: subscription, error: dbError } = await supabase
//         .from("user_subscriptions")
//         .insert({
//           user_id: orderData.userId,
//           user_email: orderData.userEmail,
//           plan_id: orderData.planId,
//           subscription_type: orderData.subscriptionType,
//           status: "active",
//           starts_at: startDate.toISOString(),
//           current_period_start: startDate.toISOString(),
//           current_period_end: endDate.toISOString(),
//           next_billing_at: nextBillingDate.toISOString(),
//           college_preferences: orderData.collegePreferences || ["all"],
//           amount_paid: Number(order.amount),
//           payment_method: "razorpay",
//           razorpay_order_id: paymentVerification.razorpay_order_id,
//           razorpay_payment_id: paymentVerification.razorpay_payment_id,
//           created_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (dbError) {
//         throw dbError;
//       }

//       // Store payment history
//       await this.createPaymentRecord({
//         subscription_id: subscription.id,
//         amount: Number(order.amount),
//         currency: "INR",
//         status: "completed",
//         payment_method: "razorpay",
//         razorpay_order_id: paymentVerification.razorpay_order_id,
//         razorpay_payment_id: paymentVerification.razorpay_payment_id,
//         razorpay_signature: paymentVerification.razorpay_signature,
//       });

//       // Log subscription event
//       await this.logSubscriptionEvent(subscription.id, "payment_completed", {
//         plan_name: plan.name,
//         subscription_type: orderData.subscriptionType,
//         amount: order.amount,
//         payment_method: "razorpay",
//         razorpay_payment_id: paymentVerification.razorpay_payment_id,
//       });

//       console.log(
//         `Payment verified and subscription activated: ${subscription.id} for ${orderData.userEmail}`
//       );

//       return subscription;
//     } catch (error) {
//       console.error(
//         "Error verifying payment and activating subscription:",
//         error
//       );
//       throw error;
//     }
//   }

//   /**
//    * Verify Razorpay payment signature
//    */
//   static verifyPaymentSignature(
//     paymentVerification: PaymentVerification
//   ): boolean {
//     try {
//       const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
//         paymentVerification;

//       const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
//         .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//         .digest("hex");

//       return expectedSignature === razorpay_signature;
//     } catch (error) {
//       console.error("Error verifying payment signature:", error);
//       return false;
//     }
//   }

//   /**
//    * Get user's current active subscription
//    */
//   static async getCurrentSubscription(
//     userEmail: string
//   ): Promise<UserSubscription | null> {
//     try {
//       const { data, error } = await supabase
//         .from("user_subscriptions")
//         .select(
//           `
//           *,
//           plan:subscription_plans(*)
//         `
//         )
//         .eq("user_email", userEmail)
//         .in("status", ["active", "pending"])
//         .order("created_at", { ascending: false })
//         .limit(1)
//         .single();

//       if (error && error.code !== "PGRST116") {
//         throw error;
//       }

//       return data;
//     } catch (error) {
//       console.error("Error fetching current subscription:", error);
//       return null;
//     }
//   }

//   /**
//    * Cancel a subscription
//    */
//   static async cancelSubscription(
//     subscriptionId: string,
//     userEmail: string
//   ): Promise<UserSubscription> {
//     try {
//       // Verify ownership
//       const { data: subscription } = await supabase
//         .from("user_subscriptions")
//         .select("*")
//         .eq("id", subscriptionId)
//         .eq("user_email", userEmail)
//         .single();

//       if (!subscription) {
//         throw new Error("Subscription not found or unauthorized");
//       }

//       if (subscription.status === "cancelled") {
//         throw new Error("Subscription is already cancelled");
//       }

//       // Update subscription status
//       const { data: updatedSubscription, error } = await supabase
//         .from("user_subscriptions")
//         .update({
//           status: "cancelled",
//           cancelled_at: new Date().toISOString(),
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", subscriptionId)
//         .eq("user_email", userEmail)
//         .select()
//         .single();

//       if (error) {
//         throw error;
//       }

//       // Log subscription event
//       await this.logSubscriptionEvent(subscriptionId, "cancelled", {
//         cancelled_at: new Date().toISOString(),
//         cancelled_by: "user",
//       });

//       console.log(`Subscription cancelled: ${subscriptionId}`);

//       return updatedSubscription;
//     } catch (error) {
//       console.error("Error cancelling subscription:", error);
//       throw error;
//     }
//   }

//   /**
//    * Check if user can access a feature
//    */
//   static async canAccessFeature(
//     userEmail: string,
//     feature:
//       | "filters"
//       | "keyword_filter"
//       | "advanced_filters"
//       | "api"
//       | "all_colleges"
//       | "realtime_alerts"
//   ): Promise<boolean> {
//     try {
//       const subscription = await this.getCurrentSubscription(userEmail);

//       // If no active subscription, check free tier access
//       if (!subscription || subscription.status !== "active") {
//         switch (feature) {
//           case "filters":
//             return false;
//           case "keyword_filter":
//             return false;
//           case "advanced_filters":
//             return false;
//           case "api":
//             return false;
//           case "all_colleges":
//             return false; // Only one college in free tier
//           case "realtime_alerts":
//             return false; // Only weekly alerts in free tier
//           default:
//             return false;
//         }
//       }

//       const plan = subscription.plan;
//       if (!plan) return false;

//       switch (feature) {
//         case "all_colleges":
//           return plan.colleges_access >= 5;
//         case "realtime_alerts":
//           return plan.alert_type === "realtime";
//         case "filters":
//           return plan.has_filters;
//         case "keyword_filter":
//           return plan.has_keyword_filter;
//         case "advanced_filters":
//           return plan.has_advanced_filters;
//         case "api":
//           return plan.has_api_access;
//         default:
//           return false;
//       }
//     } catch (error) {
//       console.error("Error checking feature access:", error);
//       return false;
//     }
//   }

//   /**
//    * Get payment history
//    */
//   static async getPaymentHistory(
//     userEmail: string,
//     limit: number = 10
//   ): Promise<PaymentHistory[]> {
//     try {
//       const { data, error } = await supabase
//         .from("payment_history")
//         .select(
//           `
//           *,
//           subscription:user_subscriptions!inner(
//             user_email,
//             plan:subscription_plans(name)
//           )
//         `
//         )
//         .eq("subscription.user_email", userEmail)
//         .order("created_at", { ascending: false })
//         .limit(limit);

//       if (error) throw error;

//       return data || [];
//     } catch (error) {
//       console.error("Error fetching payment history:", error);
//       return [];
//     }
//   }

//   /**
//    * Create payment record
//    */
//   static async createPaymentRecord(paymentData: {
//     subscription_id: string;
//     amount: number;
//     currency: string;
//     status: string;
//     payment_method: string;
//     razorpay_order_id?: string;
//     razorpay_payment_id?: string;
//     razorpay_signature?: string;
//   }): Promise<PaymentHistory> {
//     try {
//       const { data, error } = await supabase
//         .from("payment_history")
//         .insert({
//           ...paymentData,
//           gateway_response: {
//             order_id: paymentData.razorpay_order_id,
//             payment_id: paymentData.razorpay_payment_id,
//             signature: paymentData.razorpay_signature,
//           },
//           created_at: new Date().toISOString(),
//         })
//         .select()
//         .single();

//       if (error) throw error;

//       return data;
//     } catch (error) {
//       console.error("Error creating payment record:", error);
//       throw error;
//     }
//   }

//   /**
//    * Process expired subscriptions
//    */
//   static async processExpiredSubscriptions(): Promise<void> {
//     try {
//       const now = new Date().toISOString();

//       // Find expired subscriptions
//       const { data: expiredSubscriptions, error } = await supabase
//         .from("user_subscriptions")
//         .select("*")
//         .eq("status", "active")
//         .lt("current_period_end", now);

//       if (error) {
//         throw error;
//       }

//       if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
//         console.log("No expired subscriptions found");
//         return;
//       }

//       console.log(
//         `Processing ${expiredSubscriptions.length} expired subscriptions`
//       );

//       // Update expired subscriptions
//       for (const subscription of expiredSubscriptions) {
//         await supabase
//           .from("user_subscriptions")
//           .update({
//             status: "expired",
//             updated_at: new Date().toISOString(),
//           })
//           .eq("id", subscription.id);

//         // Log expiration
//         await this.logSubscriptionEvent(subscription.id, "expired", {
//           expired_at: now,
//           auto_processed: true,
//         });

//         console.log(
//           `Subscription expired: ${subscription.id} for ${subscription.user_email}`
//         );
//       }

//       console.log(
//         `Processed ${expiredSubscriptions.length} expired subscriptions`
//       );
//     } catch (error) {
//       console.error("Error processing expired subscriptions:", error);
//     }
//   }

//   /**
//    * Log subscription event
//    */
//   private static async logSubscriptionEvent(
//     subscriptionId: string,
//     eventType: string,
//     eventData?: Record<string, unknown>
//   ) {
//     try {
//       await supabase.from("subscription_events").insert({
//         subscription_id: subscriptionId,
//         event_type: eventType,
//         event_data: eventData || {},
//         created_at: new Date().toISOString(),
//       });
//     } catch (error) {
//       console.error("Error logging subscription event:", error);
//     }
//   }

//   /**
//    * Extend subscription manually (for admin)
//    */
//   static async extendSubscription(
//     subscriptionId: string,
//     userEmail: string,
//     months: number = 1
//   ): Promise<UserSubscription> {
//     try {
//       const { data: subscription, error: fetchError } = await supabase
//         .from("user_subscriptions")
//         .select("*")
//         .eq("id", subscriptionId)
//         .eq("user_email", userEmail)
//         .single();

//       if (fetchError || !subscription) {
//         throw new Error("Subscription not found");
//       }

//       // Calculate new end date
//       const newEndDate = new Date(subscription.current_period_end);
//       newEndDate.setMonth(newEndDate.getMonth() + months);

//       const newBillingDate = new Date(newEndDate);

//       // Update subscription
//       const { data: updatedSubscription, error: updateError } = await supabase
//         .from("user_subscriptions")
//         .update({
//           current_period_end: newEndDate.toISOString(),
//           next_billing_at: newBillingDate.toISOString(),
//           status: "active",
//           updated_at: new Date().toISOString(),
//         })
//         .eq("id", subscriptionId)
//         .select()
//         .single();

//       if (updateError) {
//         throw updateError;
//       }

//       // Log the extension
//       await this.logSubscriptionEvent(subscriptionId, "extended", {
//         months_added: months,
//         new_end_date: newEndDate.toISOString(),
//         extended_by: "admin",
//       });

//       console.log(
//         `Subscription extended: ${subscriptionId} by ${months} months`
//       );

//       return updatedSubscription;
//     } catch (error) {
//       console.error("Error extending subscription:", error);
//       throw error;
//     }
//   }

//   /**
//    * Initialize service
//    */
//   static async initialize(): Promise<void> {
//     try {
//       console.log("Initializing Razorpay Payment Service...");

//       // Start the expired subscription processor
//       this.processExpiredSubscriptions().catch(console.error);

//       console.log("Razorpay Payment Service initialized successfully");
//     } catch (error) {
//       console.error("Failed to initialize Razorpay Payment Service:", error);
//     }
//   }
// }


// src/lib/razorpay-payment.ts - NEW: Simple payment service for one-time payments
import Razorpay from 'razorpay';
import { supabase } from './supabase';

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
      const crypto = require('crypto');
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
}