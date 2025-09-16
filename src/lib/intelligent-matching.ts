// src/lib/intelligent-matching.ts - AI-powered tender matching system
export interface TenderMatchingProfile {
  id: string;
  userId: string;
  companyName: string;
  businessCategories: string[];
  capabilities: string[];
  geographicalAreas: string[];
  budgetRange: {
    min: number;
    max: number;
  };
  experienceYears: number;
  pastProjects: string[];
  successRate: number;
  preferredTenderTypes: string[];
  blacklistedKeywords: string[];
  minimumTenderValue: number;
  maximumTenderValue?: number;
  created_at: string;
  updated_at: string;
}

export interface TenderData {
  id: string;
  name: string;
  description?: string;
  source: string;
  postedDate: string;
  closingDate: string;
  tenderValue?: number;
  category?: string;
  location?: string;
  requirements?: string[];
  keywords?: string[];
  documentUrl?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
}

export interface TenderScore {
  tenderId: string;
  overallScore: number;
  confidenceLevel: 'high' | 'medium' | 'low';
  matchingFactors: {
    categoryMatch: number;
    capabilityMatch: number;
    budgetFit: number;
    geographicalMatch: number;
    experienceRelevance: number;
    keywordRelevance: number;
    urgencyFactor: number;
    competitionLevel: number;
  };
  recommendations: string[];
  riskAssessment: {
    winProbability: number;
    competitionLevel: 'low' | 'medium' | 'high';
    riskFactors: string[];
  };
  actionItems: string[];
}

class IntelligentTenderMatcher {
  private nlpKeywords: { [key: string]: string[] } = {
    'IT': ['software', 'hardware', 'computer', 'technology', 'digital', 'system', 'network', 'database'],
    'Construction': ['building', 'construction', 'infrastructure', 'civil', 'architecture', 'renovation'],
    'Supply': ['supply', 'procurement', 'materials', 'equipment', 'goods', 'inventory'],
    'Services': ['services', 'maintenance', 'support', 'consulting', 'management', 'operation'],
    'Education': ['education', 'training', 'academic', 'learning', 'course', 'curriculum'],
    'Healthcare': ['medical', 'health', 'hospital', 'clinical', 'pharmaceutical', 'wellness']
  };

  // Extract key information from tender using NLP-like processing
  private extractTenderKeywords(tender: TenderData): string[] {
    const text = `${tender.name} ${tender.description || ''} ${tender.requirements?.join(' ') || ''}`.toLowerCase();
    
    const extractedKeywords: string[] = [];
    
    // Extract category-based keywords
    Object.entries(this.nlpKeywords).forEach(([category, keywords]) => {
      keywords.forEach(keyword => {
        if (text.includes(keyword)) {
          extractedKeywords.push(keyword);
          extractedKeywords.push(category.toLowerCase());
        }
      });
    });

    // Extract amount-related keywords
    const amountRegex = /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:rs|rupees|inr|₹)/gi;
    const amounts = text.match(amountRegex);
    if (amounts) {
      extractedKeywords.push('budget_specified');
    }

    return [...new Set(extractedKeywords)];
  }

  // Calculate category matching score
  private calculateCategoryMatch(profile: TenderMatchingProfile, tender: TenderData): number {
    const tenderKeywords = this.extractTenderKeywords(tender);
    const userCategories = profile.businessCategories.map(cat => cat.toLowerCase());
    
    const matches = tenderKeywords.filter(keyword => 
      userCategories.some(cat => cat.includes(keyword) || keyword.includes(cat))
    );
    
    return Math.min(matches.length / Math.max(userCategories.length, 1), 1) * 100;
  }

  // Calculate capability matching score
  private calculateCapabilityMatch(profile: TenderMatchingProfile, tender: TenderData): number {
    const tenderKeywords = this.extractTenderKeywords(tender);
    const userCapabilities = profile.capabilities.map(cap => cap.toLowerCase());
    
    const matches = tenderKeywords.filter(keyword => 
      userCapabilities.some(cap => cap.includes(keyword) || keyword.includes(cap))
    );
    
    return Math.min(matches.length / Math.max(userCapabilities.length, 1), 1) * 100;
  }

  // Calculate budget fit score
  private calculateBudgetFit(profile: TenderMatchingProfile, tender: TenderData): number {
    if (!tender.tenderValue) return 50; // Neutral score if no budget info

    const tenderValue = tender.tenderValue;
    const userMin = profile.budgetRange.min;
    const userMax = profile.budgetRange.max;

    if (tenderValue >= userMin && tenderValue <= userMax) {
      return 100; // Perfect fit
    } else if (tenderValue < userMin) {
      // Too small - might still be acceptable
      const ratio = tenderValue / userMin;
      return Math.max(ratio * 60, 20); // Minimum 20% score
    } else {
      // Too large - calculate based on capability stretch
      const stretchRatio = tenderValue / userMax;
      if (stretchRatio <= 1.5) {
        return 80; // Manageable stretch
      } else if (stretchRatio <= 2) {
        return 50; // Significant stretch
      } else {
        return 20; // Likely too large
      }
    }
  }

  // Calculate geographical matching
  private calculateGeographicalMatch(profile: TenderMatchingProfile, tender: TenderData): number {
    if (!tender.location || profile.geographicalAreas.length === 0) {
      return 70; // Neutral score if location data missing
    }

    const tenderLocation = tender.location.toLowerCase();
    const userAreas = profile.geographicalAreas.map(area => area.toLowerCase());

    // Check for direct matches
    if (userAreas.some(area => tenderLocation.includes(area) || area.includes(tenderLocation))) {
      return 100;
    }

    // Check for regional matches (basic implementation)
    const stateMatches = userAreas.some(area => {
      return ['andhra pradesh', 'telangana'].every(state => 
        (tenderLocation.includes(state) && area.includes(state)) ||
        (area === 'south india' && tenderLocation.includes(state))
      );
    });

    return stateMatches ? 80 : 30;
  }

  // Calculate experience relevance
  private calculateExperienceRelevance(profile: TenderMatchingProfile, tender: TenderData): number {
    const baseScore = Math.min(profile.experienceYears / 5, 1) * 50; // Max 50 points for experience years
    
    // Bonus for relevant past projects
    const tenderKeywords = this.extractTenderKeywords(tender);
    const relevantProjects = profile.pastProjects.filter(project => 
      tenderKeywords.some(keyword => project.toLowerCase().includes(keyword))
    );
    
    const projectBonus = Math.min(relevantProjects.length / 3, 1) * 50; // Max 50 points for relevant projects
    
    return Math.min(baseScore + projectBonus, 100);
  }

  // Calculate urgency factor based on closing date
  private calculateUrgencyFactor(tender: TenderData): number {
    const now = new Date();
    const closingDate = new Date(tender.closingDate);
    const daysLeft = Math.ceil((closingDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 0; // Expired
    if (daysLeft <= 1) return 95; // Very urgent
    if (daysLeft <= 3) return 85; // Urgent
    if (daysLeft <= 7) return 70; // Moderate urgency
    if (daysLeft <= 14) return 50; // Some time
    return 30; // Plenty of time
  }

  // Estimate competition level (simplified)
  private estimateCompetitionLevel(tender: TenderData): { level: 'low' | 'medium' | 'high', score: number } {
    const tenderValue = tender.tenderValue || 0;
    const keywords = this.extractTenderKeywords(tender);
    
    // Higher value tenders typically have more competition
    let competitionScore = 50;
    
    if (tenderValue > 10000000) { // > 1 crore
      competitionScore += 30;
    } else if (tenderValue > 1000000) { // > 10 lakhs
      competitionScore += 20;
    } else if (tenderValue > 100000) { // > 1 lakh
      competitionScore += 10;
    }

    // Certain categories have higher competition
    const highCompetitionKeywords = ['software', 'it', 'computer', 'technology'];
    const hasHighCompetitionKeywords = keywords.some(k => highCompetitionKeywords.includes(k));
    if (hasHighCompetitionKeywords) {
      competitionScore += 15;
    }

    const level = competitionScore > 70 ? 'high' : competitionScore > 40 ? 'medium' : 'low';
    
    return { level, score: Math.min(competitionScore, 100) };
  }

  // Generate recommendations based on analysis
  private generateRecommendations(profile: TenderMatchingProfile, tender: TenderData, matchingFactors: any): string[] {
    const recommendations: string[] = [];

    if (matchingFactors.categoryMatch < 50) {
      recommendations.push("Consider partnering with companies that have stronger category expertise");
    }

    if (matchingFactors.budgetFit < 60) {
      if (tender.tenderValue && tender.tenderValue > profile.budgetRange.max) {
        recommendations.push("This tender exceeds your typical budget range - consider joint ventures");
      } else {
        recommendations.push("This tender is below your usual range - evaluate if it's worth the effort");
      }
    }

    if (matchingFactors.urgencyFactor > 80) {
      recommendations.push("URGENT: This tender closes soon - prioritize preparation immediately");
    }

    if (matchingFactors.competitionLevel > 70) {
      recommendations.push("High competition expected - focus on unique value propositions");
    }

    if (matchingFactors.experienceRelevance < 50) {
      recommendations.push("Highlight transferable skills and consider showcasing similar past work");
    }

    return recommendations;
  }

  // Main scoring function
  public scoreTenderMatch(profile: TenderMatchingProfile, tender: TenderData): TenderScore {
    // Check blacklisted keywords first
    const tenderText = `${tender.name} ${tender.description || ''}`.toLowerCase();
    const hasBlacklistedKeywords = profile.blacklistedKeywords.some(keyword => 
      tenderText.includes(keyword.toLowerCase())
    );

    if (hasBlacklistedKeywords) {
      return {
        tenderId: tender.id,
        overallScore: 0,
        confidenceLevel: 'low',
        matchingFactors: {
          categoryMatch: 0,
          capabilityMatch: 0,
          budgetFit: 0,
          geographicalMatch: 0,
          experienceRelevance: 0,
          keywordRelevance: 0,
          urgencyFactor: 0,
          competitionLevel: 0
        },
        recommendations: ["This tender contains blacklisted keywords and has been automatically filtered out"],
        riskAssessment: {
          winProbability: 0,
          competitionLevel: 'high',
          riskFactors: ["Contains blacklisted content"]
        },
        actionItems: []
      };
    }

    // Calculate all matching factors
    const matchingFactors = {
      categoryMatch: this.calculateCategoryMatch(profile, tender),
      capabilityMatch: this.calculateCapabilityMatch(profile, tender),
      budgetFit: this.calculateBudgetFit(profile, tender),
      geographicalMatch: this.calculateGeographicalMatch(profile, tender),
      experienceRelevance: this.calculateExperienceRelevance(profile, tender),
      keywordRelevance: this.extractTenderKeywords(tender).length * 10, // Simple keyword relevance
      urgencyFactor: this.calculateUrgencyFactor(tender),
      competitionLevel: this.estimateCompetitionLevel(tender).score
    };

    // Weighted overall score calculation
    const weights = {
      categoryMatch: 0.25,
      capabilityMatch: 0.20,
      budgetFit: 0.15,
      geographicalMatch: 0.10,
      experienceRelevance: 0.15,
      keywordRelevance: 0.05,
      urgencyFactor: 0.05,
      competitionLevel: -0.05 // Negative weight - higher competition reduces score
    };

    let overallScore = 0;
    Object.entries(weights).forEach(([factor, weight]) => {
      overallScore += (matchingFactors[factor as keyof typeof matchingFactors] * weight);
    });

    overallScore = Math.max(0, Math.min(100, overallScore));

    // Determine confidence level
    let confidenceLevel: 'high' | 'medium' | 'low';
    if (overallScore >= 80) confidenceLevel = 'high';
    else if (overallScore >= 60) confidenceLevel = 'medium';
    else confidenceLevel = 'low';

    // Calculate win probability
    const baseWinProbability = overallScore * 0.6; // Base on overall score
    const experienceBonus = Math.min(profile.successRate * 0.3, 20); // Up to 20% bonus for success rate
    const winProbability = Math.min(baseWinProbability + experienceBonus, 95);

    const competition = this.estimateCompetitionLevel(tender);

    const recommendations = this.generateRecommendations(profile, tender, matchingFactors);

    // Generate action items
    const actionItems: string[] = [];
    if (overallScore >= 70) {
      actionItems.push("Start preparing your proposal immediately");
      actionItems.push("Review tender requirements in detail");
      actionItems.push("Gather necessary documentation and certifications");
    } else if (overallScore >= 50) {
      actionItems.push("Evaluate if this tender aligns with your strategic goals");
      actionItems.push("Consider the time investment vs. potential return");
    } else {
      actionItems.push("Consider if this tender is worth pursuing given the low match score");
    }

    const riskFactors: string[] = [];
    if (matchingFactors.budgetFit < 50) riskFactors.push("Budget mismatch may affect competitiveness");
    if (matchingFactors.urgencyFactor > 90) riskFactors.push("Very tight deadline may compromise proposal quality");
    if (competition.level === 'high') riskFactors.push("High competition expected");

    return {
      tenderId: tender.id,
      overallScore: Math.round(overallScore),
      confidenceLevel,
      matchingFactors: {
        ...matchingFactors,
        competitionLevel: competition.score
      },
      recommendations,
      riskAssessment: {
        winProbability: Math.round(winProbability),
        competitionLevel: competition.level,
        riskFactors
      },
      actionItems
    };
  }

  // Batch scoring for multiple tenders
  public scoreMutipleTenders(profile: TenderMatchingProfile, tenders: TenderData[]): TenderScore[] {
    return tenders
      .map(tender => this.scoreTenderMatch(profile, tender))
      .sort((a, b) => b.overallScore - a.overallScore); // Sort by score descending
  }
}

export const intelligentTenderMatcher = new IntelligentTenderMatcher();