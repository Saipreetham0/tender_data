import { cacheHelpers, CACHE_KEYS, CACHE_TTL } from './redis'

export interface CachedSession {
  userId: string
  email: string
  role: 'user' | 'admin'
  subscription?: {
    planId: string
    status: string
    expiresAt: string
  }
  lastActive: string
}

export interface CachedSubscription {
  planId: string
  status: 'active' | 'cancelled' | 'expired'
  expiresAt: string
  features: string[]
  billingCycle: 'monthly' | 'yearly'
}

export const sessionCache = {
  // Store user session data
  async setSession(userId: string, sessionData: CachedSession): Promise<void> {
    const key = CACHE_KEYS.userSession(userId)
    await cacheHelpers.set(key, sessionData, CACHE_TTL.USER_SESSION)
  },

  // Get user session data
  async getSession(userId: string): Promise<CachedSession | null> {
    const key = CACHE_KEYS.userSession(userId)
    return await cacheHelpers.get<CachedSession>(key)
  },

  // Remove user session
  async deleteSession(userId: string): Promise<void> {
    const key = CACHE_KEYS.userSession(userId)
    await cacheHelpers.del(key)
  },

  // Update last active timestamp
  async updateLastActive(userId: string): Promise<void> {
    const key = CACHE_KEYS.userSession(userId)
    const session = await cacheHelpers.get<CachedSession>(key)

    if (session) {
      session.lastActive = new Date().toISOString()
      await cacheHelpers.set(key, session, CACHE_TTL.USER_SESSION)
    }
  },

  // Store subscription data
  async setSubscription(userId: string, subscriptionData: CachedSubscription): Promise<void> {
    const key = CACHE_KEYS.subscriptionData(userId)
    await cacheHelpers.set(key, subscriptionData, CACHE_TTL.SUBSCRIPTION_DATA)
  },

  // Get subscription data
  async getSubscription(userId: string): Promise<CachedSubscription | null> {
    const key = CACHE_KEYS.subscriptionData(userId)
    return await cacheHelpers.get<CachedSubscription>(key)
  },

  // Remove subscription cache (when updated in DB)
  async deleteSubscription(userId: string): Promise<void> {
    const key = CACHE_KEYS.subscriptionData(userId)
    await cacheHelpers.del(key)
  },

  // Get or fetch subscription with fallback to database
  async getSubscriptionWithFallback(
    userId: string,
    fetchFromDb: () => Promise<CachedSubscription | null>
  ): Promise<CachedSubscription | null> {
    const key = CACHE_KEYS.subscriptionData(userId)

    return await cacheHelpers.getWithFallback(
      key,
      fetchFromDb,
      CACHE_TTL.SUBSCRIPTION_DATA
    )
  }
}

// Analytics cache helpers
export const analyticsCache = {
  // Cache analytics data
  async setAnalytics(type: string, period: string, data: any): Promise<void> {
    const key = CACHE_KEYS.analytics(type, period)
    await cacheHelpers.set(key, data, CACHE_TTL.ANALYTICS)
  },

  // Get analytics data
  async getAnalytics<T>(type: string, period: string): Promise<T | null> {
    const key = CACHE_KEYS.analytics(type, period)
    return await cacheHelpers.get<T>(key)
  },

  // Get analytics with fallback
  async getAnalyticsWithFallback<T>(
    type: string,
    period: string,
    fetchFn: () => Promise<T>
  ): Promise<T> {
    const key = CACHE_KEYS.analytics(type, period)

    return await cacheHelpers.getWithFallback(
      key,
      fetchFn,
      CACHE_TTL.ANALYTICS
    )
  }
}

export default sessionCache