// // src/hooks/useRazorpayPayment.ts
// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthContext";

// interface SubscriptionPlan {
//   id: string;
//   name: string;
//   description: string;
//   price_monthly: number;
//   price_yearly: number;
//   features: string[];
//   colleges_access: number;
//   alert_type: string;
//   has_filters: boolean;
//   has_keyword_filter: boolean;
//   has_advanced_filters: boolean;
//   has_api_access: boolean;
//   popular?: boolean;
//   display_order: number;
// }

// interface UserSubscription {
//   id: string;
//   plan: SubscriptionPlan;
//   subscription_type: "monthly" | "yearly";
//   status: string;
//   current_period_end: string;
//   amount_paid: number;
//   payment_method: string;
//   created_at: string;
// }

// interface UseRazorpayPaymentReturn {
//   plans: SubscriptionPlan[];
//   currentSubscription: UserSubscription | null;
//   loading: boolean;
//   error: string | null;
//   createPayment: (planId: string, type: "monthly" | "yearly") => Promise<void>;
//   cancelSubscription: () => Promise<void>;
//   canAccess: (feature: string) => boolean;
//   refreshSubscription: () => Promise<void>;
// }

// export function useRazorpayPayment(): UseRazorpayPaymentReturn {
//   const { user } = useAuth();
//   const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
//   const [currentSubscription, setCurrentSubscription] =
//     useState<UserSubscription | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch plans on mount
//   useEffect(() => {
//     fetchPlans();
//   }, []);

//   // Fetch user subscription when user changes
//   useEffect(() => {
//     if (user?.email) {
//       fetchUserSubscription();
//     } else {
//       setCurrentSubscription(null);
//     }
//   }, [user, fetchUserSubscription]);

//   const fetchPlans = async () => {
//     try {
//       const response = await fetch("/api/subscription/plans");
//       const data = await response.json();
//       if (data.success) {
//         setPlans(data.plans);
//       }
//     } catch {
//       setError("Failed to fetch subscription plans");
//     }
//   };

//   const fetchUserSubscription = async () => {
//     if (!user?.email) return;

//     setLoading(true);
//     try {
//       const response = await fetch(
//         `/api/subscription/current?email=${user.email}`
//       );
//       const data = await response.json();
//       if (data.success) {
//         setCurrentSubscription(data.subscription);
//       }
//     } catch {
//       setError("Failed to fetch subscription");
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createPayment = async (planId: string, type: "monthly" | "yearly") => {
//     if (!user?.email) {
//       throw new Error("User not authenticated");
//     }

//     const response = await fetch("/api/subscription/create", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         planId,
//         subscriptionType: type,
//         userEmail: user.email,
//         userId: user.id,
//       }),
//     });

//     const data = await response.json();

//     if (!data.success) {
//       throw new Error(data.error || "Failed to create payment");
//     }

//     // Return the payment data for Razorpay checkout
//     return data;
//   };

//   const cancelSubscription = async () => {
//     if (!currentSubscription) return;

//     const response = await fetch("/api/subscription/cancel", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         subscriptionId: currentSubscription.id,
//         userEmail: user?.email,
//       }),
//     });

//     if (response.ok) {
//       await fetchUserSubscription();
//     } else {
//       throw new Error("Failed to cancel subscription");
//     }
//   };

//   const canAccess = (feature: string): boolean => {
//     if (!currentSubscription || currentSubscription.status !== "active") {
//       // Check free tier access
//       switch (feature) {
//         case "basic_access":
//           return true;
//         case "single_college":
//           return true;
//         default:
//           return false;
//       }
//     }

//     const plan = currentSubscription.plan;

//     switch (feature) {
//       case "all_colleges":
//         return plan.colleges_access >= 5;
//       case "realtime_alerts":
//         return plan.alert_type === "realtime";
//       case "filters":
//         return plan.has_filters;
//       case "keyword_filter":
//         return plan.has_keyword_filter;
//       case "advanced_filters":
//         return plan.has_advanced_filters;
//       case "api_access":
//         return plan.has_api_access;
//       default:
//         return false;
//     }
//   };

//   const refreshSubscription = async () => {
//     await fetchUserSubscription();
//   };

//   return {
//     plans,
//     currentSubscription,
//     loading,
//     error,
//     createPayment,
//     cancelSubscription,
//     canAccess,
//     refreshSubscription,
//   };
// }


// src/hooks/useRazorpayPayment.ts - NEW: Simple payment hook
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  colleges_access: number;
  alert_type: string;
  has_filters: boolean;
  has_keyword_filter: boolean;
  has_advanced_filters: boolean;
  has_api_access: boolean;
}

interface UserSubscription {
  id: string;
  plan: PaymentPlan;
  subscription_type: 'monthly' | 'yearly';
  status: string;
  starts_at: string;
  ends_at: string;
  amount_paid: number;
}

interface PaymentHistory {
  id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

export function useRazorpayPayment() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans
  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch user subscription and history
  useEffect(() => {
    if (user?.email) {
      fetchUserData();
    } else {
      setCurrentSubscription(null);
      setPaymentHistory([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans || []);
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to fetch subscription plans');
    }
  };

  const fetchUserData = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      // Fetch current subscription
      const subResponse = await fetch(`/api/subscription/current?email=${user.email}`);
      const subData = await subResponse.json();
      if (subData.success) {
        setCurrentSubscription(subData.subscription);
      }

      // Fetch payment history
      const historyResponse = await fetch(`/api/subscription/history?email=${user.email}`);
      const historyData = await historyResponse.json();
      if (historyData.success) {
        setPaymentHistory(historyData.payments || []);
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to fetch subscription data');
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (planId: string, subscriptionType: 'monthly' | 'yearly') => {
    if (!user?.email) {
      throw new Error('User not authenticated');
    }

    try {
      // Create payment order
      const orderResponse = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId,
          subscriptionType,
          userEmail: user.email,
          userId: user.id
        })
      });

      const orderData = await orderResponse.json();
      if (!orderData.success) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Initialize Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency,
        order_id: orderData.orderId,
        name: 'RGUKT Tenders Portal',
        description: `${orderData.plan.name} Subscription`,
        handler: async function(response: any) {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/payment/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId,
                subscriptionType,
                userEmail: user.email
              })
            });

            const verifyData = await verifyResponse.json();
            if (verifyData.success) {
              // Refresh user data
              await fetchUserData();
              alert('Payment successful! Your subscription is now active.');
            } else {
              throw new Error(verifyData.error || 'Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          email: user.email,
          name: user.profile?.full_name || user.email.split('@')[0]
        },
        theme: {
          color: '#3b82f6'
        },
        modal: {
          ondismiss: function() {
            console.log('Payment cancelled by user');
          }
        }
      };

      // @ts-expect-error - Razorpay is loaded via script
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  };

  const cancelSubscription = async () => {
    if (!currentSubscription || !user?.email) {
      throw new Error('No active subscription found');
    }

    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          userEmail: user.email
        })
      });

      const data = await response.json();
      if (data.success) {
        await fetchUserData();
        return data.message;
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      throw error;
    }
  };

  const canAccess = (feature: string): boolean => {
    if (!currentSubscription || currentSubscription.status !== 'active') {
      // Free tier access
      switch (feature) {
        case 'basic_access':
        case 'single_college':
          return true;
        default:
          return false;
      }
    }

    const plan = currentSubscription.plan;

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
      case 'api_access':
        return plan.has_api_access;
      default:
        return false;
    }
  };

  const isSubscriptionExpiringSoon = (): boolean => {
    if (!currentSubscription || currentSubscription.status !== 'active') {
      return false;
    }

    const endDate = new Date(currentSubscription.ends_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
  };

  const getDaysUntilExpiry = (): number => {
    if (!currentSubscription || currentSubscription.status !== 'active') {
      return 0;
    }

    const endDate = new Date(currentSubscription.ends_at);
    const now = new Date();
    return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const refreshData = async () => {
    await fetchUserData();
  };

  return {
    plans,
    currentSubscription,
    paymentHistory,
    loading,
    error,
    createPayment,
    cancelSubscription,
    canAccess,
    isSubscriptionExpiringSoon,
    getDaysUntilExpiry,
    refreshData
  };
}