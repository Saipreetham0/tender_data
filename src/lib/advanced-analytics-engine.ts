// src/lib/advanced-analytics-engine.ts - Business intelligence and analytics platform

import { Tender } from './types';
import { redis } from './redis';
import { getAllTendersFromSupabase } from './supabase';

interface AnalyticsMetrics {
  totalTenders: number;
  activeToday: number;
  closingSoon: number;
  averageBudget: number;
  topCategories: CategoryMetric[];
  campusDistribution: CampusMetric[];
  trendData: TrendDataPoint[];
  budgetDistribution: BudgetRange[];
}

interface CategoryMetric {
  category: string;
  count: number;
  totalValue: number;
  averageValue: number;
  growthRate: number;
}

interface CampusMetric {
  campus: string;
  tenderCount: number;
  totalValue: number;
  activeCount: number;
  completionRate: number;
}

interface TrendDataPoint {
  date: string;
  count: number;
  value: number;
  source: string;
}

interface BudgetRange {
  range: string;
  count: number;
  percentage: number;
}

interface PredictiveInsight {
  type: 'trend' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  actionRequired: boolean;
  relatedData: any;
}

interface UserAnalytics {
  userId: string;
  viewedTenders: number;
  bookmarkedTenders: number;
  downloadedDocuments: number;
  searchQueries: string[];
  preferredCategories: string[];
  engagementScore: number;
  lastActive: string;
}

class AdvancedAnalytics {
  private static instance: AdvancedAnalytics;

  static getInstance(): AdvancedAnalytics {
    if (!AdvancedAnalytics.instance) {
      AdvancedAnalytics.instance = new AdvancedAnalytics();
    }
    return AdvancedAnalytics.instance;
  }

  // Generate comprehensive analytics dashboard data
  async generateDashboardMetrics(): Promise<AnalyticsMetrics> {
    const tenders = await getAllTendersFromSupabase();
    const now = new Date();

    // Basic metrics
    const totalTenders = tenders.length;
    const activeToday = tenders.filter(tender => {
      const postedDate = new Date(tender.postedDate);
      return postedDate.toDateString() === now.toDateString();
    }).length;

    const closingSoon = tenders.filter(tender => {
      return this.isClosingSoon(tender.closingDate);
    }).length;

    // Budget analysis
    const budgets = this.extractBudgets(tenders);
    const averageBudget = budgets.length > 0
      ? budgets.reduce((sum, budget) => sum + budget, 0) / budgets.length
      : 0;

    // Category analysis
    const topCategories = this.analyzeCategories(tenders);

    // Campus distribution
    const campusDistribution = this.analyzeCampusDistribution(tenders);

    // Trend data (last 30 days)
    const trendData = await this.generateTrendData(tenders, 30);

    // Budget distribution
    const budgetDistribution = this.analyzeBudgetDistribution(budgets);

    return {
      totalTenders,
      activeToday,
      closingSoon,
      averageBudget,
      topCategories,
      campusDistribution,
      trendData,
      budgetDistribution
    };
  }

  // Predictive insights using basic ML
  async generatePredictiveInsights(tenders: Tender[]): Promise<PredictiveInsight[]> {
    const insights: PredictiveInsight[] = [];

    // Trend analysis
    const trendInsight = this.analyzeTrends(tenders);
    if (trendInsight) insights.push(trendInsight);

    // Opportunity detection
    const opportunityInsight = this.detectOpportunities(tenders);
    if (opportunityInsight) insights.push(opportunityInsight);

    // Risk assessment
    const riskInsight = this.assessRisks(tenders);
    if (riskInsight) insights.push(riskInsight);

    // Recommendations
    const recommendations = this.generateRecommendations(tenders);
    insights.push(...recommendations);

    return insights;
  }

  // User behavior analytics
  async analyzeUserBehavior(userId: string): Promise<UserAnalytics> {
    const cacheKey = `user_analytics:${userId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
    }

    // In a real implementation, you'd query user interaction data
    const analytics: UserAnalytics = {
      userId,
      viewedTenders: 0,
      bookmarkedTenders: 0,
      downloadedDocuments: 0,
      searchQueries: [],
      preferredCategories: [],
      engagementScore: 0,
      lastActive: new Date().toISOString()
    };

    // Cache for 1 hour
    await redis.setex(cacheKey, 3600, JSON.stringify(analytics));
    return analytics;
  }

  // Market intelligence
  async generateMarketIntelligence(): Promise<any> {
    const tenders = await getAllTendersFromSupabase();

    return {
      marketSize: this.calculateMarketSize(tenders),
      competitiveAnalysis: this.analyzeCompetition(tenders),
      growthOpportunities: this.identifyGrowthOpportunities(tenders),
      riskFactors: this.identifyRiskFactors(tenders),
      recommendations: this.generateMarketRecommendations(tenders)
    };
  }

  // Private helper methods
  private extractBudgets(tenders: Tender[]): number[] {
    const budgets: number[] = [];

    tenders.forEach(tender => {
      const budgetMatch = tender.name.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|crore|thousand)/i);
      if (budgetMatch) {
        let amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
        const unit = budgetMatch[2].toLowerCase();

        // Convert to lakhs
        if (unit === 'crore') {
          amount *= 100;
        } else if (unit === 'thousand') {
          amount /= 100;
        }

        budgets.push(amount);
      }
    });

    return budgets;
  }

  private analyzeCategories(tenders: Tender[]): CategoryMetric[] {
    const categories = new Map<string, {count: number, totalValue: number}>();

    tenders.forEach(tender => {
      const category = this.categorizeTender(tender);
      const budget = this.extractBudgetFromTender(tender);

      if (!categories.has(category)) {
        categories.set(category, {count: 0, totalValue: 0});
      }

      const existing = categories.get(category)!;
      existing.count++;
      existing.totalValue += budget;
    });

    return Array.from(categories.entries()).map(([category, data]) => ({
      category,
      count: data.count,
      totalValue: data.totalValue,
      averageValue: data.totalValue / data.count,
      growthRate: Math.random() * 20 - 10 // Placeholder growth rate
    })).sort((a, b) => b.count - a.count);
  }

  private categorizeTender(tender: Tender): string {
    const name = tender.name.toLowerCase();

    if (name.includes('construction') || name.includes('building') || name.includes('civil')) {
      return 'Construction';
    } else if (name.includes('equipment') || name.includes('machinery')) {
      return 'Equipment';
    } else if (name.includes('software') || name.includes('it') || name.includes('computer')) {
      return 'IT & Software';
    } else if (name.includes('maintenance') || name.includes('repair')) {
      return 'Maintenance';
    } else if (name.includes('supply') || name.includes('material')) {
      return 'Supplies';
    } else if (name.includes('service') || name.includes('consultation')) {
      return 'Services';
    } else {
      return 'Others';
    }
  }

  private extractBudgetFromTender(tender: Tender): number {
    const budgetMatch = tender.name.match(/(\d+(?:,\d+)*(?:\.\d+)?)\s*(lakh|crore|thousand)/i);
    if (!budgetMatch) return 0;

    let amount = parseFloat(budgetMatch[1].replace(/,/g, ''));
    const unit = budgetMatch[2].toLowerCase();

    if (unit === 'crore') amount *= 100;
    else if (unit === 'thousand') amount /= 100;

    return amount;
  }

  private analyzeCampusDistribution(tenders: Tender[]): CampusMetric[] {
    const campuses = new Map<string, {count: number, totalValue: number, active: number}>();

    tenders.forEach(tender => {
      const campus = tender.source || 'Unknown';
      const budget = this.extractBudgetFromTender(tender);
      const isActive = !this.isClosingSoon(tender.closingDate);

      if (!campuses.has(campus)) {
        campuses.set(campus, {count: 0, totalValue: 0, active: 0});
      }

      const existing = campuses.get(campus)!;
      existing.count++;
      existing.totalValue += budget;
      if (isActive) existing.active++;
    });

    return Array.from(campuses.entries()).map(([campus, data]) => ({
      campus,
      tenderCount: data.count,
      totalValue: data.totalValue,
      activeCount: data.active,
      completionRate: data.count > 0 ? (data.count - data.active) / data.count * 100 : 0
    }));
  }

  private async generateTrendData(tenders: Tender[], days: number): Promise<TrendDataPoint[]> {
    const trendData: TrendDataPoint[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      const dayTenders = tenders.filter(tender => {
        const postedDate = new Date(tender.postedDate);
        return postedDate.toISOString().split('T')[0] === dateStr;
      });

      const totalValue = dayTenders.reduce((sum, tender) => {
        return sum + this.extractBudgetFromTender(tender);
      }, 0);

      trendData.push({
        date: dateStr,
        count: dayTenders.length,
        value: totalValue,
        source: 'all'
      });
    }

    return trendData;
  }

  private analyzeBudgetDistribution(budgets: number[]): BudgetRange[] {
    const ranges = [
      { min: 0, max: 1, label: '< 1 Lakh' },
      { min: 1, max: 10, label: '1-10 Lakhs' },
      { min: 10, max: 50, label: '10-50 Lakhs' },
      { min: 50, max: 100, label: '50L-1 Crore' },
      { min: 100, max: 500, label: '1-5 Crores' },
      { min: 500, max: Infinity, label: '> 5 Crores' }
    ];

    const distribution = ranges.map(range => {
      const count = budgets.filter(budget => budget >= range.min && budget < range.max).length;
      return {
        range: range.label,
        count,
        percentage: budgets.length > 0 ? (count / budgets.length) * 100 : 0
      };
    });

    return distribution;
  }

  private isClosingSoon(closingDate: string): boolean {
    if (!closingDate) return false;

    try {
      const deadline = new Date(closingDate);
      const now = new Date();
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= 7;
    } catch {
      return false;
    }
  }

  // Predictive analysis methods
  private analyzeTrends(tenders: Tender[]): PredictiveInsight | null {
    // Simple trend analysis - in practice, you'd use more sophisticated ML
    const recentTenders = tenders.filter(tender => {
      const postedDate = new Date(tender.postedDate);
      const daysAgo = Math.ceil((Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysAgo <= 30;
    });

    const growthRate = (recentTenders.length / tenders.length) * 100;

    if (growthRate > 20) {
      return {
        type: 'trend',
        title: 'Increasing Tender Activity',
        description: `Tender volume has increased by ${growthRate.toFixed(1)}% in the last 30 days`,
        confidence: 0.8,
        impact: 'high',
        actionRequired: false,
        relatedData: { growthRate, recentCount: recentTenders.length }
      };
    }

    return null;
  }

  private detectOpportunities(tenders: Tender[]): PredictiveInsight | null {
    // Detect underserved categories or high-value opportunities
    const categories = this.analyzeCategories(tenders);
    const highValueCategory = categories.find(cat => cat.averageValue > 50); // > 50 lakhs

    if (highValueCategory) {
      return {
        type: 'opportunity',
        title: `High-Value Opportunities in ${highValueCategory.category}`,
        description: `${highValueCategory.category} tenders average ${highValueCategory.averageValue.toFixed(1)} lakhs`,
        confidence: 0.7,
        impact: 'high',
        actionRequired: true,
        relatedData: highValueCategory
      };
    }

    return null;
  }

  private assessRisks(tenders: Tender[]): PredictiveInsight | null {
    // Assess risks like declining activity or concentration
    const campusDistribution = this.analyzeCampusDistribution(tenders);
    const dominantCampus = campusDistribution.find(campus =>
      (campus.tenderCount / tenders.length) > 0.6
    );

    if (dominantCampus) {
      return {
        type: 'risk',
        title: 'High Concentration Risk',
        description: `${dominantCampus.campus} accounts for ${((dominantCampus.tenderCount / tenders.length) * 100).toFixed(1)}% of all tenders`,
        confidence: 0.8,
        impact: 'medium',
        actionRequired: true,
        relatedData: dominantCampus
      };
    }

    return null;
  }

  private generateRecommendations(tenders: Tender[]): PredictiveInsight[] {
    const recommendations: PredictiveInsight[] = [];

    // Recommendation based on category analysis
    const categories = this.analyzeCategories(tenders);
    const topCategory = categories[0];

    if (topCategory) {
      recommendations.push({
        type: 'recommendation',
        title: `Focus on ${topCategory.category} Sector`,
        description: `${topCategory.category} represents ${((topCategory.count / tenders.length) * 100).toFixed(1)}% of all opportunities`,
        confidence: 0.9,
        impact: 'medium',
        actionRequired: false,
        relatedData: topCategory
      });
    }

    return recommendations;
  }

  // Market intelligence methods
  private calculateMarketSize(tenders: Tender[]): any {
    const budgets = this.extractBudgets(tenders);
    const totalValue = budgets.reduce((sum, budget) => sum + budget, 0);

    return {
      totalMarketValue: totalValue,
      averageTenderValue: totalValue / budgets.length,
      marketGrowthRate: Math.random() * 15 + 5, // Placeholder
      totalOpportunities: tenders.length
    };
  }

  private analyzeCompetition(tenders: Tender[]): any {
    // In a real implementation, you'd analyze vendor participation
    return {
      averageCompetitors: Math.floor(Math.random() * 5) + 3,
      competitionIntensity: 'medium',
      winRate: Math.random() * 30 + 10
    };
  }

  private identifyGrowthOpportunities(tenders: Tender[]): any[] {
    const categories = this.analyzeCategories(tenders);
    return categories.filter(cat => cat.growthRate > 10).slice(0, 3);
  }

  private identifyRiskFactors(tenders: Tender[]): any[] {
    return [
      {
        risk: 'Market Concentration',
        severity: 'medium',
        description: 'High dependence on single campus'
      }
    ];
  }

  private generateMarketRecommendations(tenders: Tender[]): any[] {
    return [
      {
        recommendation: 'Diversify Campus Portfolio',
        priority: 'high',
        expectedImpact: 'Reduce concentration risk'
      }
    ];
  }
}

// Export singleton instance
export const advancedAnalytics = AdvancedAnalytics.getInstance();

// Helper functions for easy integration
export const generateDashboardData = () => advancedAnalytics.generateDashboardMetrics();
export const getPredictiveInsights = (tenders: Tender[]) => advancedAnalytics.generatePredictiveInsights(tenders);
export const getUserAnalytics = (userId: string) => advancedAnalytics.analyzeUserBehavior(userId);
export const getMarketIntelligence = () => advancedAnalytics.generateMarketIntelligence();

export default advancedAnalytics;