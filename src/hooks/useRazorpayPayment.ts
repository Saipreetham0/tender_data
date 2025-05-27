// src/hooks/useRazorpayPayment.ts
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface SubscriptionPlan {
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
  popular?: boolean;
  display_order: number;
}

interface UserSubscription {
  id: string;
  plan: SubscriptionPlan;
  subscription_type: "monthly" | "yearly";
  status: string;
  current_period_end: string;
  amount_paid: number;
  payment_method: string;
  created_at: string;
}

interface UseRazorpayPaymentReturn {
  plans: SubscriptionPlan[];
  currentSubscription: UserSubscription | null;
  loading: boolean;
  error: string | null;
  createPayment: (planId: string, type: "monthly" | "yearly") => Promise<void>;
  cancelSubscription: () => Promise<void>;
  canAccess: (feature: string) => boolean;
  refreshSubscription: () => Promise<void>;
}

export function useRazorpayPayment(): UseRazorpayPaymentReturn {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] =
    useState<UserSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch plans on mount
  useEffect(() => {
    fetchPlans();
  }, []);

  // Fetch user subscription when user changes
  useEffect(() => {
    if (user?.email) {
      fetchUserSubscription();
    } else {
      setCurrentSubscription(null);
    }
  }, [user, fetchUserSubscription]);

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/subscription/plans");
      const data = await response.json();
      if (data.success) {
        setPlans(data.plans);
      }
    } catch {
      setError("Failed to fetch subscription plans");
    }
  };

  const fetchUserSubscription = async () => {
    if (!user?.email) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/subscription/current?email=${user.email}`
      );
      const data = await response.json();
      if (data.success) {
        setCurrentSubscription(data.subscription);
      }
    } catch {
      setError("Failed to fetch subscription");
    } finally {
      setLoading(false);
    }
  };

  const createPayment = async (planId: string, type: "monthly" | "yearly") => {
    if (!user?.email) {
      throw new Error("User not authenticated");
    }

    const response = await fetch("/api/subscription/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planId,
        subscriptionType: type,
        userEmail: user.email,
        userId: user.id,
      }),
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Failed to create payment");
    }

    // Return the payment data for Razorpay checkout
    return data;
  };

  const cancelSubscription = async () => {
    if (!currentSubscription) return;

    const response = await fetch("/api/subscription/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subscriptionId: currentSubscription.id,
        userEmail: user?.email,
      }),
    });

    if (response.ok) {
      await fetchUserSubscription();
    } else {
      throw new Error("Failed to cancel subscription");
    }
  };

  const canAccess = (feature: string): boolean => {
    if (!currentSubscription || currentSubscription.status !== "active") {
      // Check free tier access
      switch (feature) {
        case "basic_access":
          return true;
        case "single_college":
          return true;
        default:
          return false;
      }
    }

    const plan = currentSubscription.plan;

    switch (feature) {
      case "all_colleges":
        return plan.colleges_access >= 5;
      case "realtime_alerts":
        return plan.alert_type === "realtime";
      case "filters":
        return plan.has_filters;
      case "keyword_filter":
        return plan.has_keyword_filter;
      case "advanced_filters":
        return plan.has_advanced_filters;
      case "api_access":
        return plan.has_api_access;
      default:
        return false;
    }
  };

  const refreshSubscription = async () => {
    await fetchUserSubscription();
  };

  return {
    plans,
    currentSubscription,
    loading,
    error,
    createPayment,
    cancelSubscription,
    canAccess,
    refreshSubscription,
  };
}
