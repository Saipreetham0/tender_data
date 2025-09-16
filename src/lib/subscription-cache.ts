// src/lib/subscription-cache.ts - Enterprise-level subscription data management
import type { UserSubscription, PaymentHistory } from '@/types/subscription';
import { retryFetch } from '@/lib/api-client';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  promise?: Promise<T>;
}

interface SubscriptionCache {
  current: Map<string, CacheEntry<UserSubscription | null>>;
  history: Map<string, CacheEntry<PaymentHistory[]>>;
}

class SubscriptionDataManager {
  private static instance: SubscriptionDataManager;
  private cache: SubscriptionCache = {
    current: new Map(),
    history: new Map(),
  };
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();

  // Singleton pattern
  static getInstance(): SubscriptionDataManager {
    if (!SubscriptionDataManager.instance) {
      SubscriptionDataManager.instance = new SubscriptionDataManager();
    }
    return SubscriptionDataManager.instance;
  }

  private constructor() {
    // Cleanup stale cache entries every 5 minutes
    setInterval(() => {
      this.cleanupStaleEntries();
    }, 5 * 60 * 1000);
  }

  private isStale(entry: CacheEntry<any>, ttl: number): boolean {
    return Date.now() - entry.timestamp > ttl;
  }

  private cleanupStaleEntries(): void {
    const currentTtl = 5 * 60 * 1000; // 5 minutes
    const historyTtl = 10 * 60 * 1000; // 10 minutes

    for (const [key, entry] of this.cache.current.entries()) {
      if (this.isStale(entry, currentTtl)) {
        this.cache.current.delete(key);
      }
    }

    for (const [key, entry] of this.cache.history.entries()) {
      if (this.isStale(entry, historyTtl)) {
        this.cache.history.delete(key);
      }
    }
  }

  private notifySubscribers(key: string, data: any): void {
    const subscribers = this.subscribers.get(key);
    if (subscribers) {
      subscribers.forEach(callback => callback(data));
    }
  }

  // Request deduplication with promise sharing
  private async makeRequest<T>(
    key: string,
    requestFn: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // Check if request is already pending
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Create and cache the request promise
    const promise = requestFn().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  async getCurrentSubscription(email: string): Promise<UserSubscription | null> {
    const cacheKey = `current_${email}`;
    const ttl = 5 * 60 * 1000; // 5 minutes

    // Check cache first
    const cached = this.cache.current.get(cacheKey);
    if (cached && !this.isStale(cached, ttl)) {
      return cached.data;
    }

    // Make deduped request with retry logic
    const data = await this.makeRequest(
      cacheKey,
      async () => {
        const response = await retryFetch(`/api/subscription/current?email=${email}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch subscription');
        }

        return result.subscription;
      },
      ttl
    );

    // Update cache
    this.cache.current.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Notify subscribers
    this.notifySubscribers(cacheKey, data);

    return data;
  }

  async getPaymentHistory(email: string): Promise<PaymentHistory[]> {
    const cacheKey = `history_${email}`;
    const ttl = 10 * 60 * 1000; // 10 minutes

    // Check cache first
    const cached = this.cache.history.get(cacheKey);
    if (cached && !this.isStale(cached, ttl)) {
      return cached.data;
    }

    // Make deduped request with retry logic
    const data = await this.makeRequest(
      cacheKey,
      async () => {
        const response = await retryFetch(`/api/subscription/history?email=${email}`);
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch payment history');
        }

        return result.payments || [];
      },
      ttl
    );

    // Update cache
    this.cache.history.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    // Notify subscribers
    this.notifySubscribers(cacheKey, data);

    return data;
  }

  // Subscribe to data changes
  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }

    this.subscribers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const subscribers = this.subscribers.get(key);
      if (subscribers) {
        subscribers.delete(callback);
        if (subscribers.size === 0) {
          this.subscribers.delete(key);
        }
      }
    };
  }

  // Invalidate specific cache entries
  invalidateCache(email: string, type?: 'current' | 'history'): void {
    if (!type || type === 'current') {
      this.cache.current.delete(`current_${email}`);
    }
    if (!type || type === 'history') {
      this.cache.history.delete(`history_${email}`);
    }
  }

  // Prefetch data
  async prefetch(email: string): Promise<void> {
    await Promise.all([
      this.getCurrentSubscription(email).catch(() => null),
      this.getPaymentHistory(email).catch(() => []),
    ]);
  }

  // Get cache statistics
  getCacheStats(): {
    currentCacheSize: number;
    historyCacheSize: number;
    pendingRequests: number;
    subscribers: number;
  } {
    return {
      currentCacheSize: this.cache.current.size,
      historyCacheSize: this.cache.history.size,
      pendingRequests: this.pendingRequests.size,
      subscribers: this.subscribers.size,
    };
  }
}

// Export singleton instance
export const subscriptionManager = SubscriptionDataManager.getInstance();