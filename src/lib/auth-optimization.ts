// Enterprise Auth-to-Feature Flow Optimization
import { useQuery, useQueries } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import type { UserSubscription, PaymentHistory } from '@/types/subscription';

// 1. Progressive Authentication States
export enum AuthState {
  UNKNOWN = 'unknown',
  LOADING = 'loading',
  GUEST = 'guest',
  AUTHENTICATED = 'authenticated',
  VERIFIED = 'verified',
  PREMIUM = 'premium'
}

// 2. Feature Flag System
interface FeatureFlag {
  id: string;
  enabled: boolean;
  rolloutPercentage: number;
  userSegments: string[];
  dependencies: string[];
}

export class FeatureFlagManager {
  private static cache = new Map<string, FeatureFlag>();

  static async getFeature(featureId: string, userId: string): Promise<boolean> {
    // Check cache first
    if (this.cache.has(featureId)) {
      return this.evaluateFeature(this.cache.get(featureId)!, userId);
    }

    // Fetch from API with background sync
    try {
      const response = await fetch(`/api/features/${featureId}?userId=${userId}`);
      const feature = await response.json();
      this.cache.set(featureId, feature);
      return this.evaluateFeature(feature, userId);
    } catch {
      return false; // Fail safe
    }
  }

  private static evaluateFeature(feature: FeatureFlag, userId: string): boolean {
    if (!feature.enabled) return false;

    // Simple user hash for consistent rollout
    const userHash = this.hashUserId(userId);
    return userHash < feature.rolloutPercentage;
  }

  private static hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = ((hash << 5) - hash + userId.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash) % 100;
  }
}

// 3. Optimized Auth Hook with Parallel Loading
export function useOptimizedAuth() {
  const { user, loading: authLoading } = useAuth();

  // Parallel queries for faster loading
  const queries = useQueries({
    queries: [
      {
        queryKey: ['user', 'profile', user?.id],
        queryFn: () => user ? fetchUserProfile(user.id) : null,
        enabled: !!user?.id,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['user', 'subscription', user?.email],
        queryFn: () => user ? fetchUserSubscription(user.email!) : null,
        enabled: !!user?.email,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ['user', 'permissions', user?.id],
        queryFn: () => user ? fetchUserPermissions(user.id) : null,
        enabled: !!user?.id,
        staleTime: 10 * 60 * 1000,
      }
    ]
  });

  const [profileQuery, subscriptionQuery, permissionsQuery] = queries;

  // Calculate auth state progressively
  const authState = calculateAuthState(user, profileQuery.data, subscriptionQuery.data);

  return {
    authState,
    user,
    profile: profileQuery.data,
    subscription: subscriptionQuery.data,
    permissions: permissionsQuery.data || [],
    isLoading: authLoading || queries.some(q => q.isLoading),
    error: queries.find(q => q.error)?.error,
  };
}

// 4. Progressive Feature Access
export function useFeatureAccess() {
  const { authState, permissions, subscription } = useOptimizedAuth();

  const hasFeature = (featureId: string): boolean => {
    // Progressive feature access based on auth state
    switch (authState) {
      case AuthState.GUEST:
        return guestFeatures.includes(featureId);
      case AuthState.AUTHENTICATED:
        return [...guestFeatures, ...basicFeatures].includes(featureId);
      case AuthState.VERIFIED:
        return [...guestFeatures, ...basicFeatures, ...verifiedFeatures].includes(featureId);
      case AuthState.PREMIUM:
        return [...guestFeatures, ...basicFeatures, ...verifiedFeatures, ...premiumFeatures].includes(featureId);
      default:
        return guestFeatures.includes(featureId);
    }
  };

  return { hasFeature, authState };
}

// Helper functions
async function fetchUserProfile(userId: string) {
  const response = await fetch(`/api/user/profile?id=${userId}`);
  if (!response.ok) throw new Error('Failed to fetch profile');
  return response.json();
}

async function fetchUserSubscription(email: string): Promise<UserSubscription | null> {
  const response = await fetch(`/api/subscription/current?email=${email}`);
  if (!response.ok) throw new Error('Failed to fetch subscription');
  const data = await response.json();
  return data.success ? data.subscription : null;
}

async function fetchUserPermissions(userId: string) {
  // For now, derive permissions from subscription
  // Later, this can be a separate API endpoint
  return ['basic_access', 'single_college'];
}

function calculateAuthState(user: any, profile: any, subscription: any): AuthState {
  if (!user) return AuthState.GUEST;
  if (!user.email) return AuthState.LOADING;

  // User is authenticated with email
  if (!subscription) return AuthState.AUTHENTICATED;

  // Check subscription status
  if (subscription?.status === 'active') return AuthState.PREMIUM;

  // Email verified but no active subscription
  return AuthState.VERIFIED;
}

// Feature tiers
const guestFeatures = ['browse_tenders', 'basic_search'];
const basicFeatures = ['save_searches', 'email_alerts'];
const verifiedFeatures = ['advanced_filters', 'export_data'];
const premiumFeatures = ['real_time_alerts', 'api_access', 'priority_support'];