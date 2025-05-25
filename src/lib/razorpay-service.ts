

// // src/lib/razorpay-service.ts - Fixed version
// import Razorpay from 'razorpay';
// import { supabase } from './supabase';
// import { logCronExecution } from './cronLogger';

// // Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID!,
//   key_secret: process.env.RAZORPAY_KEY_SECRET!,
// });

// export interface CreateSubscriptionParams {
//   userId?: string;
//   userEmail: string;
//   planId: string;
//   subscriptionType: 'monthly' | 'yearly';
//   collegePreferences?: string[];
// }

// export interface RazorpaySubscriptionData {
//   id: string;
//   entity: string;
//   plan_id: string;
//   customer_id: string;
//   status: string;
//   current_start: number;
//   current_end: number;
//   ended_at: number | null;
//   quantity: number;
//   notes: Record<string, string | number | boolean | null>;
//   charge_at: number;
//   start_at: number;
//   end_at: number;
//   auth_attempts: number;
//   total_count: number;
//   paid_count: number;
//   customer_notify: boolean;
//   created_at: number;
//   expire_by: number | null;
//   short_url: string;
// }

// export class RazorpaySubscriptionService {

//   /**
//    * Sync database plans with Razorpay plans
//    */
//   static async syncPlansWithRazorpay(): Promise<void> {
//     try {
//       console.log('Starting Razorpay plans synchronization...');

//       // Get all active plans from database (exclude Free and Enterprise)
//       const { data: dbPlans, error } = await supabase
//         .from('subscription_plans')
//         .select('*')
//         .eq('is_active', true)
//         .not('name', 'in', '("Free","Enterprise")')
//         .order('display_order');

//       if (error) throw error;
//       if (!dbPlans?.length) {
//         console.log('No plans found to sync');
//         return;
//       }

//       for (const plan of dbPlans) {
//         await this.createOrUpdateRazorpayPlans(plan);
//       }

//       console.log('Razorpay plans synchronization completed successfully');
//     } catch (error) {
//       console.error('Error syncing Razorpay plans:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create or update Razorpay plans for a database plan
//    */
//   private static async createOrUpdateRazorpayPlans(plan: {
//     id: string;
//     name: string;
//     description?: string;
//     price_monthly: number;
//     price_yearly: number;
//     razorpay_plan_id_monthly?: string;
//     razorpay_plan_id_yearly?: string;
//   }): Promise<void> {
//     try {
//       // Create monthly plan if needed and price is valid
//       if (plan.price_monthly > 0 && !plan.razorpay_plan_id_monthly) {
//         // Razorpay requires minimum amount of ₹1 (100 paise)
//         const monthlyAmount = Math.max(plan.price_monthly, 100);

//         const monthlyPlan = await this.createRazorpayPlan({
//           period: 'monthly',
//           interval: 1,
//           item: {
//             name: `${plan.name} - Monthly`,
//             amount: monthlyAmount,
//             currency: 'INR',
//             description: plan.description || `${plan.name} monthly subscription`
//           },
//           notes: {
//             plan_id: plan.id,
//             plan_name: plan.name,
//             type: 'monthly'
//           }
//         });

//         await supabase
//           .from('subscription_plans')
//           .update({ razorpay_plan_id_monthly: monthlyPlan.id })
//           .eq('id', plan.id);

//         console.log(`Created monthly plan for ${plan.name}: ${monthlyPlan.id}`);
//       } else if (plan.price_monthly <= 0) {
//         console.log(`Skipping monthly plan for ${plan.name} - amount too low (${plan.price_monthly})`);
//       }

//       // Create yearly plan if needed and price is valid
//       if (plan.price_yearly > 0 && !plan.razorpay_plan_id_yearly) {
//         // Razorpay requires minimum amount of ₹1 (100 paise)
//         const yearlyAmount = Math.max(plan.price_yearly, 100);

//         const yearlyPlan = await this.createRazorpayPlan({
//           period: 'yearly',
//           interval: 1,
//           item: {
//             name: `${plan.name} - Yearly`,
//             amount: yearlyAmount,
//             currency: 'INR',
//             description: plan.description || `${plan.name} yearly subscription`
//           },
//           notes: {
//             plan_id: plan.id,
//             plan_name: plan.name,
//             type: 'yearly'
//           }
//         });

//         await supabase
//           .from('subscription_plans')
//           .update({ razorpay_plan_id_yearly: yearlyPlan.id })
//           .eq('id', plan.id);

//         console.log(`Created yearly plan for ${plan.name}: ${yearlyPlan.id}`);
//       } else if (plan.price_yearly <= 0) {
//         console.log(`Skipping yearly plan for ${plan.name} - amount too low (${plan.price_yearly})`);
//       }
//     } catch (error) {
//       console.error(`Error creating Razorpay plans for ${plan.name}:`, error);
//       throw error;
//     }
//   }

//   /**
//    * Create a Razorpay plan
//    */
//   private static async createRazorpayPlan(params: {
//     period: 'daily' | 'weekly' | 'monthly' | 'yearly';
//     interval: number;
//     item: {
//       name: string;
//       amount: number;
//       currency: string;
//       description?: string;
//     };
//     notes?: Record<string, string | number | null>;
//   }): Promise<{
//     id: string;
//     entity: string;
//     item: {
//       name: string;
//       amount: number;
//       currency: string;
//       description?: string;
//     };
//     period: string;
//     interval: number;
//     notes: Record<string, string | number | boolean>;
//     created_at: number;
//   }> {
//     try {
//       // Ensure minimum amount requirement
//       if (params.item.amount < 100) {
//         throw new Error(`Amount ${params.item.amount} is below Razorpay minimum of ₹1 (100 paise)`);
//       }

//       // Convert any boolean values in notes to strings
//       const sanitizedParams = {
//         ...params,
//         notes: params.notes ? Object.fromEntries(
//           Object.entries(params.notes).map(([key, value]) => [
//             key,
//             typeof value === 'boolean' ? String(value) : value
//           ])
//         ) : undefined
//       };
//       const plan = await razorpay.plans.create(sanitizedParams);
//       return {
//         id: plan.id,
//         entity: plan.entity,
//         item: {
//           name: plan.item.name,
//           amount: Number(plan.item.amount),
//           currency: plan.item.currency,
//           description: plan.item.description
//         },
//         period: plan.period,
//         interval: plan.interval,
//         notes: plan.notes ? Object.fromEntries(
//           Object.entries(plan.notes).filter(([, v]) => v != null)
//             .map(([k, v]) => [k, String(v)])
//         ) : {},
//         created_at: plan.created_at
//       };
//     } catch (error) {
//       console.error('Error creating Razorpay plan:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create or get Razorpay customer
//    */
//   static async ensureRazorpayCustomer(email: string, name?: string, phone?: string): Promise<string> {
//     try {
//       // Check if customer already exists in our database
//       const { data: existingUser } = await supabase
//         .from('user_subscriptions')
//         .select('razorpay_customer_id')
//         .eq('user_email', email)
//         .not('razorpay_customer_id', 'is', null)
//         .limit(1)
//         .single();

//       if (existingUser?.razorpay_customer_id) {
//         return existingUser.razorpay_customer_id;
//       }

//       // Create new customer in Razorpay
//       const customerData: {
//         email: string;
//         name: string;
//         notes: {
//           source: string;
//           created_at: string;
//         };
//         contact?: string;
//       } = {
//         email,
//         name: name || email.split('@')[0],
//         notes: {
//           source: 'rgukt_tenders_portal',
//           created_at: new Date().toISOString()
//         }
//       };

//       if (phone) {
//         customerData.contact = phone;
//       }

//       const customer = await razorpay.customers.create(customerData);
//       console.log(`Created Razorpay customer: ${customer.id} for ${email}`);

//       return customer.id;
//     } catch (error) {
//       console.error('Error ensuring Razorpay customer:', error);
//       throw error;
//     }
//   }

//   /**
//    * Create a subscription
//    */
//   static async createSubscription({
//     userId,
//     userEmail,
//     planId,
//     subscriptionType,
//     collegePreferences = ['all']
//   }: CreateSubscriptionParams) {
//     try {
//       // Get plan details from database
//       const { data: plan, error: planError } = await supabase
//         .from('subscription_plans')
//         .select('*')
//         .eq('id', planId)
//         .single();

//       if (planError || !plan) {
//         throw new Error('Invalid plan selected');
//       }

//       // Check if this is a free plan
//       if (plan.name.toLowerCase() === 'free') {
//         throw new Error('Free plan does not require payment subscription');
//       }

//       // Get the appropriate Razorpay plan ID
//       const razorpayPlanId = subscriptionType === 'monthly'
//         ? plan.razorpay_plan_id_monthly
//         : plan.razorpay_plan_id_yearly;

//       if (!razorpayPlanId) {
//         throw new Error(`Razorpay plan not configured for ${plan.name} ${subscriptionType}. Please contact support.`);
//       }

//       // Get user profile for additional info
//       const { data: userProfile } = await supabase
//         .from('user_profiles')
//         .select('*')
//         .eq('email', userEmail)
//         .single();

//       // Ensure customer exists
//       const customerId = await this.ensureRazorpayCustomer(
//         userEmail,
//         userProfile?.full_name,
//         userProfile?.phone
//       );

//       // Calculate billing cycle
//       const totalCount = subscriptionType === 'monthly' ? 12 : 1;
//       const startTime = Math.floor(Date.now() / 1000);

//       // Create subscription in Razorpay
//       const subscription = await razorpay.subscriptions.create({
//         plan_id: razorpayPlanId,
//         notify_info: {
//           notify_email: userEmail,
//           notify_phone: userProfile?.phone
//         },
//         quantity: 1,
//         total_count: totalCount,
//         start_at: startTime,
//         expire_by: startTime + (365 * 24 * 60 * 60), // Expire in 1 year
//         customer_notify: 1,
//         notes: {
//           user_id: userId || '',
//           user_email: userEmail,
//           customer_id: customerId,
//           plan_name: plan.name,
//           subscription_type: subscriptionType,
//           colleges: collegePreferences.join(',')
//         }
//       }) as unknown as RazorpaySubscriptionData;

//       // Store subscription in database
//       const { data: dbSubscription, error: dbError } = await supabase
//         .from('user_subscriptions')
//         .insert({
//           user_id: userId,
//           user_email: userEmail,
//           plan_id: planId,
//           subscription_type: subscriptionType,
//           razorpay_subscription_id: subscription.id,
//           razorpay_customer_id: customerId,
//           status: subscription.status,
//           starts_at: new Date(subscription.start_at * 1000).toISOString(),
//           current_period_start: new Date(subscription.current_start * 1000).toISOString(),
//           current_period_end: new Date(subscription.current_end * 1000).toISOString(),
//           next_billing_at: new Date(subscription.charge_at * 1000).toISOString(),
//           total_count: subscription.total_count,
//           paid_count: subscription.paid_count,
//           college_preferences: collegePreferences,
//           amount_paid: 0
//         })
//         .select()
//         .single();

//       if (dbError) {
//         // If database insert fails, cancel the Razorpay subscription
//         try {
//           await razorpay.subscriptions.cancel(subscription.id);
//         } catch (cancelError) {
//           console.error('Error cancelling Razorpay subscription after DB error:', cancelError);
//         }
//         throw dbError;
//       }

//       // Log subscription event
//       await this.logSubscriptionEvent(dbSubscription.id, 'created', {
//         razorpay_subscription_id: subscription.id,
//         plan_name: plan.name,
//         subscription_type: subscriptionType,
//         amount: subscriptionType === 'monthly' ? plan.price_monthly : plan.price_yearly
//       });

//       console.log(`Subscription created successfully: ${subscription.id} for ${userEmail}`);

//       return {
//         subscription: dbSubscription,
//         razorpaySubscription: subscription,
//         plan: plan,
//         checkoutUrl: subscription.short_url
//       };
//     } catch (error) {
//       console.error('Error creating subscription:', error);

//       // Log error to cron logs for monitoring
//       await logCronExecution(
//         'subscription-creation',
//         'error',
//         `Failed to create subscription for ${userEmail}`,
//         'error',
//         { error: error instanceof Error ? error.message : 'Unknown error', userEmail, planId }
//       );

//       throw error;
//     }
//   }

//   // ... (rest of the methods remain the same)

//   /**
//    * Initialize Razorpay plans on app startup
//    */
//   static async initialize() {
//     try {
//       console.log('Initializing Razorpay subscription service...');
//       await this.syncPlansWithRazorpay();
//       console.log('Razorpay subscription service initialized successfully');
//     } catch (error) {
//       console.error('Failed to initialize Razorpay subscription service:', error);
//       // Don't throw here - app should still work even if Razorpay sync fails
//     }
//   }

//   /**
//    * Log subscription event
//    */
//   private static async logSubscriptionEvent(
//     subscriptionId: string,
//     eventType: string,
//     eventData?: Record<string, string | number | boolean | null>
//   ) {
//     try {
//       await supabase
//         .from('subscription_events')
//         .insert({
//           subscription_id: subscriptionId,
//           event_type: eventType,
//           event_data: eventData || {}
//         });
//     } catch (error) {
//       console.error('Error logging subscription event:', error);
//     }
//   }

//   // Add all other methods from the previous artifact...
//   // (updateSubscriptionStatus, cancelSubscription, pauseSubscription, etc.)
// }


// src/lib/razorpay-service.ts
// Replace your existing file with this complete implementation

import Razorpay from 'razorpay';
import { supabase } from './supabase';
import { logCronExecution } from './cronLogger';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export interface CreateSubscriptionParams {
  userId?: string;
  userEmail: string;
  planId: string;
  subscriptionType: 'monthly' | 'yearly';
  collegePreferences?: string[];
}

export class RazorpaySubscriptionService {

  /**
   * Get user's current active subscription
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
   * Create a subscription
   */
  static async createSubscription({
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

      // Check if this is a free plan
      if (plan.name.toLowerCase() === 'free') {
        throw new Error('Free plan does not require payment subscription');
      }

      // Get the appropriate Razorpay plan ID
      const razorpayPlanId = subscriptionType === 'monthly'
        ? plan.razorpay_plan_id_monthly
        : plan.razorpay_plan_id_yearly;

      if (!razorpayPlanId) {
        throw new Error(`Razorpay plan not configured for ${plan.name} ${subscriptionType}. Please contact support.`);
      }

      // Get user profile for additional info
      const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', userEmail)
        .single();

      // Ensure customer exists
      const customerId = await this.ensureRazorpayCustomer(
        userEmail,
        userProfile?.full_name,
        userProfile?.phone
      );

      // Calculate billing cycle
      const totalCount = subscriptionType === 'monthly' ? 12 : 1;
      const startTime = Math.floor(Date.now() / 1000);

      // Create subscription in Razorpay
      const subscription = await razorpay.subscriptions.create({
        plan_id: razorpayPlanId,
        customer_id: customerId,
        quantity: 1,
        total_count: totalCount,
        start_at: startTime,
        expire_by: startTime + (365 * 24 * 60 * 60), // Expire in 1 year
        customer_notify: 1,
        notes: {
          user_id: userId || '',
          user_email: userEmail,
          plan_name: plan.name,
          subscription_type: subscriptionType,
          colleges: collegePreferences.join(',')
        }
      });

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
          paid_count: subscription.paid_count,
          college_preferences: collegePreferences,
          amount_paid: 0
        })
        .select()
        .single();

      if (dbError) {
        // If database insert fails, cancel the Razorpay subscription
        try {
          await razorpay.subscriptions.cancel(subscription.id);
        } catch (cancelError) {
          console.error('Error cancelling Razorpay subscription after DB error:', cancelError);
        }
        throw dbError;
      }

      // Log subscription event
      await this.logSubscriptionEvent(dbSubscription.id, 'created', {
        razorpay_subscription_id: subscription.id,
        plan_name: plan.name,
        subscription_type: subscriptionType,
        amount: subscriptionType === 'monthly' ? plan.price_monthly : plan.price_yearly
      });

      console.log(`Subscription created successfully: ${subscription.id} for ${userEmail}`);

      return {
        subscription: dbSubscription,
        razorpaySubscription: subscription,
        plan: plan,
        checkoutUrl: subscription.short_url
      };
    } catch (error) {
      console.error('Error creating subscription:', error);

      // Log error to cron logs for monitoring
      await logCronExecution(
        'subscription-creation',
        'error',
        `Failed to create subscription for ${userEmail}`,
        'error',
        { error: error instanceof Error ? error.message : 'Unknown error', userEmail, planId }
      );

      throw error;
    }
  }

  /**
   * Create or get Razorpay customer
   */
  static async ensureRazorpayCustomer(email: string, name?: string, phone?: string): Promise<string> {
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
      const customerData: any = {
        email,
        name: name || email.split('@')[0],
        notes: {
          source: 'rgukt_tenders_portal',
          created_at: new Date().toISOString()
        }
      };

      if (phone) {
        customerData.contact = phone;
      }

      const customer = await razorpay.customers.create(customerData);
      console.log(`Created Razorpay customer: ${customer.id} for ${email}`);

      return customer.id;
    } catch (error) {
      console.error('Error ensuring Razorpay customer:', error);
      throw error;
    }
  }

  /**
   * Sync database plans with Razorpay plans
   */
  static async syncPlansWithRazorpay(): Promise<void> {
    try {
      console.log('Starting Razorpay plans synchronization...');

      // Get all active plans from database (exclude Free and Enterprise)
      const { data: dbPlans, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .not('name', 'in', '("Free","Enterprise")')
        .order('display_order');

      if (error) throw error;
      if (!dbPlans?.length) {
        console.log('No plans found to sync');
        return;
      }

      for (const plan of dbPlans) {
        await this.createOrUpdateRazorpayPlans(plan);
      }

      console.log('Razorpay plans synchronization completed successfully');
    } catch (error) {
      console.error('Error syncing Razorpay plans:', error);
      throw error;
    }
  }

  /**
   * Create or update Razorpay plans for a database plan
   */
  private static async createOrUpdateRazorpayPlans(plan: any): Promise<void> {
    try {
      // Create monthly plan if needed and price is valid
      if (plan.price_monthly > 0 && !plan.razorpay_plan_id_monthly) {
        // Razorpay requires minimum amount of ₹1 (100 paise)
        const monthlyAmount = Math.max(plan.price_monthly, 100);

        const monthlyPlan = await this.createRazorpayPlan({
          period: 'monthly',
          interval: 1,
          item: {
            name: `${plan.name} - Monthly`,
            amount: monthlyAmount,
            currency: 'INR',
            description: plan.description || `${plan.name} monthly subscription`
          },
          notes: {
            plan_id: plan.id,
            plan_name: plan.name,
            type: 'monthly'
          }
        });

        await supabase
          .from('subscription_plans')
          .update({ razorpay_plan_id_monthly: monthlyPlan.id })
          .eq('id', plan.id);

        console.log(`Created monthly plan for ${plan.name}: ${monthlyPlan.id}`);
      }

      // Create yearly plan if needed and price is valid
      if (plan.price_yearly > 0 && !plan.razorpay_plan_id_yearly) {
        // Razorpay requires minimum amount of ₹1 (100 paise)
        const yearlyAmount = Math.max(plan.price_yearly, 100);

        const yearlyPlan = await this.createRazorpayPlan({
          period: 'yearly',
          interval: 1,
          item: {
            name: `${plan.name} - Yearly`,
            amount: yearlyAmount,
            currency: 'INR',
            description: plan.description || `${plan.name} yearly subscription`
          },
          notes: {
            plan_id: plan.id,
            plan_name: plan.name,
            type: 'yearly'
          }
        });

        await supabase
          .from('subscription_plans')
          .update({ razorpay_plan_id_yearly: yearlyPlan.id })
          .eq('id', plan.id);

        console.log(`Created yearly plan for ${plan.name}: ${yearlyPlan.id}`);
      }
    } catch (error) {
      console.error(`Error creating Razorpay plans for ${plan.name}:`, error);
      throw error;
    }
  }

  /**
   * Create a Razorpay plan
   */
  private static async createRazorpayPlan(params: {
    period: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    item: {
      name: string;
      amount: number;
      currency: string;
      description?: string;
    };
    notes?: Record<string, any>;
  }): Promise<any> {
    try {
      // Ensure minimum amount requirement
      if (params.item.amount < 100) {
        throw new Error(`Amount ${params.item.amount} is below Razorpay minimum of ₹1 (100 paise)`);
      }

      const plan = await razorpay.plans.create(params);
      return plan;
    } catch (error) {
      console.error('Error creating Razorpay plan:', error);
      throw error;
    }
  }

  /**
   * Get payment history for a user
   */
  static async getPaymentHistory(userEmail: string, limit: number = 10) {
    try {
      // First get all subscription IDs for the user
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
   * Check if user can access a feature based on their subscription
   */
  static async canAccessFeature(
    userEmail: string,
    feature: 'filters' | 'keyword_filter' | 'advanced_filters' | 'api' | 'all_colleges' | 'realtime_alerts'
  ): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('user_subscriptions')
        .select(`
          status,
          plan:subscription_plans!inner (
            colleges_access,
            alert_type,
            has_filters,
            has_keyword_filter,
            has_advanced_filters,
            has_api_access
          )
        `)
        .eq('user_email', userEmail)
        .eq('status', 'active')
        .single();

      if (!data?.plan) return false;

      const plan = data.plan;

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
   * Log subscription event
   */
  private static async logSubscriptionEvent(
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

  /**
   * Initialize Razorpay plans on app startup
   */
  static async initialize() {
    try {
      console.log('Initializing Razorpay subscription service...');
      await this.syncPlansWithRazorpay();
      console.log('Razorpay subscription service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Razorpay subscription service:', error);
      // Don't throw here - app should still work even if Razorpay sync fails
    }
  }
}