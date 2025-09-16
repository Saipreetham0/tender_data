// src/lib/intelligent-alerts.ts - AI-powered intelligent alert system

import { Tender } from './types';
import { redis } from './redis';

interface UserPreferences {
  userId: string;
  keywords: string[];
  budgetRange: [number, number];
  locations: string[];
  categories: string[];
  notificationMethods: ('email' | 'push' | 'sms')[];
  frequency: 'realtime' | 'daily' | 'weekly';
  lastUpdated: string;
}

interface TenderInteraction {
  userId: string;
  tenderId: string;
  action: 'view' | 'bookmark' | 'download' | 'ignore';
  timestamp: string;
  dwellTime?: number; // Time spent viewing
}

interface SmartAlert {
  userId: string;
  tender: Tender;
  relevanceScore: number;
  reasons: string[];
  deliveryMethod: 'email' | 'push' | 'sms';
  scheduledFor: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

class IntelligentAlertSystem {
  private static instance: IntelligentAlertSystem;

  static getInstance(): IntelligentAlertSystem {
    if (!IntelligentAlertSystem.instance) {
      IntelligentAlertSystem.instance = new IntelligentAlertSystem();
    }
    return IntelligentAlertSystem.instance;
  }

  // Calculate relevance score based on user behavior and preferences
  async calculateRelevanceScore(
    tender: Tender,
    userPreferences: UserPreferences,
    userHistory: TenderInteraction[]
  ): Promise<{ score: number; reasons: string[] }> {
    let score = 0;
    const reasons: string[] = [];

    // Keyword matching (30% weight)
    const keywordScore = this.calculateKeywordScore(tender, userPreferences.keywords);
    score += keywordScore * 0.3;
    if (keywordScore > 0.7) {
      reasons.push(`High keyword match (${Math.round(keywordScore * 100)}%)`);
    }

    // Budget range matching (25% weight)
    const budgetScore = this.calculateBudgetScore(tender, userPreferences.budgetRange);
    score += budgetScore * 0.25;
    if (budgetScore > 0.8) {
      reasons.push('Within preferred budget range');
    }

    // Location preference (20% weight)
    const locationScore = this.calculateLocationScore(tender, userPreferences.locations);
    score += locationScore * 0.2;
    if (locationScore > 0) {
      reasons.push('Matches preferred location');
    }

    // Historical behavior (25% weight)
    const behaviorScore = this.calculateBehaviorScore(tender, userHistory);
    score += behaviorScore * 0.25;
    if (behaviorScore > 0.6) {
      reasons.push('Similar to previously viewed tenders');
    }

    // Urgency bonus
    const urgencyScore = this.calculateUrgencyScore(tender);
    if (urgencyScore > 0.8) {
      score += 0.1;
      reasons.push('Deadline approaching soon');
    }

    return { score: Math.min(score, 1), reasons };
  }

  private calculateKeywordScore(tender: Tender, keywords: string[]): number {
    if (keywords.length === 0) return 0.5; // Neutral if no preferences

    const tenderText = `${tender.name} ${tender.source}`.toLowerCase();
    const matchingKeywords = keywords.filter(keyword =>
      tenderText.includes(keyword.toLowerCase())
    );

    return matchingKeywords.length / keywords.length;
  }

  private calculateBudgetScore(tender: Tender, budgetRange: [number, number]): number {
    // Extract budget from tender name/description
    const budgetMatch = tender.name.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(?:lakh|crore|thousand)/i);
    if (!budgetMatch) return 0.5; // Neutral if no budget info

    const amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const unit = budgetMatch[0].toLowerCase();

    let budgetInLakhs = amount;
    if (unit.includes('crore')) {
      budgetInLakhs = amount * 100;
    } else if (unit.includes('thousand')) {
      budgetInLakhs = amount / 100;
    }

    const [minBudget, maxBudget] = budgetRange;
    if (budgetInLakhs >= minBudget && budgetInLakhs <= maxBudget) {
      return 1.0;
    } else if (budgetInLakhs < minBudget) {
      return Math.max(0, 1 - (minBudget - budgetInLakhs) / minBudget);
    } else {
      return Math.max(0, 1 - (budgetInLakhs - maxBudget) / maxBudget);
    }
  }

  private calculateLocationScore(tender: Tender, preferredLocations: string[]): number {
    if (preferredLocations.length === 0) return 0.5;

    const tenderLocation = tender.source?.toLowerCase() || '';
    const hasMatch = preferredLocations.some(location =>
      tenderLocation.includes(location.toLowerCase())
    );

    return hasMatch ? 1.0 : 0.0;
  }

  private calculateBehaviorScore(tender: Tender, userHistory: TenderInteraction[]): number {
    if (userHistory.length === 0) return 0.5;

    // Find similar tenders user has interacted with positively
    const positiveInteractions = userHistory.filter(
      interaction => ['view', 'bookmark', 'download'].includes(interaction.action)
    );

    // Simple similarity based on common words in tender names
    const currentTenderWords = tender.name.toLowerCase().split(/\s+/);
    let totalSimilarity = 0;

    positiveInteractions.forEach(interaction => {
      // In a real implementation, you'd look up the tender details
      // For now, we'll simulate similarity scoring
      const similarity = Math.random() * 0.8; // Placeholder
      totalSimilarity += similarity;
    });

    return positiveInteractions.length > 0 ? totalSimilarity / positiveInteractions.length : 0.5;
  }

  private calculateUrgencyScore(tender: Tender): number {
    const closingDate = tender.closingDate;
    if (!closingDate) return 0;

    try {
      const today = new Date();
      const deadline = new Date(closingDate);
      const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysLeft <= 1) return 1.0;
      if (daysLeft <= 3) return 0.8;
      if (daysLeft <= 7) return 0.6;
      if (daysLeft <= 14) return 0.4;
      return 0.2;
    } catch {
      return 0;
    }
  }

  // Process new tenders and generate alerts
  async processNewTenders(tenders: Tender[]): Promise<SmartAlert[]> {
    const alerts: SmartAlert[] = [];

    // Get all user preferences
    const userPreferences = await this.getAllUserPreferences();

    for (const userPref of userPreferences) {
      const userHistory = await this.getUserHistory(userPref.userId);

      for (const tender of tenders) {
        const { score, reasons } = await this.calculateRelevanceScore(
          tender,
          userPref,
          userHistory
        );

        // Only create alerts for relevant tenders (score > 0.5)
        if (score > 0.5) {
          const priority = this.determinePriority(score);
          const deliveryMethod = this.selectDeliveryMethod(userPref, priority);

          alerts.push({
            userId: userPref.userId,
            tender,
            relevanceScore: score,
            reasons,
            deliveryMethod,
            scheduledFor: this.calculateDeliveryTime(userPref.frequency, priority),
            priority
          });
        }
      }
    }

    return alerts;
  }

  private determinePriority(score: number): 'low' | 'medium' | 'high' | 'urgent' {
    if (score >= 0.9) return 'urgent';
    if (score >= 0.8) return 'high';
    if (score >= 0.7) return 'medium';
    return 'low';
  }

  private selectDeliveryMethod(
    userPreferences: UserPreferences,
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): 'email' | 'push' | 'sms' {
    const methods = userPreferences.notificationMethods;

    if (priority === 'urgent' && methods.includes('sms')) return 'sms';
    if ((priority === 'high' || priority === 'urgent') && methods.includes('push')) return 'push';
    return methods.includes('email') ? 'email' : 'push';
  }

  private calculateDeliveryTime(
    frequency: 'realtime' | 'daily' | 'weekly',
    priority: 'low' | 'medium' | 'high' | 'urgent'
  ): string {
    const now = new Date();

    if (priority === 'urgent' || frequency === 'realtime') {
      return now.toISOString();
    }

    if (frequency === 'daily') {
      // Schedule for next 9 AM
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return tomorrow.toISOString();
    }

    if (frequency === 'weekly') {
      // Schedule for next Monday 9 AM
      const nextMonday = new Date(now);
      const daysUntilMonday = (1 + 7 - now.getDay()) % 7 || 7;
      nextMonday.setDate(now.getDate() + daysUntilMonday);
      nextMonday.setHours(9, 0, 0, 0);
      return nextMonday.toISOString();
    }

    return now.toISOString();
  }

  // Store user preferences
  async saveUserPreferences(preferences: UserPreferences): Promise<void> {
    const key = `user_preferences:${preferences.userId}`;
    await redis.setex(key, 30 * 24 * 60 * 60, JSON.stringify(preferences)); // 30 days TTL
  }

  // Store user interaction
  async recordInteraction(interaction: TenderInteraction): Promise<void> {
    const key = `user_history:${interaction.userId}`;
    const interactions = await this.getUserHistory(interaction.userId);
    interactions.push(interaction);

    // Keep only last 100 interactions
    const recentInteractions = interactions.slice(-100);
    await redis.setex(key, 90 * 24 * 60 * 60, JSON.stringify(recentInteractions)); // 90 days TTL
  }

  // Get user history
  async getUserHistory(userId: string): Promise<TenderInteraction[]> {
    const key = `user_history:${userId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data as string) : [];
  }

  // Get all user preferences (for batch processing)
  private async getAllUserPreferences(): Promise<UserPreferences[]> {
    // In a real implementation, you'd query all user preference keys
    // For now, returning empty array
    return [];
  }

  // Queue alert for delivery
  async queueAlert(alert: SmartAlert): Promise<void> {
    const key = `alert_queue:${alert.deliveryMethod}`;
    await redis.lpush(key, JSON.stringify(alert));
  }

  // Process alert queue
  async processAlertQueue(method: 'email' | 'push' | 'sms'): Promise<SmartAlert[]> {
    const key = `alert_queue:${method}`;
    const alerts: SmartAlert[] = [];

    // Get all alerts from queue
    let alertData = await redis.rpop(key);
    while (alertData) {
      alerts.push(JSON.parse(alertData));
      alertData = await redis.rpop(key);
    }

    return alerts;
  }
}

// Export singleton instance
export const intelligentAlerts = IntelligentAlertSystem.getInstance();

// Helper functions for easy integration
export const recordTenderView = (userId: string, tenderId: string, dwellTime?: number) => {
  return intelligentAlerts.recordInteraction({
    userId,
    tenderId,
    action: 'view',
    timestamp: new Date().toISOString(),
    dwellTime
  });
};

export const recordTenderBookmark = (userId: string, tenderId: string) => {
  return intelligentAlerts.recordInteraction({
    userId,
    tenderId,
    action: 'bookmark',
    timestamp: new Date().toISOString()
  });
};

export const recordTenderDownload = (userId: string, tenderId: string) => {
  return intelligentAlerts.recordInteraction({
    userId,
    tenderId,
    action: 'download',
    timestamp: new Date().toISOString()
  });
};

export default intelligentAlerts;