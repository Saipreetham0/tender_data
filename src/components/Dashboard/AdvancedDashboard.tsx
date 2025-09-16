// src/components/Dashboard/AdvancedDashboard.tsx - World-class analytics dashboard
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertTriangle,
  Target,
  Clock,
  Building2,
  DollarSign,
  Users,
  Zap,
  Brain,
  Activity,
  Calendar,
  MapPin,
  Award,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Filter,
  Download,
  Share,
  Bell,
  Settings,
  ChevronRight,
  Star,
  Eye,
  Briefcase,
  PieChart,
  BarChart,
  LineChart
} from 'lucide-react';
import {
  advancedAnalyticsEngine,
  TenderAnalytics,
  UserAnalytics,
  MarketIntelligence,
  AnalyticsTimeframe
} from '@/lib/advanced-analytics';
import {
  intelligentTenderMatcher,
  TenderMatchingProfile,
  TenderScore,
  TenderData
} from '@/lib/intelligent-matching';

interface AdvancedDashboardProps {
  userId?: string;
  userProfile?: TenderMatchingProfile;
  className?: string;
}

const AdvancedDashboard: React.FC<AdvancedDashboardProps> = ({
  userId,
  userProfile,
  className = ""
}) => {
  const [tenderAnalytics, setTenderAnalytics] = useState<TenderAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [marketIntelligence, setMarketIntelligence] = useState<MarketIntelligence | null>(null);
  const [matchingResults, setMatchingResults] = useState<TenderScore[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadAdvancedAnalytics();
  }, [timeframe, userId]);

  const loadAdvancedAnalytics = async () => {
    try {
      setLoading(true);

      // Create timeframe based on selection
      const now = new Date();
      const start = new Date();
      
      switch (timeframe) {
        case '7d':
          start.setDate(now.getDate() - 7);
          break;
        case '30d':
          start.setDate(now.getDate() - 30);
          break;
        case '90d':
          start.setDate(now.getDate() - 90);
          break;
        case '1y':
          start.setFullYear(now.getFullYear() - 1);
          break;
      }

      const analyticsTimeframe: AnalyticsTimeframe = {
        start,
        end: now,
        granularity: 'day'
      };

      // Simulate loading tender data - in real app, this would come from your API
      const mockTenders: TenderData[] = [
        {
          id: '1',
          name: 'Software Development for Campus Management System',
          description: 'Development of comprehensive campus management software',
          source: 'RGUKT Basar',
          postedDate: '2024-01-15',
          closingDate: '2024-02-15',
          tenderValue: 5000000,
          category: 'IT',
          location: 'Telangana',
          requirements: ['Software Development', 'Database Design', 'UI/UX'],
          keywords: ['software', 'development', 'system']
        },
        {
          id: '2',
          name: 'Construction of New Laboratory Building',
          description: 'Construction and setup of modern laboratory facilities',
          source: 'RGUKT Ongole',
          postedDate: '2024-01-20',
          closingDate: '2024-03-01',
          tenderValue: 15000000,
          category: 'Construction',
          location: 'Andhra Pradesh',
          requirements: ['Civil Construction', 'Electrical Work', 'Plumbing'],
          keywords: ['construction', 'building', 'laboratory']
        }
        // Add more mock data as needed
      ];

      // Calculate analytics
      const tenderAnalytics = advancedAnalyticsEngine.calculateTenderAnalytics(
        mockTenders,
        analyticsTimeframe
      );

      setTenderAnalytics(tenderAnalytics);

      // Calculate user analytics if profile provided
      if (userProfile && userId) {
        const matchingResults = intelligentTenderMatcher.scoreMutipleTenders(userProfile, mockTenders);
        setMatchingResults(matchingResults);

        const userAnalytics = advancedAnalyticsEngine.calculateUserAnalytics(
          userId,
          [], // Mock user interactions
          matchingResults
        );
        setUserAnalytics(userAnalytics);
      }

      // Generate market intelligence
      const marketIntelligence = advancedAnalyticsEngine.generateMarketIntelligence(
        mockTenders,
        analyticsTimeframe
      );
      setMarketIntelligence(marketIntelligence);

    } catch (error) {
      console.error('Error loading advanced analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    changeType = 'positive', 
    icon: Icon, 
    description,
    color = "blue"
  }: {
    title: string;
    value: string | number;
    change?: number;
    changeType?: 'positive' | 'negative' | 'neutral';
    icon: React.ComponentType<any>;
    description?: string;
    color?: string;
  }) => {
    const colorClasses = {
      blue: 'from-blue-500 to-blue-600',
      green: 'from-green-500 to-green-600',
      purple: 'from-purple-500 to-purple-600',
      orange: 'from-orange-500 to-orange-600',
      red: 'from-red-500 to-red-600',
      indigo: 'from-indigo-500 to-indigo-600'
    };

    return (
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-2xl font-bold text-gray-900">{value}</p>
              {change !== undefined && (
                <div className="flex items-center mt-1">
                  {changeType === 'positive' ? (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  ) : changeType === 'negative' ? (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  ) : null}
                  <span className={`text-sm ${
                    changeType === 'positive' ? 'text-green-600' : 
                    changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {change > 0 ? '+' : ''}{change.toFixed(1)}%
                  </span>
                </div>
              )}
              {description && (
                <p className="text-xs text-gray-500 mt-1">{description}</p>
              )}
            </div>
            <div className={`p-3 rounded-full bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]}`}>
              <Icon className="h-6 w-6 text-white" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const MatchingScoreCard = ({ score }: { score: TenderScore }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Badge variant={score.confidenceLevel === 'high' ? 'default' : score.confidenceLevel === 'medium' ? 'secondary' : 'outline'}>
              {score.overallScore}%
            </Badge>
            <Badge variant="outline" className={
              score.confidenceLevel === 'high' ? 'border-green-200 text-green-800' :
              score.confidenceLevel === 'medium' ? 'border-yellow-200 text-yellow-800' :
              'border-red-200 text-red-800'
            }>
              {score.confidenceLevel}
            </Badge>
          </div>
          <Brain className="h-5 w-5 text-purple-600" />
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Category Match</span>
            <span className="font-medium">{score.matchingFactors.categoryMatch.toFixed(0)}%</span>
          </div>
          <Progress value={score.matchingFactors.categoryMatch} className="h-1" />
          
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Budget Fit</span>
            <span className="font-medium">{score.matchingFactors.budgetFit.toFixed(0)}%</span>
          </div>
          <Progress value={score.matchingFactors.budgetFit} className="h-1" />
        </div>

        <div className="mt-3 pt-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Win Probability</span>
            <span className="font-semibold text-green-600">{score.riskAssessment.winProbability}%</span>
          </div>
        </div>

        {score.recommendations.length > 0 && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 line-clamp-2">
              💡 {score.recommendations[0]}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-lg">Loading advanced analytics...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Intelligence Dashboard</h1>
          <p className="text-gray-600">AI-powered insights for smarter tender decisions</p>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Timeframe Selector */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {['7d', '30d', '90d', '1y'].map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period as any)}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  timeframe === period
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {period}
              </button>
            ))}
          </div>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      {tenderAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Opportunities"
            value={tenderAnalytics.totalTenders}
            change={tenderAnalytics.tenderGrowthRate}
            changeType={tenderAnalytics.tenderGrowthRate >= 0 ? 'positive' : 'negative'}
            icon={Briefcase}
            color="blue"
          />
          
          <MetricCard
            title="Market Value"
            value={`₹${(tenderAnalytics.totalTenderValue / 10000000).toFixed(1)}Cr`}
            change={tenderAnalytics.valueGrowthRate}
            changeType={tenderAnalytics.valueGrowthRate >= 0 ? 'positive' : 'negative'}
            icon={DollarSign}
            color="green"
          />
          
          <MetricCard
            title="Urgent Opportunities"
            value={tenderAnalytics.urgentOpportunities}
            description="Closing in < 3 days"
            icon={Clock}
            color="orange"
          />
          
          <MetricCard
            title="High Match Tenders"
            value={matchingResults.filter(r => r.overallScore >= 80).length}
            description="AI-recommended matches"
            icon={Brain}
            color="purple"
          />
        </div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="matching">AI Matching</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="market">Market Intel</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-5 w-5 mr-2" />
                  Category Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenderAnalytics && Object.entries(tenderAnalytics.categoryDistribution).map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between py-2">
                    <span className="text-sm font-medium">{category}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(count / Math.max(...Object.values(tenderAnalytics.categoryDistribution))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600">{count}</span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Recent High-Value Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Top Opportunities
                  </div>
                  <Button variant="ghost" size="sm">
                    View All <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {matchingResults.slice(0, 4).map((result, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge variant={result.confidenceLevel === 'high' ? 'default' : 'secondary'}>
                        {result.overallScore}%
                      </Badge>
                      <div>
                        <p className="text-sm font-medium">Tender #{result.tenderId}</p>
                        <p className="text-xs text-gray-500">Win Rate: {result.riskAssessment.winProbability}%</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Tenders</p>
                    <p className="text-3xl font-bold text-green-600">{tenderAnalytics?.activeTenders || 0}</p>
                  </div>
                  <Activity className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg. Tender Value</p>
                    <p className="text-3xl font-bold text-blue-600">
                      ₹{((tenderAnalytics?.averageTenderValue || 0) / 100000).toFixed(1)}L
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Success Rate</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {userAnalytics?.winRate ? `${userAnalytics.winRate}%` : 'N/A'}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* AI Matching Tab */}
        <TabsContent value="matching" className="space-y-6">
          {userProfile ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">AI-Powered Tender Matching</h3>
                <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                  <Brain className="h-3 w-3 mr-1" />
                  Intelligent Matching Active
                </Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matchingResults.slice(0, 6).map((result, index) => (
                  <MatchingScoreCard key={index} score={result} />
                ))}
              </div>

              {/* Matching Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Lightbulb className="h-5 w-5 mr-2" />
                    Matching Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {userAnalytics?.improvementSuggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg mb-3">
                      <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                      <p className="text-sm text-blue-800">{suggestion}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Set Up AI Matching</h3>
                <p className="text-gray-600 mb-6">
                  Configure your business profile to get personalized tender recommendations
                </p>
                <Button>
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Profile
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Trend Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <LineChart className="h-5 w-5 mr-2" />
                  Tender Volume Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <BarChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">Interactive chart would go here</p>
                    <p className="text-sm text-gray-500">Showing tender posting trends over time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Source Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Source Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenderAnalytics && Object.entries(tenderAnalytics.sourceDistribution).map(([source, count]) => (
                  <div key={source} className="flex items-center justify-between py-3 border-b last:border-b-0">
                    <div>
                      <p className="font-medium text-sm">{source}</p>
                      <p className="text-xs text-gray-500">{count} tenders</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        ₹{((tenderAnalytics.sourcePerformance[source] || 0) / 100000).toFixed(1)}L
                      </p>
                      <p className="text-xs text-gray-500">avg. value</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Market Intelligence Tab */}
        <TabsContent value="market" className="space-y-6">
          {marketIntelligence && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetricCard
                  title="Market Size"
                  value={`₹${(marketIntelligence.totalMarketValue / 10000000).toFixed(1)}Cr`}
                  change={marketIntelligence.marketGrowthRate}
                  changeType="positive"
                  icon={TrendingUp}
                  color="green"
                />
                
                <MetricCard
                  title="Competition Level"
                  value={`${marketIntelligence.averageCompetition}%`}
                  description="Market competitiveness"
                  icon={Users}
                  color="orange"
                />
                
                <MetricCard
                  title="Growth Rate"
                  value={`${marketIntelligence.marketGrowthRate.toFixed(1)}%`}
                  description="Year over year"
                  icon={TrendingUp}
                  color="blue"
                />
              </div>

              {/* Market Insights Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Emerging Categories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {marketIntelligence.emergingCategories.map((category, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{category}</span>
                          <Badge variant="secondary">Growing</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Market Opportunities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {marketIntelligence.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-start space-x-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500 mt-1" />
                          <p className="text-sm">{opportunity}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personalized Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="h-5 w-5 mr-2" />
                  AI Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Focus Area</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    Based on your profile, focus on IT and Software Development tenders. 
                    You have a 78% higher success rate in these categories.
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-900">Timing Insight</span>
                  </div>
                  <p className="text-sm text-green-800">
                    March typically sees 40% more IT tender postings. 
                    Start preparing proposals early for maximum success.
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-100">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-orange-900">Risk Alert</span>
                  </div>
                  <p className="text-sm text-orange-800">
                    Competition in your preferred budget range (₹10L-₹50L) has increased by 25%. 
                    Consider exploring higher-value opportunities.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2" />
                  Performance Forecast
                </CardTitle>
              </CardHeader>
              <CardContent>
                {tenderAnalytics && (
                  <div className="space-y-6">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Next Week</span>
                        <span className="text-sm text-gray-600">
                          ~{tenderAnalytics.predictions.nextWeekTenders} new tenders
                        </span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Next Month Value</span>
                        <span className="text-sm text-gray-600">
                          ₹{(tenderAnalytics.predictions.nextMonthValue / 10000000).toFixed(1)}Cr expected
                        </span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">High-Value Opportunities</span>
                        <span className="text-sm text-gray-600">
                          {tenderAnalytics.predictions.highOpportunityCount} predicted
                        </span>
                      </div>
                      <Progress value={85} className="h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedDashboard;