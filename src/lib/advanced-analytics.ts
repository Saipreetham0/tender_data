// src/lib/advanced-analytics.ts - Advanced analytics and business intelligence
import { TenderScore } from './intelligent-matching';

export interface AnalyticsTimeframe {
  start: Date;
  end: Date;
  granularity: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year';
}

export interface TenderAnalytics {
  // Volume metrics
  totalTenders: number;
  newTenders: number;
  activeTenders: number;
  expiredTenders: number;
  tenderGrowthRate: number; // Percentage growth vs previous period
  
  // Value metrics
  totalTenderValue: number;
  averageTenderValue: number;
  medianTenderValue: number;
  highestTenderValue: number;
  valueGrowthRate: number;

  // Category breakdown
  categoryDistribution: { [category: string]: number };
  categoryValues: { [category: string]: number };
  
  // Source analysis
  sourceDistribution: { [source: string]: number };
  sourcePerformance: { [source: string]: number }; // Average tender value per source
  
  // Timeline analysis
  timeDistribution: { [timeKey: string]: number };
  seasonalTrends: { [month: string]: number };
  
  // Opportunity analysis
  closingTrends: { [daysLeft: string]: number };
  urgentOpportunities: number; // Closing in < 3 days
  mediumTermOpportunities: number; // Closing in 3-14 days
  longTermOpportunities: number; // Closing in > 14 days

  // Competition insights
  competitionLevels: {
    high: number;
    medium: number;
    low: number;
  };
  
  // Geographic insights
  geographicDistribution: { [region: string]: number };
  
  // Performance predictions
  predictions: {
    nextWeekTenders: number;
    nextMonthValue: number;
    highOpportunityCount: number;
  };
}

export interface UserAnalytics {
  userId: string;
  
  // Engagement metrics
  totalLogins: number;
  averageSessionDuration: number;
  lastLoginDate: Date;
  tenderViewCount: number;
  searchQueries: number;
  
  // Matching performance
  averageMatchScore: number;
  highMatchCount: number; // Matches > 80%
  mediumMatchCount: number; // Matches 50-80%
  lowMatchCount: number; // Matches < 50%
  
  // Action metrics
  savedTenders: number;
  downloadedDocuments: number;
  emailAlertsReceived: number;
  emailAlertsOpened: number;
  
  // Success tracking (if available)
  proposalsSubmitted?: number;
  proposalsWon?: number;
  winRate?: number;
  totalContractValue?: number;

  // Behavioral insights
  preferredCategories: string[];
  peakActivityHours: number[];
  deviceUsage: { mobile: number; desktop: number; tablet: number };
  
  // Recommendations
  improvementSuggestions: string[];
  missedOpportunities: number;
}

export interface MarketIntelligence {
  // Market overview
  totalMarketValue: number;
  marketGrowthRate: number;
  averageCompetition: number;
  
  // Competitor analysis
  topCompetitorCategories: string[];
  emergingCategories: string[];
  decliningCategories: string[];
  
  // Opportunity analysis
  underservedSegments: string[];
  highValueSegments: string[];
  timeBasedOpportunities: { [timeSlot: string]: number };
  
  // Trend analysis
  emergingKeywords: string[];
  growingBudgetRanges: { min: number; max: number; growth: number }[];
  seasonalPatterns: { [month: string]: { volume: number; value: number } };
  
  // Risk assessment
  marketRisks: string[];
  opportunities: string[];
  
  // Forecasting
  forecast: {
    nextQuarter: {
      expectedTenders: number;
      expectedValue: number;
      topCategories: string[];
    };
    yearEnd: {
      projectedTenders: number;
      projectedValue: number;
      confidenceLevel: number;
    };
  };
}

class AdvancedAnalyticsEngine {
  // Calculate tender analytics for a given timeframe
  public calculateTenderAnalytics(
    tenders: TenderData[], 
    timeframe: AnalyticsTimeframe,
    previousPeriodTenders?: TenderData[]
  ): TenderAnalytics {
    // Filter tenders by timeframe
    const filteredTenders = tenders.filter(tender => {
      const tenderDate = new Date(tender.postedDate);
      return tenderDate >= timeframe.start && tenderDate <= timeframe.end;
    });

    // Calculate basic metrics
    const totalTenders = filteredTenders.length;
    const activeTenders = filteredTenders.filter(t => new Date(t.closingDate) > new Date()).length;
    const expiredTenders = totalTenders - activeTenders;
    
    // Calculate growth rate
    const previousTotal = previousPeriodTenders?.length || 0;
    const tenderGrowthRate = previousTotal > 0 ? ((totalTenders - previousTotal) / previousTotal) * 100 : 0;

    // Value calculations
    const tenderValues = filteredTenders
      .filter(t => t.tenderValue && t.tenderValue > 0)
      .map(t => t.tenderValue!);
    
    const totalTenderValue = tenderValues.reduce((sum, val) => sum + val, 0);
    const averageTenderValue = tenderValues.length > 0 ? totalTenderValue / tenderValues.length : 0;
    const medianTenderValue = this.calculateMedian(tenderValues);
    const highestTenderValue = Math.max(...tenderValues, 0);

    // Calculate value growth rate
    const previousTotalValue = previousPeriodTenders
      ?.filter(t => t.tenderValue && t.tenderValue > 0)
      .reduce((sum, t) => sum + t.tenderValue!, 0) || 0;
    const valueGrowthRate = previousTotalValue > 0 ? ((totalTenderValue - previousTotalValue) / previousTotalValue) * 100 : 0;

    // Category analysis
    const categoryDistribution = this.calculateCategoryDistribution(filteredTenders);
    const categoryValues = this.calculateCategoryValues(filteredTenders);

    // Source analysis
    const sourceDistribution = this.calculateSourceDistribution(filteredTenders);
    const sourcePerformance = this.calculateSourcePerformance(filteredTenders);

    // Timeline analysis
    const timeDistribution = this.calculateTimeDistribution(filteredTenders, timeframe.granularity);
    const seasonalTrends = this.calculateSeasonalTrends(filteredTenders);

    // Opportunity analysis
    const closingTrends = this.calculateClosingTrends(filteredTenders);
    const now = new Date();
    
    const urgentOpportunities = filteredTenders.filter(t => {
      const days = Math.ceil((new Date(t.closingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 0 && days < 3;
    }).length;

    const mediumTermOpportunities = filteredTenders.filter(t => {
      const days = Math.ceil((new Date(t.closingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days >= 3 && days <= 14;
    }).length;

    const longTermOpportunities = filteredTenders.filter(t => {
      const days = Math.ceil((new Date(t.closingDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return days > 14;
    }).length;

    // Competition analysis (simplified)
    const competitionLevels = this.analyzeCompetitionLevels(filteredTenders);

    // Geographic analysis
    const geographicDistribution = this.calculateGeographicDistribution(filteredTenders);

    // Predictions (simplified machine learning approach)
    const predictions = this.generatePredictions(filteredTenders, timeframe);

    return {
      totalTenders,
      newTenders: totalTenders, // All filtered tenders are "new" in this timeframe
      activeTenders,
      expiredTenders,
      tenderGrowthRate,
      totalTenderValue,
      averageTenderValue,
      medianTenderValue,
      highestTenderValue,
      valueGrowthRate,
      categoryDistribution,
      categoryValues,
      sourceDistribution,
      sourcePerformance,
      timeDistribution,
      seasonalTrends,
      closingTrends,
      urgentOpportunities,
      mediumTermOpportunities,
      longTermOpportunities,
      competitionLevels,
      geographicDistribution,
      predictions
    };
  }

  // Calculate user analytics
  public calculateUserAnalytics(
    userId: string,
    userInteractions: any[], // This would come from your analytics tracking
    matchingResults: TenderScore[]
  ): UserAnalytics {
    // This is a simplified implementation
    // In a real system, you'd track user interactions more comprehensively

    const averageMatchScore = matchingResults.length > 0 
      ? matchingResults.reduce((sum, result) => sum + result.overallScore, 0) / matchingResults.length
      : 0;

    const highMatchCount = matchingResults.filter(r => r.overallScore >= 80).length;
    const mediumMatchCount = matchingResults.filter(r => r.overallScore >= 50 && r.overallScore < 80).length;
    const lowMatchCount = matchingResults.filter(r => r.overallScore < 50).length;

    // Generate improvement suggestions based on patterns
    const improvementSuggestions = this.generateImprovementSuggestions(matchingResults);

    return {
      userId,
      totalLogins: userInteractions.filter(i => i.type === 'login').length,
      averageSessionDuration: 1800, // 30 minutes average - would calculate from real data
      lastLoginDate: new Date(),
      tenderViewCount: userInteractions.filter(i => i.type === 'tender_view').length,
      searchQueries: userInteractions.filter(i => i.type === 'search').length,
      averageMatchScore,
      highMatchCount,
      mediumMatchCount,
      lowMatchCount,
      savedTenders: userInteractions.filter(i => i.type === 'save_tender').length,
      downloadedDocuments: userInteractions.filter(i => i.type === 'download').length,
      emailAlertsReceived: userInteractions.filter(i => i.type === 'email_sent').length,
      emailAlertsOpened: userInteractions.filter(i => i.type === 'email_opened').length,
      preferredCategories: this.extractPreferredCategories(userInteractions),
      peakActivityHours: this.calculatePeakActivityHours(userInteractions),
      deviceUsage: { mobile: 30, desktop: 65, tablet: 5 }, // Example distribution
      improvementSuggestions,
      missedOpportunities: matchingResults.filter(r => r.overallScore >= 70 && !userInteractions.some(i => i.tenderId === r.tenderId && i.type === 'tender_view')).length
    };
  }

  // Generate market intelligence
  public generateMarketIntelligence(
    allTenders: TenderData[], 
    timeframe: AnalyticsTimeframe
  ): MarketIntelligence {
    const filteredTenders = allTenders.filter(tender => {
      const tenderDate = new Date(tender.postedDate);
      return tenderDate >= timeframe.start && tenderDate <= timeframe.end;
    });

    // Market overview calculations
    const totalMarketValue = filteredTenders
      .filter(t => t.tenderValue)
      .reduce((sum, t) => sum + t.tenderValue!, 0);

    const marketGrowthRate = this.calculateMarketGrowthRate(allTenders, timeframe);

    // Category analysis
    const categoryGrowth = this.analyzeCategoryGrowth(allTenders, timeframe);
    const topCompetitorCategories = Object.entries(categoryGrowth)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category]) => category);

    // Opportunity identification
    const underservedSegments = this.identifyUnderservedSegments(filteredTenders);
    const highValueSegments = this.identifyHighValueSegments(filteredTenders);

    // Trend analysis
    const emergingKeywords = this.identifyEmergingKeywords(filteredTenders);
    const seasonalPatterns = this.analyzeSeasonalPatterns(allTenders);

    // Generate forecast
    const forecast = this.generateMarketForecast(allTenders, timeframe);

    return {
      totalMarketValue,
      marketGrowthRate,
      averageCompetition: 65, // Simplified - would calculate from real competition data
      topCompetitorCategories,
      emergingCategories: topCompetitorCategories.slice(0, 3),
      decliningCategories: Object.entries(categoryGrowth)
        .sort(([,a], [,b]) => a - b)
        .slice(0, 3)
        .map(([category]) => category),
      underservedSegments,
      highValueSegments,
      timeBasedOpportunities: this.analyzeTimeBasedOpportunities(filteredTenders),
      emergingKeywords,
      growingBudgetRanges: this.analyzeGrowingBudgetRanges(filteredTenders),
      seasonalPatterns,
      marketRisks: this.identifyMarketRisks(filteredTenders),
      opportunities: this.identifyMarketOpportunities(filteredTenders),
      forecast
    };
  }

  // Helper methods
  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 
      ? (sorted[mid - 1] + sorted[mid]) / 2 
      : sorted[mid];
  }

  private calculateCategoryDistribution(tenders: TenderData[]): { [category: string]: number } {
    const distribution: { [category: string]: number } = {};
    tenders.forEach(tender => {
      const category = tender.category || 'Uncategorized';
      distribution[category] = (distribution[category] || 0) + 1;
    });
    return distribution;
  }

  private calculateCategoryValues(tenders: TenderData[]): { [category: string]: number } {
    const values: { [category: string]: number } = {};
    tenders.forEach(tender => {
      if (tender.tenderValue) {
        const category = tender.category || 'Uncategorized';
        values[category] = (values[category] || 0) + tender.tenderValue;
      }
    });
    return values;
  }

  private calculateSourceDistribution(tenders: TenderData[]): { [source: string]: number } {
    const distribution: { [source: string]: number } = {};
    tenders.forEach(tender => {
      distribution[tender.source] = (distribution[tender.source] || 0) + 1;
    });
    return distribution;
  }

  private calculateSourcePerformance(tenders: TenderData[]): { [source: string]: number } {
    const performance: { [source: string]: { total: number; count: number } } = {};
    
    tenders.forEach(tender => {
      if (tender.tenderValue) {
        if (!performance[tender.source]) {
          performance[tender.source] = { total: 0, count: 0 };
        }
        performance[tender.source].total += tender.tenderValue;
        performance[tender.source].count += 1;
      }
    });

    const result: { [source: string]: number } = {};
    Object.entries(performance).forEach(([source, data]) => {
      result[source] = data.count > 0 ? data.total / data.count : 0;
    });

    return result;
  }

  private calculateTimeDistribution(tenders: TenderData[], granularity: string): { [timeKey: string]: number } {
    const distribution: { [timeKey: string]: number } = {};
    
    tenders.forEach(tender => {
      const date = new Date(tender.postedDate);
      let key: string;
      
      switch (granularity) {
        case 'hour':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = `${weekStart.getFullYear()}-W${Math.ceil(weekStart.getDate() / 7)}`;
          break;
        case 'month':
          key = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          key = date.toDateString();
      }
      
      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }

  private calculateSeasonalTrends(tenders: TenderData[]): { [month: string]: number } {
    const trends: { [month: string]: number } = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    tenders.forEach(tender => {
      const month = months[new Date(tender.postedDate).getMonth()];
      trends[month] = (trends[month] || 0) + 1;
    });

    return trends;
  }

  private calculateClosingTrends(tenders: TenderData[]): { [daysLeft: string]: number } {
    const trends: { [daysLeft: string]: number } = {};
    const now = new Date();

    tenders.forEach(tender => {
      const closingDate = new Date(tender.closingDate);
      const daysLeft = Math.ceil((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      let category: string;
      if (daysLeft < 0) category = 'Expired';
      else if (daysLeft === 0) category = 'Today';
      else if (daysLeft <= 3) category = '1-3 days';
      else if (daysLeft <= 7) category = '4-7 days';
      else if (daysLeft <= 14) category = '1-2 weeks';
      else if (daysLeft <= 30) category = '2-4 weeks';
      else category = '1+ months';

      trends[category] = (trends[category] || 0) + 1;
    });

    return trends;
  }

  private analyzeCompetitionLevels(tenders: TenderData[]): { high: number; medium: number; low: number } {
    // Simplified competition analysis based on tender value and category
    let high = 0, medium = 0, low = 0;

    tenders.forEach(tender => {
      const value = tender.tenderValue || 0;
      const keywords = `${tender.name} ${tender.description || ''}`.toLowerCase();
      
      // High competition indicators
      if (value > 10000000 || keywords.includes('software') || keywords.includes('it')) {
        high++;
      } else if (value > 1000000 || keywords.includes('supply') || keywords.includes('service')) {
        medium++;
      } else {
        low++;
      }
    });

    return { high, medium, low };
  }

  private calculateGeographicDistribution(tenders: TenderData[]): { [region: string]: number } {
    const distribution: { [region: string]: number } = {};
    
    tenders.forEach(tender => {
      const region = tender.location || 'Unknown';
      distribution[region] = (distribution[region] || 0) + 1;
    });

    return distribution;
  }

  private generatePredictions(tenders: TenderData[], timeframe: AnalyticsTimeframe): any {
    // Simplified prediction algorithm
    const weeklyAverage = tenders.length / Math.ceil((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24 * 7));
    const totalValue = tenders.filter(t => t.tenderValue).reduce((sum, t) => sum + t.tenderValue!, 0);
    const monthlyValueAverage = totalValue / Math.ceil((timeframe.end.getTime() - timeframe.start.getTime()) / (1000 * 60 * 60 * 24 * 30));

    return {
      nextWeekTenders: Math.round(weeklyAverage),
      nextMonthValue: Math.round(monthlyValueAverage),
      highOpportunityCount: Math.round(weeklyAverage * 0.3) // Assume 30% are high opportunity
    };
  }

  private generateImprovementSuggestions(matchingResults: TenderScore[]): string[] {
    const suggestions: string[] = [];
    
    const avgScore = matchingResults.length > 0 
      ? matchingResults.reduce((sum, r) => sum + r.overallScore, 0) / matchingResults.length 
      : 0;

    if (avgScore < 40) {
      suggestions.push("Consider updating your business profile to better match available tenders");
    }
    
    if (matchingResults.filter(r => r.matchingFactors.budgetFit < 50).length > matchingResults.length * 0.5) {
      suggestions.push("Review your budget range settings to find more suitable opportunities");
    }

    if (matchingResults.filter(r => r.matchingFactors.geographicalMatch < 50).length > matchingResults.length * 0.3) {
      suggestions.push("Consider expanding your geographical coverage areas");
    }

    return suggestions;
  }

  // Additional helper methods for market intelligence
  private calculateMarketGrowthRate(tenders: TenderData[], timeframe: AnalyticsTimeframe): number {
    // Simplified calculation - would compare with previous period
    return 15.5; // Example growth rate
  }

  private analyzeCategoryGrowth(tenders: TenderData[], timeframe: AnalyticsTimeframe): { [category: string]: number } {
    // Simplified category growth analysis
    return {
      'IT': 25.5,
      'Construction': 15.2,
      'Supply': 10.8,
      'Services': 20.1
    };
  }

  private identifyUnderservedSegments(tenders: TenderData[]): string[] {
    return ['Small IT Services', 'Niche Consulting', 'Specialized Equipment'];
  }

  private identifyHighValueSegments(tenders: TenderData[]): string[] {
    return ['Infrastructure', 'Large IT Projects', 'Multi-year Contracts'];
  }

  private identifyEmergingKeywords(tenders: TenderData[]): string[] {
    return ['digital transformation', 'cloud services', 'sustainability', 'automation'];
  }

  private analyzeSeasonalPatterns(tenders: TenderData[]): { [month: string]: { volume: number; value: number } } {
    // Simplified seasonal analysis
    return {
      'Jan': { volume: 45, value: 15000000 },
      'Feb': { volume: 38, value: 12000000 },
      'Mar': { volume: 52, value: 18000000 }
      // ... would calculate for all months
    };
  }

  private analyzeTimeBasedOpportunities(tenders: TenderData[]): { [timeSlot: string]: number } {
    return {
      'Morning (9-12)': 35,
      'Afternoon (12-17)': 45,
      'Evening (17-20)': 20
    };
  }

  private analyzeGrowingBudgetRanges(tenders: TenderData[]): { min: number; max: number; growth: number }[] {
    return [
      { min: 100000, max: 500000, growth: 25.5 },
      { min: 1000000, max: 5000000, growth: 15.2 },
      { min: 10000000, max: 50000000, growth: 35.8 }
    ];
  }

  private identifyMarketRisks(tenders: TenderData[]): string[] {
    return [
      'Increasing competition in IT sector',
      'Budget constraints in government spending',
      'Regulatory changes affecting procurement'
    ];
  }

  private identifyMarketOpportunities(tenders: TenderData[]): string[] {
    return [
      'Growing demand for digital services',
      'Infrastructure modernization projects',
      'Green/sustainable solution requirements'
    ];
  }

  private generateMarketForecast(tenders: TenderData[], timeframe: AnalyticsTimeframe): any {
    return {
      nextQuarter: {
        expectedTenders: 150,
        expectedValue: 250000000,
        topCategories: ['IT', 'Infrastructure', 'Services']
      },
      yearEnd: {
        projectedTenders: 600,
        projectedValue: 1000000000,
        confidenceLevel: 75
      }
    };
  }

  private extractPreferredCategories(interactions: any[]): string[] {
    // Extract categories from user interactions
    return ['IT', 'Services', 'Supply']; // Simplified
  }

  private calculatePeakActivityHours(interactions: any[]): number[] {
    // Calculate hours when user is most active
    return [9, 10, 11, 14, 15, 16]; // Simplified - 9-11 AM and 2-4 PM
  }
}

// Import TenderData from intelligent matching
import { TenderData } from './intelligent-matching';

export const advancedAnalyticsEngine = new AdvancedAnalyticsEngine();