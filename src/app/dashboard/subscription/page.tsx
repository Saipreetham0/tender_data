// src/app/dashboard/subscription/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthComponents";
import Sidebar from "@/components/Dashboard/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Calendar, 
  CheckCircle, 
  Crown, 
  Download,
  Settings,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  Loader2,
  ExternalLink,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

interface SubscriptionData {
  id: string;
  plan: {
    name: string;
    price_yearly: number;
    price_monthly: number;
    features: string[];
  };
  status: string;
  subscription_type: string;
  starts_at: string;
  ends_at: string;
  cancelled_at?: string;
  // Legacy field mappings for compatibility
  current_period_start?: string;
  current_period_end?: string;
  next_billing_at?: string;
}

interface PaymentHistory {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  plan_name: string;
}

export default function DashboardSubscriptionPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<SubscriptionData | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  const { user } = useAuth();
  const router = useRouter();

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  // Fetch subscription data
  const fetchSubscriptionData = async () => {
    if (!user?.email) return;
    
    try {
      setLoading(true);
      setError(null);

      // Fetch current subscription
      const subResponse = await fetch(`/api/subscription/current?email=${user.email}`);
      const subData = await subResponse.json();
      
      if (subData.success) {
        setCurrentSubscription(subData.subscription);
      }

      // Fetch payment history
      const historyResponse = await fetch(`/api/subscription/history?email=${user.email}`);
      const historyData = await historyResponse.json();
      
      if (historyData.success) {
        setPaymentHistory(historyData.payments || []);
      }
    } catch (err) {
      console.error('Error fetching subscription data:', err);
      setError('Failed to load subscription data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;

    const confirmed = window.confirm(
      `Are you sure you want to cancel your subscription? You will continue to have access until ${formatDate(currentSubscription.ends_at)}.`
    );

    if (!confirmed) return;

    try {
      setProcessingAction('cancel');
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: currentSubscription.id,
          userEmail: user?.email,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(`Subscription cancelled successfully. You will continue to have access until ${formatDate(currentSubscription.ends_at)}.`);
        fetchSubscriptionData(); // Refresh data
      } else {
        throw new Error(data.error || 'Failed to cancel subscription');
      }
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
    } finally {
      setProcessingAction(null);
    }
  };

  // Handle upgrading to new plan
  const handleUpgradePlan = () => {
    router.push('/subscription?tab=plans');
  };

  // Download invoice
  const handleDownloadInvoice = async (paymentId: string) => {
    try {
      setProcessingAction(`invoice-${paymentId}`);
      const response = await fetch(`/api/subscription/invoice/${paymentId}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `invoice-${paymentId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Failed to download invoice');
      }
    } catch (err) {
      console.error('Error downloading invoice:', err);
      setError('Failed to download invoice. Please try again.');
    } finally {
      setProcessingAction(null);
    }
  };

  // Get usage stats (mock for now - replace with real API)
  const getUsageStats = () => {
    const now = new Date();
    const thisMonth = now.getMonth();
    
    // In a real implementation, fetch this from your API
    return {
      tendersViewed: paymentHistory.length > 0 ? 156 : 0,
      downloadsUsed: paymentHistory.length > 0 ? 42 : 0,
      alertsSent: paymentHistory.length > 0 ? 28 : 0,
      lastActivity: currentSubscription ? "2 hours ago" : "Never"
    };
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  // Format date with better error handling
  const formatDate = (dateString: string | Date) => {
    if (!dateString) {
      return 'Not specified';
    }
    
    try {
      // Handle different date formats
      let date: Date;
      
      // If it's already a Date object
      if (dateString instanceof Date) {
        date = dateString;
      } 
      // If it's a string, try to parse it
      else if (typeof dateString === 'string') {
        // Handle ISO strings and other formats
        date = new Date(dateString);
        
        // If that fails, try manual parsing for common formats
        if (isNaN(date.getTime())) {
          // Try DD/MM/YYYY format
          const parts = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
          if (parts) {
            const [, day, month, year] = parts;
            date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          } else {
            console.error('Unable to parse date string:', dateString);
            return 'Invalid Date';
          }
        }
      } else {
        console.error('Unexpected date type:', typeof dateString, dateString);
        return 'Invalid Date';
      }
      
      // Validate the final date
      if (isNaN(date.getTime())) {
        console.error('Invalid date after parsing:', dateString);
        return 'Invalid Date';
      }
      
      // Format for Indian locale
      return date.toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error for:', dateString, error);
      return 'Invalid Date';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [user?.email]);

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
            <main className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading subscription data...</p>
              </div>
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
                {/* Professional Header */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900">Subscription Management</h1>
                      <p className="text-gray-600 mt-2">Manage your plan, billing, and account preferences</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {currentSubscription && (
                        <Badge className={getStatusColor(currentSubscription.status)}>
                          <Crown className="w-3 h-3 mr-1" />
                          {currentSubscription.status === 'active' ? 'Premium Active' : currentSubscription.status.toUpperCase()}
                        </Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={fetchSubscriptionData}>
                        <Settings className="w-4 h-4 mr-2" />
                        Refresh
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Alerts */}
                {error && (
                  <Alert className="mb-6 border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {error}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setError(null)}
                        className="ml-2 h-auto p-1 text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-6 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      {success}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSuccess(null)}
                        className="ml-2 h-auto p-1 text-green-600 hover:text-green-800"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* No Subscription State */}
                {!currentSubscription && !loading && (
                  <Card className="mb-8 text-center">
                    <CardContent className="p-12">
                      <Crown className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">No Active Subscription</h3>
                      <p className="text-gray-600 mb-6">
                        You don't have an active subscription. Subscribe to access all RGUKT tender data.
                      </p>
                      <Button onClick={handleUpgradePlan} className="bg-blue-600 hover:bg-blue-700">
                        <Crown className="w-4 h-4 mr-2" />
                        Choose a Plan
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Current Plan Overview */}
                {currentSubscription && (
                  <Card className="mb-8 border-l-4 border-l-blue-600">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Crown className="w-6 h-6 text-blue-600" />
                          </div>
                          <div>
                            <CardTitle className="text-xl">{currentSubscription.plan.name}</CardTitle>
                            <p className="text-gray-600">Your current subscription plan</p>
                          </div>
                        </div>
                        <Badge className={getStatusColor(currentSubscription.status)}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          {currentSubscription.status.toUpperCase()}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Plan Details */}
                        <div className="lg:col-span-2">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Billing Information</h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Plan Price</span>
                                  <span className="font-medium">
                                    {formatCurrency(
                                      currentSubscription.subscription_type === 'yearly'
                                        ? currentSubscription.plan.price_yearly
                                        : currentSubscription.plan.price_monthly
                                    )}/{currentSubscription.subscription_type}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Subscription Period</span>
                                  <span className="font-medium">
                                    {formatDate(currentSubscription.starts_at)} - {formatDate(currentSubscription.ends_at)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Expires On</span>
                                  <span className="font-medium">
                                    {formatDate(currentSubscription.ends_at)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Renewal</span>
                                  <span className="font-medium text-blue-600">
                                    {currentSubscription.cancelled_at ? 'Cancelled' : 'One-time payment'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Plan Features</h4>
                              <div className="space-y-2">
                                {currentSubscription.plan.features.slice(0, 3).map((feature, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-gray-700">{feature}</span>
                                  </div>
                                ))}
                                {currentSubscription.plan.features.length > 3 && (
                                  <div className="text-sm text-gray-500">+{currentSubscription.plan.features.length - 3} more features</div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                          <div className="space-y-2">
                            <Button 
                              className="w-full justify-start" 
                              variant="outline"
                              onClick={handleUpgradePlan}
                            >
                              <TrendingUp className="w-4 h-4 mr-2" />
                              Upgrade Plan
                            </Button>
                            <Button 
                              className="w-full justify-start" 
                              variant="outline"
                              onClick={() => paymentHistory.length > 0 && handleDownloadInvoice(paymentHistory[0].id)}
                              disabled={paymentHistory.length === 0 || processingAction === `invoice-${paymentHistory[0]?.id}`}
                            >
                              {processingAction === `invoice-${paymentHistory[0]?.id}` ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Download className="w-4 h-4 mr-2" />
                              )}
                              Download Latest Invoice
                            </Button>
                            <Button 
                              className="w-full justify-start text-red-600 hover:text-red-700" 
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
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Usage Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Tenders Viewed</p>
                          <p className="text-2xl font-bold text-gray-900">{usageStats.tendersViewed}</p>
                          <p className="text-sm text-gray-500">This month</p>
                        </div>
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <TrendingUp className="w-6 h-6 text-blue-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Downloads</p>
                          <p className="text-2xl font-bold text-gray-900">{usageStats.downloadsUsed}</p>
                          <p className="text-sm text-gray-500">This month</p>
                        </div>
                        <div className="p-3 bg-green-100 rounded-lg">
                          <Download className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Email Alerts</p>
                          <p className="text-2xl font-bold text-gray-900">{usageStats.alertsSent}</p>
                          <p className="text-sm text-gray-500">This month</p>
                        </div>
                        <div className="p-3 bg-orange-100 rounded-lg">
                          <AlertCircle className="w-6 h-6 text-orange-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Last Activity</p>
                          <p className="text-2xl font-bold text-gray-900">{usageStats.lastActivity.split(' ')[0]}</p>
                          <p className="text-sm text-gray-500">{usageStats.lastActivity.split(' ').slice(1).join(' ')}</p>
                        </div>
                        <div className="p-3 bg-purple-100 rounded-lg">
                          <Clock className="w-6 h-6 text-purple-600" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment History & Additional Options */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Payment History */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        Payment History
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {paymentHistory.length > 0 ? (
                        <div className="space-y-3">
                          {paymentHistory.slice(0, 3).map((payment) => (
                            <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <p className="font-medium text-gray-900">{formatCurrency(payment.amount)}</p>
                                <p className="text-sm text-gray-600">{payment.plan_name}</p>
                                <p className="text-xs text-gray-500">{formatDate(payment.created_at)}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge className={payment.status === 'captured' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                                  {payment.status}
                                </Badge>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(payment.id)}
                                  disabled={processingAction === `invoice-${payment.id}`}
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
                          {paymentHistory.length > 3 && (
                            <p className="text-sm text-gray-500 text-center">
                              +{paymentHistory.length - 3} more payments
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          <p className="text-gray-500">No payment history yet</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Plan Management */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Crown className="w-5 h-5 text-blue-600" />
                        Plan Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {currentSubscription ? (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center gap-3 mb-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h4 className="font-semibold text-blue-900">Active Subscription</h4>
                          </div>
                          <p className="text-sm text-blue-800">
                            {currentSubscription.cancelled_at
                              ? `Subscription cancelled. Access until ${formatDate(currentSubscription.ends_at)}.`
                              : `Your ${currentSubscription.plan.name} subscription is active until ${formatDate(currentSubscription.ends_at)}.`
                            }
                          </p>
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            <AlertCircle className="w-5 h-5 text-gray-600" />
                            <h4 className="font-semibold text-gray-900">No Active Subscription</h4>
                          </div>
                          <p className="text-sm text-gray-700">
                            Subscribe to access all RGUKT tender data and features.
                          </p>
                        </div>
                      )}
                      
                      <div className="space-y-3">
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={handleUpgradePlan}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          {currentSubscription ? 'Change Plan' : 'Choose Plan'}
                        </Button>
                        {currentSubscription && !currentSubscription.cancelled_at && (
                          <Button 
                            className="w-full text-red-600 hover:text-red-700" 
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
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}