// src/app/dashboard/subscription/page.tsx - Modern Subscription Management
"use client";
import React, { useState, useEffect, useCallback } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  CreditCard,
  Crown,
  Calendar,
  DollarSign,
  RefreshCw,
  TrendingUp,
  Target,
  Clock,
  Activity,
  Award,
  Lightbulb,
  Mail,
  Download,
  AlertCircle,
  Loader2,
  Zap,
  BarChart3,
  ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

// Interfaces
interface Analytics {
  hasSubscription: boolean;
  subscription?: {
    planName: string;
    status: string;
    subscriptionType: string;
    amountPaid: number;
    startDate: string;
    endDate: string;
    daysTotal: number;
    daysUsed: number;
    daysRemaining: number;
    usagePercentage: number;
    costPerDay: number;
    valueUsed: number;
  };
  usage?: {
    currentMonth: {
      tendersViewed: number;
      downloadsCompleted: number;
      searchesPerformed: number;
      alertsReceived: number;
      timesSaved: number;
      potentialOpportunities: number;
    };
    trends: {
      tendersViewedGrowth: number;
      downloadsGrowth: number;
      efficiencyImprovement: number;
    };
  };
  roi?: {
    estimatedValue: number;
    investmentAmount: number;
    estimatedROI: number;
    timeSavedValue: number;
    opportunitiesValue: number;
    totalEstimatedValue: number;
  };
  insights?: Array<{
    type: string;
    title: string;
    message: string;
    icon: string;
  }>;
  recommendations?: Array<{
    title: string;
    description: string;
    action: string;
    priority: string;
  }>;
}

export default function SubscriptionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const fetchSubscriptionData = useCallback(async () => {
    if (!user?.email) return;

    try {
      setError(null);
      const analyticsResponse = await fetch(`/api/subscription/analytics?email=${user.email}`);

      if (analyticsResponse.ok) {
        const analyticsData = await analyticsResponse.json();
        setAnalytics(analyticsData.analytics);
      }
    } catch (err) {
      setError("Failed to load subscription data");
      console.error("Subscription fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.email]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchSubscriptionData();
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={false}
            onCloseMobile={() => {}}
          />
          <main className="flex-1 overflow-auto">
            <div className="p-8 flex items-center justify-center h-full">
              <div className="text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Your Subscription</h3>
                <p className="text-gray-600">Please wait while we fetch your subscription details...</p>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!analytics?.hasSubscription) {
    return (
      <ProtectedRoute>
        <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            isMobileOpen={false}
            onCloseMobile={() => {}}
          />
          <main className="flex-1 overflow-auto">
            <div className="p-8">
              <div className="max-w-4xl mx-auto">
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-6 flex items-center justify-center">
                    <Crown className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-4">Unlock Premium Features</h2>
                  <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Subscribe to access premium tender data, advanced analytics, and exclusive insights to grow your business.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button 
                      size="lg" 
                      onClick={() => router.push("/pricing")}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3"
                    >
                      <Crown className="h-5 w-5 mr-2" />
                      View Plans & Pricing
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      className="px-8 py-3"
                    >
                      Learn More
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="flex h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          isMobileOpen={false}
          onCloseMobile={() => {}}
        />
        <main className="flex-1 overflow-auto">
          <div className="p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-8">
              
              {/* Header Section */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 mb-2">Subscription Overview</h1>
                  <p className="text-lg text-gray-600">
                    Track your plan usage, ROI, and subscription value
                  </p>
                </div>
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={refreshing}
                  className="self-start lg:self-auto"
                >
                  {refreshing ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Refresh Data
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}

              {/* Plan Status - Hero Card */}
              <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white overflow-hidden">
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur">
                        <Crown className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold">{analytics.subscription?.planName}</h2>
                        <Badge className="bg-white/20 text-white border-white/30 mt-1">
                          {analytics.subscription?.subscriptionType}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold mb-1">
                        {formatCurrency(analytics.subscription?.amountPaid || 0)}
                      </div>
                      <div className="text-white/80">Total Investment</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="h-5 w-5 text-white/80" />
                        <span className="text-white/80">Period</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {formatDate(analytics.subscription?.startDate || "")} - {formatDate(analytics.subscription?.endDate || "")}
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="h-5 w-5 text-white/80" />
                        <span className="text-white/80">Remaining</span>
                      </div>
                      <div className="text-lg font-semibold">
                        {analytics.subscription?.daysRemaining} days left
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur">
                      <div className="flex items-center space-x-2 mb-2">
                        <BarChart3 className="h-5 w-5 text-white/80" />
                        <span className="text-white/80">Usage</span>
                      </div>
                      <Progress 
                        value={analytics.subscription?.usagePercentage || 0} 
                        className="mb-2 bg-white/20" 
                      />
                      <div className="text-sm text-white/80">
                        {analytics.subscription?.usagePercentage}% complete
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Key Metrics Grid */}
              {analytics.roi && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                          <TrendingUp className="h-6 w-6 text-green-600" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.roi.estimatedROI.toFixed(0)}%
                        </p>
                        <p className="text-sm text-gray-600">Return on Investment</p>
                        <p className="text-xs text-green-600 font-medium">Excellent performance</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                          <Target className="h-6 w-6 text-blue-600" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.usage?.currentMonth.potentialOpportunities}
                        </p>
                        <p className="text-sm text-gray-600">Opportunities Found</p>
                        <p className="text-xs text-blue-600 font-medium">This month</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                          <Zap className="h-6 w-6 text-purple-600" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-gray-900">
                          {analytics.usage?.currentMonth.timesSaved}h
                        </p>
                        <p className="text-sm text-gray-600">Time Saved</p>
                        <p className="text-xs text-purple-600 font-medium">Automation value</p>
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-amber-600" />
                        </div>
                        <ArrowUpRight className="h-5 w-5 text-gray-400" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(analytics.roi.totalEstimatedValue)}
                        </p>
                        <p className="text-sm text-gray-600">Estimated Value</p>
                        <p className="text-xs text-amber-600 font-medium">Total potential</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Usage Analytics */}
              {analytics.usage && (
                <Card className="border-0 shadow-lg">
                  <CardHeader className="pb-4">
                    <CardTitle className="flex items-center text-xl">
                      <Activity className="h-6 w-6 mr-3 text-blue-600" />
                      Usage Analytics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="text-center p-4 rounded-xl bg-blue-50">
                        <div className="w-12 h-12 bg-blue-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <p className="text-2xl font-bold text-blue-700 mb-1">
                          {analytics.usage.currentMonth.tendersViewed}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Tenders Viewed</p>
                        <p className="text-xs text-green-600 font-medium">
                          +{analytics.usage.trends.tendersViewedGrowth}% growth
                        </p>
                      </div>
                      
                      <div className="text-center p-4 rounded-xl bg-green-50">
                        <div className="w-12 h-12 bg-green-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Download className="h-6 w-6 text-green-600" />
                        </div>
                        <p className="text-2xl font-bold text-green-700 mb-1">
                          {analytics.usage.currentMonth.downloadsCompleted}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Downloads</p>
                        <p className="text-xs text-green-600 font-medium">
                          +{analytics.usage.trends.downloadsGrowth}% growth
                        </p>
                      </div>
                      
                      <div className="text-center p-4 rounded-xl bg-purple-50">
                        <div className="w-12 h-12 bg-purple-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-purple-600" />
                        </div>
                        <p className="text-2xl font-bold text-purple-700 mb-1">
                          {analytics.usage.currentMonth.searchesPerformed}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Searches</p>
                        <p className="text-xs text-gray-500">This month</p>
                      </div>
                      
                      <div className="text-center p-4 rounded-xl bg-orange-50">
                        <div className="w-12 h-12 bg-orange-100 rounded-full mx-auto mb-3 flex items-center justify-center">
                          <Mail className="h-6 w-6 text-orange-600" />
                        </div>
                        <p className="text-2xl font-bold text-orange-700 mb-1">
                          {analytics.usage.currentMonth.alertsReceived}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">Alerts</p>
                        <p className="text-xs text-gray-500">Notifications</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Insights & Recommendations */}
              {(analytics.insights && analytics.insights.length > 0) || (analytics.recommendations && analytics.recommendations.length > 0) ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  
                  {/* Smart Insights */}
                  {analytics.insights && analytics.insights.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                          <Lightbulb className="h-6 w-6 mr-3 text-yellow-500" />
                          Smart Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analytics.insights.map((insight, index) => (
                          <div key={index} className="flex items-start space-x-4 p-4 rounded-xl bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-100">
                            <div className={`p-2 rounded-lg ${
                              insight.type === 'positive' ? 'bg-green-100 text-green-600' :
                              insight.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                              insight.type === 'success' ? 'bg-blue-100 text-blue-600' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {insight.icon === 'trending-up' && <TrendingUp className="h-5 w-5" />}
                              {insight.icon === 'target' && <Target className="h-5 w-5" />}
                              {insight.icon === 'clock' && <Clock className="h-5 w-5" />}
                              {insight.icon === 'award' && <Award className="h-5 w-5" />}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                              <p className="text-gray-700 text-sm leading-relaxed">{insight.message}</p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Action Recommendations */}
                  {analytics.recommendations && analytics.recommendations.length > 0 && (
                    <Card className="border-0 shadow-lg">
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                          <Target className="h-6 w-6 mr-3 text-blue-600" />
                          Action Items
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analytics.recommendations.map((rec, index) => (
                          <div key={index} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 mb-1">{rec.title}</h4>
                                <p className="text-gray-600 text-sm leading-relaxed">{rec.description}</p>
                              </div>
                              <Badge variant={rec.priority === 'high' ? 'destructive' : 
                                             rec.priority === 'medium' ? 'default' : 'secondary'} 
                                     className="ml-3">
                                {rec.priority}
                              </Badge>
                            </div>
                            <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50">
                              {rec.action}
                            </Button>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : null}

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Button 
                      onClick={() => router.push("/pricing")}
                      className="h-16 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white group"
                    >
                      <div className="text-center">
                        <Crown className="h-5 w-5 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">Upgrade Plan</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => router.push("/dashboard/billing")}
                      className="h-16 border-gray-200 hover:bg-gray-50 group"
                    >
                      <div className="text-center">
                        <CreditCard className="h-5 w-5 mx-auto mb-1 text-gray-600 group-hover:text-gray-800" />
                        <span className="text-sm font-medium text-gray-700">Billing History</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="h-16 border-gray-200 hover:bg-gray-50 group"
                    >
                      <div className="text-center">
                        <Download className="h-5 w-5 mx-auto mb-1 text-gray-600 group-hover:text-gray-800" />
                        <span className="text-sm font-medium text-gray-700">Download Invoice</span>
                      </div>
                    </Button>
                    
                    <Button 
                      variant="outline"
                      className="h-16 border-gray-200 hover:bg-gray-50 group"
                    >
                      <div className="text-center">
                        <Mail className="h-5 w-5 mx-auto mb-1 text-gray-600 group-hover:text-gray-800" />
                        <span className="text-sm font-medium text-gray-700">Contact Support</span>
                      </div>
                    </Button>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}