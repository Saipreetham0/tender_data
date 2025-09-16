import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  hasAccess: boolean;
  planId: string;
  status: 'active' | 'cancelled' | 'expired' | 'free';
  expiresAt?: string;
  features: string[];
  remainingDays?: number;
}

interface UseOptimizedSubscriptionReturn {
  subscription: SubscriptionStatus | null;
  loading: boolean;
  error: string | null;
  hasFeature: (feature: string) => boolean;
  checkFeature: (feature: string) => Promise<boolean>;
  refresh: () => Promise<void>;
  lastUpdated: Date | null;
}

// Cache subscription data in memory for the session
let cachedSubscription: SubscriptionStatus | null = null;
let lastFetch: Date | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function useOptimizedSubscription(): UseOptimizedSubscriptionReturn {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(cachedSubscription);
  const [loading, setLoading] = useState(!cachedSubscription);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscription = useCallback(async (force = false) => {
    if (!user?.email) {
      setSubscription(null);
      setLoading(false);
      return;
    }

    // Use cache if recent and not forcing refresh
    if (!force && cachedSubscription && lastFetch) {
      const age = Date.now() - lastFetch.getTime();
      if (age < CACHE_DURATION) {
        setSubscription(cachedSubscription);
        setLoading(false);
        return;
      }
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/subscription/status?email=${encodeURIComponent(user.email)}`);
      const data = await response.json();

      if (data.success) {
        cachedSubscription = data.status;
        lastFetch = new Date();
        setSubscription(data.status);
      } else {
        throw new Error(data.error || 'Failed to fetch subscription');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching subscription:', err);

      // Fallback to free tier on error
      const fallbackSubscription: SubscriptionStatus = {
        hasAccess: true,
        planId: 'free',
        status: 'free',
        features: ['basic_access', 'single_college'],
        remainingDays: undefined
      };

      setSubscription(fallbackSubscription);
      cachedSubscription = fallbackSubscription;
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const hasFeature = useCallback((feature: string): boolean => {
    if (!subscription) return false;

    // Free tier features
    const freeTierFeatures = ['basic_access', 'single_college'];
    if (freeTierFeatures.includes(feature)) {
      return true;
    }

    // Premium features
    if (subscription.status !== 'active') {
      return false;
    }

    return subscription.features.includes(feature);
  }, [subscription]);

  const checkFeature = useCallback(async (feature: string): Promise<boolean> => {
    if (!user?.email) return false;

    try {
      const response = await fetch(
        `/api/subscription/status?email=${encodeURIComponent(user.email)}&feature=${encodeURIComponent(feature)}`
      );
      const data = await response.json();

      if (data.success) {
        // Update cached subscription if it was returned
        if (data.status) {
          cachedSubscription = data.status;
          lastFetch = new Date();
          setSubscription(data.status);
        }
        return data.hasAccess;
      }

      return false;
    } catch (error) {
      console.error('Error checking feature access:', error);
      return hasFeature(feature); // Fallback to cached data
    }
  }, [user?.email, hasFeature]);

  const refresh = useCallback(async () => {
    await fetchSubscription(true);
  }, [fetchSubscription]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Clear cache when user changes
  useEffect(() => {
    if (!user) {
      cachedSubscription = null;
      lastFetch = null;
      setSubscription(null);
    }
  }, [user]);

  return {
    subscription,
    loading,
    error,
    hasFeature,
    checkFeature,
    refresh,
    lastUpdated: lastFetch
  };
}

// Utility hook for quick feature checks
export function useFeatureAccess(feature: string) {
  const { hasFeature, checkFeature, loading } = useOptimizedSubscription();

  return {
    hasAccess: hasFeature(feature),
    checkAccess: () => checkFeature(feature),
    loading
  };
}

// Clear subscription cache (useful when subscription is updated)
export function clearSubscriptionCache() {
  cachedSubscription = null;
  lastFetch = null;
}

// Force clear all cache on logout
export function clearAllSubscriptionCache() {
  cachedSubscription = null;
  lastFetch = null;

  // Clear any browser storage if needed
  if (typeof window !== 'undefined') {
    // Clear any subscription-related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('subscription') || key.includes('cache')) {
        localStorage.removeItem(key);
      }
    });
  }
}