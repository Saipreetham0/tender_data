
// src/hooks/useSubscription.ts
import { useState, useEffect } from 'react';

interface Subscription {
  plan?: {
    [key: string]: boolean;
  };
}

interface Usage {
  allowed: boolean;
  currentUsage: number;
}

interface SubscriptionHook {
  subscription: Subscription | null;
  loading: boolean;
  hasFeature: (feature: string) => boolean;
  checkUsage: (type: string) => Promise<Usage>;
  trackUsage: (type: string) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export function useSubscription(email: string): SubscriptionHook {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSubscription = async () => {
    if (!email) return;

    try {
      const response = await fetch(`/api/subscription/current?email=${email}`);
      const data = await response.json();
      setSubscription(data.subscription);
    } catch (error) {
      console.error('Error fetching subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [email]);

  const hasFeature = (feature: string): boolean => {
    if (!subscription) return false;
    return subscription.plan?.[feature] === true;
  };

  const checkUsage = async (type: string) => {
    try {
      const response = await fetch(`/api/subscription/usage?email=${email}&type=${type}`);
      const data = await response.json();
      return data.usage;
    } catch (error) {
      console.error('Error checking usage:', error);
      return { allowed: false, currentUsage: 0 };
    }
  };

  const trackUsage = async (type: string) => {
    try {
      await fetch('/api/subscription/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, usageType: type })
      });
    } catch (error) {
      console.error('Error tracking usage:', error);
    }
  };

  const refreshSubscription = async () => {
    setLoading(true);
    await fetchSubscription();
  };

  return {
    subscription,
    loading,
    hasFeature,
    checkUsage,
    trackUsage,
    refreshSubscription
  };
}


