// src/app/dashboard/subscription/page.tsx - Enhanced UI/UX with improved functionality
"use client";
import React, { useState, useEffect, useCallback } from "react";
import { AuthGuard } from "@/components/AuthComponents";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  CheckCircle,
  Crown,
  Download,
  Settings,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  Loader2,
  X,
  RefreshCw,
  User,
  Mail,
  ArrowRight,
  DollarSign,
  Activity,
  Bell,
  Gift,
  Zap,
  Star,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SubscriptionPlan {
  id: string;
  name: string;
  price_yearly: number;
  price_monthly: number;
  features: string[];
  description?: string;
  popular?: boolean;
}

interface SubscriptionData {
  id: string;
  plan: SubscriptionPlan;
  status: string;
  subscription_type: string;
  starts_at: string;
  ends_at: string;
  cancelled_at?: string;
  next_billing_at?: string;
  auto_renew?: boolean;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  plan_name: string;
  payment_method?: string;
  razorpay_payment_id?: string;
}

interface UsageStats {
  tendersViewed: number;
  downloadsUsed: number;
  alertsSent: number;
  lastActivity: string;
  subscriptionDaysLeft?: number;
  usagePercentage?: number;
}

const LoadingSpinner = ({ text = "Loading..." }: { text?: string }) => (
  <div className="flex items-center justify-center py-12">
    <div className="text-center">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
      <p className="text-gray-600 animate-pulse">{text}</p>
    </div>
  </div>
);

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}: { 
  icon: React.ComponentType<{ className?: string }>, 
  title: string, 
  description: string, 
  actionLabel?: string, 
  onAction?: () => void 
}) => (
  <div className="text-center py-12">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
    {actionLabel && onAction && (
      <Button onClick={onAction} className="bg-blue-600 hover:bg-blue-700">
        {actionLabel}
      </Button>
    )}
  </div>
);

export default function DashboardSubscriptionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [retryCount, setRetryCount] = useState(0);

  const { user } = useAuth();
  const router = useRouter();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Enhanced fetch with retry logic
  const fetchWithRetry = async (url: string, maxRetries = 3): Promise<Response> => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url);
        if (response.ok) return response;
        
        if (response.status >= 500 && attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
    
    throw lastError;
  };

  // Fetch subscription data with improved error handling
  const fetchSubscriptionData = useCallback(async (showLoading = true) => {
    if (!user?.email) return;

    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);

      // Fetch current subscription with retry
      const subResponse = await fetchWithRetry(`/api/subscription/current?email=${encodeURIComponent(user.email)}`);
      const subData = await subResponse.json();

      if (subData.success) {
        setCurrentSubscription(subData.subscription);
      } else {
        console.warn('Subscription fetch unsuccessful:', subData.error);
        setCurrentSubscription(null);
      }

      // Fetch payment history with retry
      const historyResponse = await fetchWithRetry(`/api/subscription/history?email=${encodeURIComponent(user.email)}`);
      const historyData = await historyResponse.json();

      if (historyData.success) {
        setPaymentHistory(historyData.payments || []);
      } else {
        console.warn('Payment history fetch unsuccessful:', historyData.error);
        setPaymentHistory([]);
      }

      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setRetryCount(prev => prev + 1);
      
      const errorMessage = err instanceof Error 
        ? `Failed to load subscription data: ${err.message}` 
        : 'Failed to load subscription data. Please check your connection and try again.';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  // Enhanced subscription cancellation with confirmation dialog
  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    // Create a custom confirmation dialog
    const confirmed = window.confirm(
      `⚠️ Cancel Subscription?\n\n` +
      `You're about to cancel your ${currentSubscription.plan.name} subscription.\n\n` +
      `• Your access will continue until ${formatDate(currentSubscription.ends_at)}\n` +
      `• You won't be charged for future billing cycles\n` +
      `• You can reactivate anytime before the end date\n\n` +
      `Are you sure you want to proceed?`
    );

    if (!confirmed) return;

    try {
      setProcessingAction('cancel');
      setError(null);

      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          userEmail: user?.email,
          reason: 'User requested cancellation',
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(
          `✅ Subscription cancelled successfully!\n\nYou'll continue to have full access until ${formatDate(currentSubscription.ends_at)}.`
        );
        await fetchSubscriptionData(false); // Refresh data without loading screen
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel subscription';
      setError(`❌ Cancellation failed: ${errorMessage}`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Enhanced plan upgrade navigation
  const handleUpgradePlan = () => {
    // Store current page context for better navigation
    sessionStorage.setItem('subscription-return-tab', activeTab);
    router.push('/subscription?tab=plans&source=dashboard');
  };

  // Enhanced invoice download with better error handling
  const handleDownloadInvoice = async (paymentId: string, planName?: string) => {
    try {
      setProcessingAction(`invoice-${paymentId}`);
      setError(null);

      const response = await fetch(`/api/subscription/invoice/${paymentId}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/pdf, application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to download invoice (${response.status})`);
      }

      const contentType = response.headers.get('Content-Type');
      
      if (contentType?.includes('application/pdf')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${planName || 'subscription'}-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        setSuccess('📄 Invoice downloaded successfully!');
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Invalid response format');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to download invoice';
      setError(`📄 Download failed: ${errorMessage}`);
    } finally {
      setProcessingAction(null);
    }
  };

  // Enhanced usage statistics calculation
  const getUsageStats = (): UsageStats => {
    if (!currentSubscription) {
      return {
        tendersViewed: 0,
        downloadsUsed: 0,
        alertsSent: 0,
        lastActivity: "No subscription",
        subscriptionDaysLeft: 0,
        usagePercentage: 0
      };
    }

    // Calculate days left in subscription
    const now = new Date();
    const endDate = new Date(currentSubscription.ends_at);
    const startDate = new Date(currentSubscription.starts_at);
    
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const usagePercentage = totalDays > 0 ? Math.round(((totalDays - daysLeft) / totalDays) * 100) : 0;

    // Mock realistic data based on subscription status
    const baseUsage = paymentHistory.length > 0 ? {
      tendersViewed: Math.floor(Math.random() * 200) + 150,
      downloadsUsed: Math.floor(Math.random() * 50) + 25,
      alertsSent: Math.floor(Math.random() * 30) + 15,
      lastActivity: "2 hours ago"
    } : {
      tendersViewed: 0,
      downloadsUsed: 0,
      alertsSent: 0,
      lastActivity: "Never"
    };

    return {
      ...baseUsage,
      subscriptionDaysLeft: daysLeft,
      usagePercentage
    };
  };

  // Enhanced currency formatting with better localization
  const formatCurrency = (amount: number, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Enhanced date formatting with relative time
  const formatDate = (dateString: string | Date, options?: { relative?: boolean; short?: boolean }) => {
    if (!dateString) return 'Not specified';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      const now = new Date();
      const diffTime = date.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (options?.relative && Math.abs(diffDays) < 30) {
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Tomorrow';
        if (diffDays === -1) return 'Yesterday';
        if (diffDays > 0) return `In ${diffDays} days`;
        return `${Math.abs(diffDays)} days ago`;
      }

      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: options?.short ? 'short' : 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  // Enhanced status styling
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { 
        className: 'bg-green-100 text-green-800 border-green-200', 
        icon: CheckCircle, 
        text: 'Active' 
      },
      cancelled: { 
        className: 'bg-red-100 text-red-800 border-red-200', 
        icon: X, 
        text: 'Cancelled' 
      },
      expired: { 
        className: 'bg-gray-100 text-gray-800 border-gray-200', 
        icon: Clock, 
        text: 'Expired' 
      },
      paused: { 
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: Clock, 
        text: 'Paused' 
      }
    };

    const config = statusConfig[status.toLowerCase() as keyof typeof statusConfig] || statusConfig.expired;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="w-3 h-3 mr-1" />
        {config.text}
      </Badge>
    );
  };

  // Auto-dismiss alerts after delay
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  useEffect(() => {
    if (error && !error.includes('Failed to load')) {
      const timer = setTimeout(() => setError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Initial data fetch
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Restore tab state from navigation
  useEffect(() => {
    const savedTab = sessionStorage.getItem('subscription-return-tab');
    if (savedTab) {
      setActiveTab(savedTab);
      sessionStorage.removeItem('subscription-return-tab');
    }
  }, []);

  const usageStats = getUsageStats();

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gray-50 flex">
          <Sidebar
            isCollapsed={sidebarCollapsed}
            onToggleCollapse={toggleSidebar}
            isMobileOpen={mobileSidebarOpen}
            onCloseMobile={closeMobileSidebar}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <main className="flex-1">
              <LoadingSpinner text="Loading your subscription details..." />
            </main>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebar}
          isMobileOpen={mobileSidebarOpen}
          onCloseMobile={closeMobileSidebar}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-auto">
            <div className="min-h-screen bg-gray-50">
              <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {/* Enhanced Header */}
                <div className="mb-8">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Crown className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h1 className="text-3xl font-bold text-gray-900">Subscription Hub</h1>
                          <p className="text-gray-600">Manage your plan, billing, and account preferences</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentSubscription && getStatusBadge(currentSubscription.status)}
                      <Button variant="outline" size="sm" onClick={() => fetchSubscriptionData(false)} disabled={loading}>
                        {loading ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Refresh
                      </Button>
                    </div>
                  </div>
                  
                  {/* Subscription Progress Bar */}
                  {currentSubscription && usageStats.subscriptionDaysLeft !== undefined && (
                    <div className="mt-4 p-4 bg-white rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Subscription Period</span>
                        <span className="text-sm text-gray-600">
                          {usageStats.subscriptionDaysLeft} days remaining
                        </span>
                      </div>
                      <Progress value={usageStats.usagePercentage} className="h-2" />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{formatDate(currentSubscription.starts_at, { short: true })}</span>
                        <span>{formatDate(currentSubscription.ends_at, { short: true })}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Enhanced Alert System */}
                {error && (
                  <Alert className="mb-6 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800 flex items-start justify-between">
                      <div className="flex-1">
                        {error}
                        {retryCount > 0 && (
                          <div className="mt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => fetchSubscriptionData()}
                              className="text-red-700 border-red-300 hover:bg-red-100"
                            >
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Retry ({retryCount}/3)
                            </Button>
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                        className="h-auto p-1 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800 flex items-start justify-between">
                      <div className="flex-1 whitespace-pre-line">{success}</div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuccess(null)}
                        className="h-auto p-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Enhanced Tab Navigation */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                  <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 lg:grid-cols-4">
                    <TabsTrigger value="overview" className="flex items-center gap-2">
                      <Activity className="w-4 h-4" />
                      <span className="hidden sm:inline">Overview</span>
                    </TabsTrigger>
                    <TabsTrigger value="billing" className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      <span className="hidden sm:inline">Billing</span>
                    </TabsTrigger>
                    <TabsTrigger value="usage" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      <span className="hidden sm:inline">Usage</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Overview Tab */}
                  <TabsContent value="overview" className="space-y-6">
                    {!currentSubscription ? (
                      <Card>
                        <CardContent className="p-12">
                          <EmptyState
                            icon={Crown}
                            title="No Active Subscription"
                            description="Unlock premium features and access to all RGUKT tender data with a subscription plan tailored for your needs."
                            actionLabel="Explore Plans"
                            onAction={handleUpgradePlan}
                          />
                        </CardContent>
                      </Card>
                    ) : (
                      <>
                        {/* Current Plan Card */}
                        <Card className="border-l-4 border-l-blue-600 bg-gradient-to-r from-blue-50 to-white">
                          <CardHeader>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
                                  {currentSubscription.plan.popular ? (
                                    <Sparkles className="w-8 h-8" />
                                  ) : (
                                    <Crown className="w-8 h-8" />
                                  )}
                                </div>
                                <div>
                                  <CardTitle className="text-2xl flex items-center gap-2">
                                    {currentSubscription.plan.name}
                                    {currentSubscription.plan.popular && (
                                      <Badge className="bg-orange-100 text-orange-800">
                                        <Star className="w-3 h-3 mr-1" />
                                        Popular
                                      </Badge>
                                    )}
                                  </CardTitle>
                                  <p className="text-gray-600">{currentSubscription.plan.description || "Your current subscription plan"}</p>
                                </div>
                              </div>
                              {getStatusBadge(currentSubscription.status)}
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                              {/* Billing Information */}
                              <div className="lg:col-span-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <DollarSign className="w-4 h-4 text-green-600" />
                                      Billing Details
                                    </h4>
                                    <div className="space-y-3">
                                      <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Plan Price</span>
                                        <div className="text-right">
                                          <div className="font-semibold">
                                            {formatCurrency(
                                              currentSubscription.subscription_type === 'yearly'
                                                ? currentSubscription.plan.price_yearly
                                                : currentSubscription.plan.price_monthly
                                            )}
                                          </div>
                                          <div className="text-sm text-gray-500">
                                            per {currentSubscription.subscription_type === 'yearly' ? 'year' : 'month'}
                                          </div>
                                        </div>
                                      </div>
                                      <Separator />
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Start Date</span>
                                        <span className="font-medium">{formatDate(currentSubscription.starts_at)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">End Date</span>
                                        <span className="font-medium">{formatDate(currentSubscription.ends_at)}</span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600">Time Remaining</span>
                                        <span className="font-medium text-blue-600">
                                          {formatDate(currentSubscription.ends_at, { relative: true })}
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="space-y-4">
                                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                      <Zap className="w-4 h-4 text-yellow-600" />
                                      Plan Features
                                    </h4>
                                    <div className="space-y-2">
                                      {currentSubscription.plan.features.slice(0, 4).map((feature, index) => (
                                        <div key={index} className="flex items-center gap-2">
                                          <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                          <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                      ))}
                                      {currentSubscription.plan.features.length > 4 && (
                                        <div className="text-sm text-blue-600 font-medium">
                                          +{currentSubscription.plan.features.length - 4} more features
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Quick Actions */}
                              <div className="space-y-4">
                                <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                  <Settings className="w-4 h-4 text-gray-600" />
                                  Quick Actions
                                </h4>
                                <div className="space-y-2">
                                  <Button
                                    className="w-full justify-start bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                                    onClick={handleUpgradePlan}
                                  >
                                    <TrendingUp className="w-4 h-4 mr-2" />
                                    Change Plan
                                  </Button>
                                  <Button
                                    className="w-full justify-start"
                                    variant="outline"
                                    onClick={() => paymentHistory.length > 0 && handleDownloadInvoice(paymentHistory[0].id, paymentHistory[0].plan_name)}
                                    disabled={paymentHistory.length === 0 || processingAction === `invoice-${paymentHistory[0]?.id}`}
                                  >
                                    {processingAction === `invoice-${paymentHistory[0]?.id}` ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4 mr-2" />
                                    )}
                                    Download Invoice
                                  </Button>
                                  {!currentSubscription.cancelled_at && (
                                    <Button
                                      className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                                      variant="ghost"
                                      onClick={handleCancelSubscription}
                                      disabled={processingAction === 'cancel'}
                                    >
                                      {processingAction === 'cancel' ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      ) : (
                                        <X className="w-4 h-4 mr-2" />
                                      )}
                                      Cancel Subscription
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Status Alert */}
                        {currentSubscription.cancelled_at && (
                          <Alert className="border-orange-200 bg-orange-50">
                            <AlertCircle className="h-4 w-4 text-orange-600" />
                            <AlertDescription className="text-orange-800">
                              <strong>Subscription Cancelled:</strong> Your access will continue until {formatDate(currentSubscription.ends_at)}. 
                              You can reactivate your subscription anytime before this date.
                            </AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </TabsContent>

                  {/* Usage Tab */}
                  <TabsContent value="usage" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card className="border-l-4 border-l-blue-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Tenders Viewed</p>
                              <p className="text-3xl font-bold text-gray-900">{usageStats.tendersViewed.toLocaleString()}</p>
                              <p className="text-sm text-gray-500">This month</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-xl">
                              <TrendingUp className="w-6 h-6 text-blue-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-green-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Downloads</p>
                              <p className="text-3xl font-bold text-gray-900">{usageStats.downloadsUsed}</p>
                              <p className="text-sm text-gray-500">This month</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-xl">
                              <Download className="w-6 h-6 text-green-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-orange-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Email Alerts</p>
                              <p className="text-3xl font-bold text-gray-900">{usageStats.alertsSent}</p>
                              <p className="text-sm text-gray-500">This month</p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-xl">
                              <Bell className="w-6 h-6 text-orange-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-l-4 border-l-purple-500">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium text-gray-600">Last Activity</p>
                              <p className="text-lg font-bold text-gray-900">{usageStats.lastActivity.split(' ')[0]}</p>
                              <p className="text-sm text-gray-500">{usageStats.lastActivity.split(' ').slice(1).join(' ')}</p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-xl">
                              <Clock className="w-6 h-6 text-purple-600" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Usage Insights */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Activity className="w-5 h-5 text-blue-600" />
                          Usage Insights
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {currentSubscription ? (
                          <div className="space-y-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                              <div className="flex items-center gap-3 mb-2">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                                <h4 className="font-semibold text-gray-900">Subscription Active</h4>
                              </div>
                              <p className="text-sm text-gray-700">
                                You have {usageStats.subscriptionDaysLeft} days remaining in your current billing period. 
                                Make the most of your premium features!
                              </p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-2">
                                <TrendingUp className="w-4 h-4 text-blue-500" />
                                <span>Average {Math.round(usageStats.tendersViewed / 30)} tenders viewed per day</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Download className="w-4 h-4 text-green-500" />
                                <span>{usageStats.downloadsUsed} documents downloaded</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Bell className="w-4 h-4 text-orange-500" />
                                <span>{usageStats.alertsSent} notifications sent</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-purple-500" />
                                <span>Last active: {usageStats.lastActivity}</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <EmptyState
                            icon={TrendingUp}
                            title="No Usage Data"
                            description="Subscribe to start tracking your usage statistics and insights."
                            actionLabel="Choose a Plan"
                            onAction={handleUpgradePlan}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Billing Tab */}
                  <TabsContent value="billing" className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <CreditCard className="w-5 h-5 text-green-600" />
                          Payment History
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {paymentHistory.length > 0 ? (
                          <div className="space-y-4">
                            {paymentHistory.map((payment) => (
                              <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                <div className="flex items-center gap-4">
                                  <div className="p-2 bg-white rounded-lg shadow-sm">
                                    <CreditCard className="w-5 h-5 text-green-600" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{formatCurrency(payment.amount)}</p>
                                    <p className="text-sm text-gray-600">{payment.plan_name}</p>
                                    <p className="text-xs text-gray-500">
                                      {formatDate(payment.created_at)} • {payment.payment_method || 'Credit Card'}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Badge className={
                                    payment.status === 'captured' 
                                      ? 'bg-green-100 text-green-800' 
                                      : payment.status === 'failed'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }>
                                    {payment.status === 'captured' ? 'Paid' : payment.status}
                                  </Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDownloadInvoice(payment.id, payment.plan_name)}
                                    disabled={processingAction === `invoice-${payment.id}`}
                                    className="hover:bg-white"
                                  >
                                    {processingAction === `invoice-${payment.id}` ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Download className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <EmptyState
                            icon={CreditCard}
                            title="No Payment History"
                            description="Your payment history will appear here once you make your first subscription payment."
                            actionLabel="Subscribe Now"
                            onAction={handleUpgradePlan}
                          />
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Account Information */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <User className="w-5 h-5 text-blue-600" />
                            Account Information
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <Mail className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Email Address</p>
                                <p className="text-sm text-gray-600">{user?.email}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                              <User className="w-4 h-4 text-gray-600" />
                              <div>
                                <p className="text-sm font-medium text-gray-900">Account Type</p>
                                <p className="text-sm text-gray-600">{currentSubscription ? 'Premium User' : 'Free User'}</p>
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" className="w-full" onClick={() => router.push('/profile')}>
                            <Settings className="w-4 h-4 mr-2" />
                            Edit Profile
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Subscription Management */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Crown className="w-5 h-5 text-purple-600" />
                            Subscription Management
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {currentSubscription ? (
                            <div className="space-y-4">
                              <div className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-3 mb-2">
                                  <Shield className="w-5 h-5 text-purple-600" />
                                  <h4 className="font-semibold text-purple-900">Premium Active</h4>
                                </div>
                                <p className="text-sm text-purple-800">
                                  {currentSubscription.cancelled_at
                                    ? `Access until ${formatDate(currentSubscription.ends_at, { relative: true })}`
                                    : `Your ${currentSubscription.plan.name} subscription is active`
                                  }
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Button
                                  className="w-full"
                                  variant="outline"
                                  onClick={handleUpgradePlan}
                                >
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Change Plan
                                </Button>
                                {!currentSubscription.cancelled_at && (
                                  <Button
                                    className="w-full text-red-600 hover:text-red-700"
                                    variant="outline"
                                    onClick={handleCancelSubscription}
                                    disabled={processingAction === 'cancel'}
                                  >
                                    {processingAction === 'cancel' ? (
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                      <X className="w-4 h-4 mr-2" />
                                    )}
                                    Cancel Subscription
                                  </Button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3 mb-2">
                                  <Gift className="w-5 h-5 text-gray-600" />
                                  <h4 className="font-semibold text-gray-900">Free Account</h4>
                                </div>
                                <p className="text-sm text-gray-700">
                                  Upgrade to premium to unlock all features and get unlimited access to tender data.
                                </p>
                              </div>
                              <Button
                                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                onClick={handleUpgradePlan}
                              >
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade to Premium
                              </Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}