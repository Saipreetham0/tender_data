

// // src/hooks/useRazorpayPayment.ts - NEW: Simple payment hook
// import { useState, useEffect } from 'react';
// import { useAuth } from '@/contexts/AuthContext';

// interface PaymentPlan {
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
// }

// interface UserSubscription {
//   id: string;
//   plan: PaymentPlan;
//   subscription_type: 'monthly' | 'yearly';
//   status: string;
//   starts_at: string;
//   ends_at: string;
//   amount_paid: number;
// }

// interface PaymentHistory {
//   id: string;
//   amount: number;
//   currency: string;
//   status: string;
//   created_at: string;
// }

// export function useRazorpayPayment() {
//   const { user } = useAuth();
//   const [plans, setPlans] = useState<PaymentPlan[]>([]);
//   const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
//   const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetch plans
//   useEffect(() => {
//     fetchPlans();
//   }, []);

//   // Fetch user subscription and history
//   useEffect(() => {
//     if (user?.email) {
//       fetchUserData();
//     } else {
//       setCurrentSubscription(null);
//       setPaymentHistory([]);
//       setLoading(false);
//     }
//   }, [user]);

//   const fetchPlans = async () => {
//     try {
//       const response = await fetch('/api/subscription/plans');
//       const data = await response.json();
//       if (data.success) {
//         setPlans(data.plans || []);
//       }
//     } catch (err) {
//       console.error('Error fetching plans:', err);
//       setError('Failed to fetch subscription plans');
//     }
//   };

//   const fetchUserData = async () => {
//     if (!user?.email) return;

//     setLoading(true);
//     try {
//       // Fetch current subscription
//       const subResponse = await fetch(`/api/subscription/current?email=${user.email}`);
//       const subData = await subResponse.json();
//       if (subData.success) {
//         setCurrentSubscription(subData.subscription);
//       }

//       // Fetch payment history
//       const historyResponse = await fetch(`/api/subscription/history?email=${user.email}`);
//       const historyData = await historyResponse.json();
//       if (historyData.success) {
//         setPaymentHistory(historyData.payments || []);
//       }
//     } catch (err) {
//       console.error('Error fetching user data:', err);
//       setError('Failed to fetch subscription data');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const createPayment = async (planId: string, subscriptionType: 'monthly' | 'yearly') => {
//     if (!user?.email) {
//       throw new Error('User not authenticated');
//     }

//     try {
//       // Create payment order
//       const orderResponse = await fetch('/api/payment/create-order', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           planId,
//           subscriptionType,
//           userEmail: user.email,
//           userId: user.id
//         })
//       });

//       const orderData = await orderResponse.json();
//       if (!orderData.success) {
//         throw new Error(orderData.error || 'Failed to create payment order');
//       }

//       // Initialize Razorpay checkout
//       const options = {
//         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         amount: orderData.amount,
//         currency: orderData.currency,
//         order_id: orderData.orderId,
//         name: 'RGUKT Tenders Portal',
//         description: `${orderData.plan.name} Subscription`,
//         handler: async function(response: any) {
//           try {
//             // Verify payment
//             const verifyResponse = await fetch('/api/payment/verify', {
//               method: 'POST',
//               headers: { 'Content-Type': 'application/json' },
//               body: JSON.stringify({
//                 razorpay_order_id: response.razorpay_order_id,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//                 planId,
//                 subscriptionType,
//                 userEmail: user.email
//               })
//             });

//             const verifyData = await verifyResponse.json();
//             if (verifyData.success) {
//               // Refresh user data
//               await fetchUserData();
//               alert('Payment successful! Your subscription is now active.');
//             } else {
//               throw new Error(verifyData.error || 'Payment verification failed');
//             }
//           } catch (error) {
//             console.error('Payment verification error:', error);
//             alert('Payment verification failed. Please contact support.');
//           }
//         },
//         prefill: {
//           email: user.email,
//           name: user.profile?.full_name || user.email.split('@')[0]
//         },
//         theme: {
//           color: '#3b82f6'
//         },
//         modal: {
//           ondismiss: function() {
//             console.log('Payment cancelled by user');
//           }
//         }
//       };

//       // @ts-expect-error - Razorpay is loaded via script
//       const razorpay = new window.Razorpay(options);
//       razorpay.open();

//     } catch (error) {
//       console.error('Error creating payment:', error);
//       throw error;
//     }
//   };

//   const cancelSubscription = async () => {
//     if (!currentSubscription || !user?.email) {
//       throw new Error('No active subscription found');
//     }

//     try {
//       const response = await fetch('/api/subscription/cancel', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({
//           subscriptionId: currentSubscription.id,
//           userEmail: user.email
//         })
//       });

//       const data = await response.json();
//       if (data.success) {
//         await fetchUserData();
//         return data.message;
//       } else {
//         throw new Error(data.error || 'Failed to cancel subscription');
//       }
//     } catch (error) {
//       console.error('Error cancelling subscription:', error);
//       throw error;
//     }
//   };

//   const canAccess = (feature: string): boolean => {
//     if (!currentSubscription || currentSubscription.status !== 'active') {
//       // Free tier access
//       switch (feature) {
//         case 'basic_access':
//         case 'single_college':
//           return true;
//         default:
//           return false;
//       }
//     }

//     const plan = currentSubscription.plan;

//     switch (feature) {
//       case 'all_colleges':
//         return plan.colleges_access >= 5;
//       case 'realtime_alerts':
//         return plan.alert_type === 'realtime';
//       case 'filters':
//         return plan.has_filters;
//       case 'keyword_filter':
//         return plan.has_keyword_filter;
//       case 'advanced_filters':
//         return plan.has_advanced_filters;
//       case 'api_access':
//         return plan.has_api_access;
//       default:
//         return false;
//     }
//   };

//   const isSubscriptionExpiringSoon = (): boolean => {
//     if (!currentSubscription || currentSubscription.status !== 'active') {
//       return false;
//     }

//     const endDate = new Date(currentSubscription.ends_at);
//     const now = new Date();
//     const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

//     return daysUntilExpiry <= 7 && daysUntilExpiry > 0;
//   };

//   const getDaysUntilExpiry = (): number => {
//     if (!currentSubscription || currentSubscription.status !== 'active') {
//       return 0;
//     }

//     const endDate = new Date(currentSubscription.ends_at);
//     const now = new Date();
//     return Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
//   };

//   const refreshData = async () => {
//     await fetchUserData();
//   };

//   return {
//     plans,
//     currentSubscription,
//     paymentHistory,
//     loading,
//     error,
//     createPayment,
//     cancelSubscription,
//     canAccess,
//     isSubscriptionExpiringSoon,
//     getDaysUntilExpiry,
//     refreshData
//   };
// }


// // src/hooks/useSubscriptionAccess.ts
// import { useState, useEffect, useCallback } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import type { UserSubscription } from "@/types/subscription";

// interface UseSubscriptionAccessReturn {
//   hasAccess: (feature: string) => boolean;
//   checkUsage: (
//     type: string
//   ) => Promise<{ allowed: boolean; currentUsage: number; limit?: number }>;
//   trackUsage: (type: string) => Promise<void>;
//   loading: boolean;
// }

// export function useSubscriptionAccess(): UseSubscriptionAccessReturn {
//   const { user } = useAuth();
//   const [loading, setLoading] = useState(true);
//   const [subscription, setSubscription] = useState<UserSubscription | null>(
//     null
//   );

//   const fetchSubscription = useCallback(async () => {
//     if (!user?.email) return;

//     try {
//       const response = await fetch(
//         `/api/subscription/current?email=${user.email}`
//       );
//       const data = await response.json();
//       if (data.success) {
//         setSubscription(data.subscription);
//       }
//     } catch (error) {
//       console.error("Error fetching subscription:", error);
//     } finally {
//       setLoading(false);
//     }
//   }, [user?.email]);

//   useEffect(() => {
//     if (user?.email) {
//       fetchSubscription();
//     } else {
//       setLoading(false);
//     }
//   }, [user, fetchSubscription]);

//   const hasAccess = (feature: string): boolean => {
//     if (!subscription || subscription.status !== "active") {
//       // Free tier permissions
//       switch (feature) {
//         case "basic_access":
//           return true;
//         case "single_college":
//           return true;
//         default:
//           return false;
//       }
//     }

//     const plan = subscription.plan;
//     if (!plan) return false;

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

//   const checkUsage = async (type: string) => {
//     if (!user?.email) {
//       return { allowed: false, currentUsage: 0, limit: 0 };
//     }

//     try {
//       const response = await fetch(
//         `/api/subscription/usage?email=${user.email}&type=${type}`
//       );
//       const data = await response.json();
//       return data.usage || { allowed: false, currentUsage: 0, limit: 0 };
//     } catch (error) {
//       console.error("Error checking usage:", error);
//       return { allowed: false, currentUsage: 0, limit: 0 };
//     }
//   };

//   const trackUsage = async (type: string) => {
//     if (!user?.email) return;

//     try {
//       await fetch("/api/subscription/usage", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ email: user.email, usageType: type }),
//       });
//     } catch (error) {
//       console.error("Error tracking usage:", error);
//     }
//   };

//   return {
//     hasAccess,
//     checkUsage,
//     trackUsage,
//     loading,
//   };
// }

// src/hooks/useRazorpayPayment.ts - NEW: Simple payment hook
import { useState, useEffect, useCallback } from 'react';
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

// Make sure this is a named export
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
  const fetchUserData = useCallback(async () => {
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
  }, [user?.email]);

  useEffect(() => {
    if (user?.email) {
      fetchUserData();
    } else {
      setCurrentSubscription(null);
      setPaymentHistory([]);
      setLoading(false);
    }
  }, [user, fetchUserData]);

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
        handler: async function(response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) {
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