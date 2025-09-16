// src/contexts/SubscriptionContext.tsx - Global subscription state management
'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscriptionManager } from '@/lib/subscription-cache';
import type { UserSubscription, PaymentHistory } from '@/types/subscription';

interface SubscriptionContextValue {
  // Data
  subscription: UserSubscription | null;
  paymentHistory: PaymentHistory[];

  // Loading states
  isLoading: boolean;
  isSubscriptionLoading: boolean;
  isHistoryLoading: boolean;

  // Error states
  error: string | null;

  // Actions
  refetch: () => Promise<void>;
  prefetch: () => Promise<void>;
  invalidateCache: (type?: 'current' | 'history') => void;

  // Access helpers
  hasAccess: (feature: string) => boolean;
  isActive: boolean;

  // Cache stats for debugging
  cacheStats: () => any;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  // Early return if auth context is not available
  if (user === undefined) {
    // Auth is still loading, show loading state
    return (
      <SubscriptionContext.Provider value={{
        subscription: null,
        paymentHistory: [],
        isLoading: true,
        isSubscriptionLoading: true,
        isHistoryLoading: true,
        error: null,
        refetch: async () => {},
        prefetch: async () => {},
        invalidateCache: () => {},
        hasAccess: () => false,
        isActive: false,
        cacheStats: () => ({})
      }}>
        {children}
      </SubscriptionContext.Provider>
    );
  }

  // State
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [isSubscriptionLoading, setIsSubscriptionLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const isLoading = isSubscriptionLoading || isHistoryLoading;
  const isActive = subscription?.status === 'active';

  // Memoized access checker
  const hasAccess = useCallback((feature: string): boolean => {
    if (!subscription || subscription.status !== "active") {
      // Free tier permissions
      switch (feature) {
        case "basic_access":
        case "single_college":
          return true;
        default:
          return false;
      }
    }

    const plan = subscription.plan;
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
  }, [subscription]);

  // Fetch functions
  const fetchSubscription = useCallback(async () => {
    if (!user?.email) {
      setSubscription(null);
      return;
    }

    setIsSubscriptionLoading(true);
    setError(null);

    try {
      const data = await subscriptionManager.getCurrentSubscription(user.email);
      setSubscription(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch subscription';
      setError(errorMessage);
      console.error('Subscription fetch error:', err);
    } finally {
      setIsSubscriptionLoading(false);
    }
  }, [user?.email]);

  const fetchPaymentHistory = useCallback(async () => {
    if (!user?.email) {
      setPaymentHistory([]);
      return;
    }

    setIsHistoryLoading(true);
    setError(null);

    try {
      const data = await subscriptionManager.getPaymentHistory(user.email);
      setPaymentHistory(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch payment history';
      setError(errorMessage);
      console.error('Payment history fetch error:', err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [user?.email]);

  // Combined refetch
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchSubscription(),
      fetchPaymentHistory()
    ]);
  }, [fetchSubscription, fetchPaymentHistory]);

  // Prefetch
  const prefetch = useCallback(async () => {
    if (!user?.email) return;

    try {
      await subscriptionManager.prefetch(user.email);
      // Update local state with cached data
      const [subscriptionData, historyData] = await Promise.all([
        subscriptionManager.getCurrentSubscription(user.email),
        subscriptionManager.getPaymentHistory(user.email)
      ]);

      setSubscription(subscriptionData);
      setPaymentHistory(historyData);
    } catch (err) {
      console.error('Prefetch error:', err);
    }
  }, [user?.email]);

  // Cache invalidation
  const invalidateCache = useCallback((type?: 'current' | 'history') => {
    if (!user?.email) return;

    subscriptionManager.invalidateCache(user.email, type);

    // Refetch after invalidation
    if (!type || type === 'current') {
      fetchSubscription();
    }
    if (!type || type === 'history') {
      fetchPaymentHistory();
    }
  }, [user?.email, fetchSubscription, fetchPaymentHistory]);

  // Cache stats for debugging
  const cacheStats = useCallback(() => {
    return subscriptionManager.getCacheStats();
  }, []);

  // Initial data fetch - only when user is available and not loading
  useEffect(() => {
    if (user?.email) {
      // Use prefetch for initial load (faster)
      prefetch().catch(() => {
        // Fallback to regular fetch if prefetch fails
        refetch();
      });
    } else {
      // Clear data when no user
      setSubscription(null);
      setPaymentHistory([]);
      setError(null);
    }
  }, [user?.email]); // Remove prefetch and refetch from dependencies to avoid circular calls

  // Subscribe to data changes from cache
  useEffect(() => {
    if (!user?.email) return;

    const subscriptionKey = `current_${user.email}`;
    const historyKey = `history_${user.email}`;

    const unsubscribeSubscription = subscriptionManager.subscribe(
      subscriptionKey,
      (data: UserSubscription | null) => {
        setSubscription(data);
      }
    );

    const unsubscribeHistory = subscriptionManager.subscribe(
      historyKey,
      (data: PaymentHistory[]) => {
        setPaymentHistory(data);
      }
    );

    return () => {
      unsubscribeSubscription();
      unsubscribeHistory();
    };
  }, [user?.email]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo<SubscriptionContextValue>(() => ({
    // Data
    subscription,
    paymentHistory,

    // Loading states
    isLoading,
    isSubscriptionLoading,
    isHistoryLoading,

    // Error states
    error,

    // Actions
    refetch,
    prefetch,
    invalidateCache,

    // Access helpers
    hasAccess,
    isActive,

    // Debug
    cacheStats,
  }), [
    subscription,
    paymentHistory,
    isLoading,
    isSubscriptionLoading,
    isHistoryLoading,
    error,
    refetch,
    prefetch,
    invalidateCache,
    hasAccess,
    isActive,
    cacheStats,
  ]);

  return (
    <SubscriptionContext.Provider value={contextValue}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook to use subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}

// Backwards compatibility hooks
export function useSubscriptionData() {
  const context = useSubscription();
  return {
    subscription: context.subscription,
    paymentHistory: context.paymentHistory,
    isLoading: context.isLoading,
    isError: !!context.error,
    error: context.error ? new Error(context.error) : null,
    refetch: context.refetch,
  };
}

export function useCurrentSubscription() {
  const context = useSubscription();
  return {
    data: context.subscription,
    isLoading: context.isSubscriptionLoading,
    isError: !!context.error,
    error: context.error ? new Error(context.error) : null,
    refetch: async () => {
      await context.refetch();
    },
  };
}