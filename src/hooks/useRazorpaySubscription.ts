// // src/hooks/useRazorpaySubscription.ts
// import { useState, useEffect } from "react";
// import { useAuth } from "@/contexts/AuthContext";

// interface SubscriptionPlan {
//   id: string;
//   name: string;
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
//   plan: SubscriptionPlan;
//   subscription_type: "monthly" | "yearly";
//   status: string;
//   current_period_end: string;
//   razorpay_subscription_id: string;
// }

// interface UseRazorpaySubscriptionReturn {
//   plans: SubscriptionPlan[];
//   currentSubscription: UserSubscription | null;
//   loading: boolean;
//   error: string | null;
//   createSubscription: (
//     planId: string,
//     type: "monthly" | "yearly"
//   ) => Promise<void>;
//   cancelSubscription: () => Promise<void>;
//   pauseSubscription: () => Promise<void>;
//   resumeSubscription: () => Promise<void>;
//   changePlan: (newPlanId: string, type: "monthly" | "yearly") => Promise<void>;
//   canAccess: (feature: string) => boolean;
//   refreshSubscription: () => Promise<void>;
// }

// export function useRazorpaySubscription(): UseRazorpaySubscriptionReturn {
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
//   }, [user]);

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

//   const createSubscription = async (
//     planId: string,
//     type: "monthly" | "yearly"
//   ) => {
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
//       throw new Error(data.error || "Failed to create subscription");
//     }

//     // Handle Razorpay checkout
//     if (data.shortUrl) {
//       window.location.href = data.shortUrl;
//     } else {
//       // Embedded checkout
//       const options = {
//         key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         subscription_id: data.subscriptionId,
//         name: "RGUKT Tenders Portal",
//         description: `${data.plan.name} Subscription`,
//         handler: async function () {
//           await fetchUserSubscription();
//         },
//         prefill: {
//           email: user.email,
//           name: user.profile?.full_name,
//         },
//         theme: {
//           color: "#3b82f6",
//         },
//       };

//       const razorpay = new window.Razorpay(options);
//       razorpay.open();
//     }
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
//       setCurrentSubscription(null);
//     } else {
//       throw new Error("Failed to cancel subscription");
//     }
//   };

//   const pauseSubscription = async () => {
//     if (!currentSubscription) return;

//     const response = await fetch("/api/subscription/pause", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         subscriptionId: currentSubscription.id,
//       }),
//     });

//     if (response.ok) {
//       await fetchUserSubscription();
//     } else {
//       throw new Error("Failed to pause subscription");
//     }
//   };

//   const resumeSubscription = async () => {
//     if (!currentSubscription) return;

//     const response = await fetch("/api/subscription/resume", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         subscriptionId: currentSubscription.id,
//       }),
//     });

//     if (response.ok) {
//       await fetchUserSubscription();
//     } else {
//       throw new Error("Failed to resume subscription");
//     }
//   };

//   const changePlan = async (newPlanId: string, type: "monthly" | "yearly") => {
//     if (!currentSubscription) return;

//     const response = await fetch("/api/subscription/change-plan", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         subscriptionId: currentSubscription.id,
//         newPlanId,
//         subscriptionType: type,
//       }),
//     });

//     if (response.ok) {
//       await fetchUserSubscription();
//     } else {
//       throw new Error("Failed to change plan");
//     }
//   };

//   const canAccess = (feature: string): boolean => {
//     if (!currentSubscription || currentSubscription.status !== "active") {
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

//     const plan = currentSubscription.plan;
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

//   const refreshSubscription = async () => {
//     await fetchUserSubscription();
//   };

//   return {
//     plans,
//     currentSubscription,
//     loading,
//     error,
//     createSubscription,
//     cancelSubscription,
//     pauseSubscription,
//     resumeSubscription,
//     changePlan,
//     canAccess,
//     refreshSubscription,
//   };
// }
