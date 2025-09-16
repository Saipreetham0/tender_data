// Simple lightweight subscription hook for components that just need access checks
import { useCurrentSubscription } from './useSubscriptionData';

export function useSimpleSubscription() {
  const { data: subscription, isLoading, error } = useCurrentSubscription();

  const hasAccess = (feature: string): boolean => {
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
  };

  return {
    subscription,
    isLoading,
    error,
    isActive: subscription?.status === 'active',
    hasAccess,
  };
}