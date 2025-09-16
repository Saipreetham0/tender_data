// src/hooks/useSubscriptionData.ts
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { UserSubscription, PaymentHistory } from '@/types/subscription';

interface SubscriptionDataResponse {
  success: boolean;
  subscription: UserSubscription | null;
  error?: string;
}

interface PaymentHistoryResponse {
  success: boolean;
  payments: PaymentHistory[];
  error?: string;
}

export function useCurrentSubscription() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', 'current', user?.email],
    queryFn: async (): Promise<UserSubscription | null> => {
      if (!user?.email) return null;

      const response = await fetch(`/api/subscription/current?email=${user.email}`);
      const data: SubscriptionDataResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch subscription');
      }

      return data.subscription;
    },
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function usePaymentHistory() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['subscription', 'history', user?.email],
    queryFn: async (): Promise<PaymentHistory[]> => {
      if (!user?.email) return [];

      const response = await fetch(`/api/subscription/history?email=${user.email}`);
      const data: PaymentHistoryResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch payment history');
      }

      return data.payments || [];
    },
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000, // 10 minutes - payment history changes less frequently
    gcTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

// Combined hook for convenience
export function useSubscriptionData() {
  const subscription = useCurrentSubscription();
  const paymentHistory = usePaymentHistory();

  const hasAccess = (feature: string): boolean => {
    const sub = subscription.data;

    if (!sub || sub.status !== "active") {
      // Free tier permissions
      switch (feature) {
        case "basic_access":
        case "single_college":
          return true;
        default:
          return false;
      }
    }

    const plan = sub.plan;
    if (!plan) return false;

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

  return {
    subscription: subscription.data,
    paymentHistory: paymentHistory.data || [],
    isLoading: subscription.isLoading || paymentHistory.isLoading,
    isError: subscription.isError || paymentHistory.isError,
    error: subscription.error || paymentHistory.error,
    isActive: subscription.data?.status === 'active',
    hasAccess,
    refetch: async () => {
      await Promise.all([
        subscription.refetch(),
        paymentHistory.refetch()
      ]);
    },
  };
}