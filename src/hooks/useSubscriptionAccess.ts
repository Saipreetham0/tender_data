// // src/hooks/useSubscriptionAccess.ts
// import { useState, useEffect } from "react";
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

//   useEffect(() => {
//     if (user?.email) {
//       fetchSubscription();
//     } else {
//       setLoading(false);
//     }
//   }, [user, fetchSubscription]);

//   const fetchSubscription = async () => {
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
//   };

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


// src/hooks/useSubscriptionAccess.ts
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";

interface UseSubscriptionAccessReturn {
  hasAccess: (feature: string) => boolean;
  checkUsage: (
    type: string
  ) => Promise<{ allowed: boolean; currentUsage: number; limit?: number }>;
  trackUsage: (type: string) => Promise<void>;
  loading: boolean;
}

export function useSubscriptionAccess(): UseSubscriptionAccessReturn {
  const { user } = useAuth();
  const { subscription, hasAccess: contextHasAccess, isLoading: loading } = useSubscription();

  // Use the optimized hasAccess from context
  const hasAccess = contextHasAccess;

  const checkUsage = async (type: string) => {
    if (!user?.email) {
      return { allowed: false, currentUsage: 0, limit: 0 };
    }

    try {
      const response = await fetch(
        `/api/subscription/usage?email=${user.email}&type=${type}`
      );
      const data = await response.json();
      return data.usage || { allowed: false, currentUsage: 0, limit: 0 };
    } catch (error) {
      console.error("Error checking usage:", error);
      return { allowed: false, currentUsage: 0, limit: 0 };
    }
  };

  const trackUsage = async (type: string) => {
    if (!user?.email) return;

    try {
      await fetch("/api/subscription/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, usageType: type }),
      });
    } catch (error) {
      console.error("Error tracking usage:", error);
    }
  };

  return {
    hasAccess,
    checkUsage,
    trackUsage,
    loading,
  };
}