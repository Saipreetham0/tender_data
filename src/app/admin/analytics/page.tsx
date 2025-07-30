"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  DollarSign,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Loader2,
  Eye,
  UserPlus,
  ShoppingCart
} from 'lucide-react';

interface AnalyticsData {
  overview: {
    totalUsers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    conversionRate: number;
    userGrowth: number;
    revenueGrowth: number;
    churnRate: number;
    avgRevenuePerUser: number;
  };
  userMetrics: {
    newUsersThisWeek: number;
    activeUsersToday: number;
    totalSessions: number;
    avgSessionDuration: number;
    usersByPlan: { plan: string; count: number; }[];
    userGrowthChart: { date: string; users: number; }[];
  };
  revenueMetrics: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageOrderValue: number;
    revenueByMonth: { month: string; revenue: number; }[];
    topPayingCustomers: { email: string; totalSpent: number; }[];
  };
  tenderMetrics: {
    totalTenders: number;
    tendersThisWeek: number;
    campusBreakdown: { campus: string; count: number; }[];
    tenderViews: number;
    searchQueries: number;
  };
}

const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalUsers: 1247,
    activeSubscriptions: 892,
    monthlyRevenue: 1543750,
    conversionRate: 12.5,
    userGrowth: 15.3,
    revenueGrowth: 23.7,
    churnRate: 3.2,
    avgRevenuePerUser: 1731
  },
  userMetrics: {
    newUsersThisWeek: 23,
    activeUsersToday: 145,
    totalSessions: 3421,
    avgSessionDuration: 8.5,
    usersByPlan: [
      { plan: 'All Access', count: 892 },
      { plan: 'Free Trial', count: 355 }
    ],
    userGrowthChart: [
      { date: '2024-01-01', users: 1000 },
      { date: '2024-01-02', users: 1015 },
      { date: '2024-01-03', users: 1032 },
      { date: '2024-01-04', users: 1048 },
      { date: '2024-01-05', users: 1067 },
      { date: '2024-01-06', users: 1089 },
      { date: '2024-01-07', users: 1112 }
    ]
  },
  revenueMetrics: {
    totalRevenue: 1543750,
    monthlyRecurringRevenue: 1336850,
    averageOrderValue: 1499,
    revenueByMonth: [
      { month: 'Aug', revenue: 890000 },
      { month: 'Sep', revenue: 1120000 },
      { month: 'Oct', revenue: 1285000 },
      { month: 'Nov', revenue: 1401000 },
      { month: 'Dec', revenue: 1543750 }
    ],
    topPayingCustomers: [
      { email: 'enterprise@company.com', totalSpent: 14990 },
      { email: 'bulk@organization.com', totalSpent: 11992 },
      { email: 'premium@business.com', totalSpent: 8995 },
      { email: 'corporate@firm.com', totalSpent: 7496 },
      { email: 'team@startup.com', totalSpent: 5997 }
    ]
  },
  tenderMetrics: {
    totalTenders: 2847,
    tendersThisWeek: 47,
    campusBreakdown: [
      { campus: 'RGUKT Main', count: 892 },
      { campus: 'Basar', count: 654 },
      { campus: 'Ongole', count: 523 },
      { campus: 'RK Valley', count: 467 },
      { campus: 'Srikakulam', count: 311 }
    ],
    tenderViews: 15420,
    searchQueries: 8934
  }
};

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAnalyticsData(mockAnalyticsData);
      } catch (error) {
        console.error('Failed to fetch analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  const getGrowthColor = (growth: number) => {
    return growth >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (growth: number) => {
    return growth >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  const exportReport = () => {
    console.log('Exporting analytics report...');
  };

  if (loading) {
    return (
      <AdminLayout title="Analytics & Monitoring" requiredPermission="view_analytics">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading analytics...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics & Monitoring" requiredPermission="view_analytics">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h2>
            <p className="text-sm text-gray-600">
              Monitor business metrics, user behavior, and system performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.overview.totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getGrowthIcon(analyticsData?.overview.userGrowth || 0)}
                <span className={`ml-1 ${getGrowthColor(analyticsData?.overview.userGrowth || 0)}`}>
                  {analyticsData?.overview.userGrowth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analyticsData?.overview.monthlyRevenue.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                {getGrowthIcon(analyticsData?.overview.revenueGrowth || 0)}
                <span className={`ml-1 ${getGrowthColor(analyticsData?.overview.revenueGrowth || 0)}`}>
                  {analyticsData?.overview.revenueGrowth}% from last month
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analyticsData?.overview.activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData ? Math.round((analyticsData.overview.activeSubscriptions / analyticsData.overview.totalUsers) * 100) : 0}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Revenue/User</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{analyticsData?.overview.avgRevenuePerUser.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {analyticsData?.overview.churnRate}% churn rate
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analytics Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">User Analytics</TabsTrigger>
            <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
            <TabsTrigger value="tenders">Tender Analytics</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <UserPlus className="h-5 w-5" />
                    <span>User Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Users This Week</span>
                    <span className="font-bold">{analyticsData?.userMetrics.newUsersThisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Active Users Today</span>
                    <span className="font-bold">{analyticsData?.userMetrics.activeUsersToday}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Sessions</span>
                    <span className="font-bold">{analyticsData?.userMetrics.totalSessions.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Session Duration</span>
                    <span className="font-bold">{analyticsData?.userMetrics.avgSessionDuration} min</span>
                  </div>
                </CardContent>
              </Card>

              {/* Users by Plan */}
              <Card>
                <CardHeader>
                  <CardTitle>Users by Plan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.userMetrics.usersByPlan.map((plan) => {
                      const percentage = analyticsData ? (plan.count / analyticsData.overview.totalUsers) * 100 : 0;
                      return (
                        <div key={plan.plan} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{plan.plan}</Badge>
                          </div>
                          <div className="text-right">
                            <p className="font-bold">{plan.count.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="revenue" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Revenue Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Revenue Breakdown</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Revenue</span>
                    <span className="font-bold">₹{analyticsData?.revenueMetrics.totalRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Monthly Recurring Revenue</span>
                    <span className="font-bold">₹{analyticsData?.revenueMetrics.monthlyRecurringRevenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Average Order Value</span>
                    <span className="font-bold">₹{analyticsData?.revenueMetrics.averageOrderValue.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Top Paying Customers */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Paying Customers</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.revenueMetrics.topPayingCustomers.map((customer, index) => (
                      <div key={customer.email} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          <span className="text-sm">{customer.email}</span>
                        </div>
                        <span className="font-bold">₹{customer.totalSpent.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenders" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tender Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Tender Statistics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Tenders</span>
                    <span className="font-bold">{analyticsData?.tenderMetrics.totalTenders.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">New Tenders This Week</span>
                    <span className="font-bold">{analyticsData?.tenderMetrics.tendersThisWeek}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Tender Views</span>
                    <span className="font-bold">{analyticsData?.tenderMetrics.tenderViews.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Search Queries</span>
                    <span className="font-bold">{analyticsData?.tenderMetrics.searchQueries.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Campus Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Tenders by Campus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analyticsData?.tenderMetrics.campusBreakdown.map((campus) => {
                      const percentage = analyticsData ? (campus.count / analyticsData.tenderMetrics.totalTenders) * 100 : 0;
                      return (
                        <div key={campus.campus} className="flex items-center justify-between">
                          <span className="text-sm">{campus.campus}</span>
                          <div className="text-right">
                            <p className="font-bold">{campus.count.toLocaleString()}</p>
                            <p className="text-xs text-gray-500">{percentage.toFixed(1)}%</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5 text-green-600" />
                    <span>System Health</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">API Uptime</span>
                      <Badge className="bg-green-100 text-green-800">99.9%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Avg Response Time</span>
                      <span className="font-mono">245ms</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Error Rate</span>
                      <span className="text-red-600">0.1%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Query Performance</span>
                      <Badge className="bg-green-100 text-green-800">Good</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Connection Pool</span>
                      <span className="font-mono">23/50</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Cache Hit Rate</span>
                      <span className="text-green-600">94.2%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Server Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">CPU Usage</span>
                      <span className="font-mono">34%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Usage</span>
                      <span className="font-mono">67%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Disk Usage</span>
                      <span className="font-mono">45%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}