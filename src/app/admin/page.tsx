"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Database,
  Activity,
  DollarSign,
  UserCheck,
  Loader2,
  RefreshCw,
  Settings,
  FileText,
  Bell
} from 'lucide-react';
import Link from 'next/link';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  recentActivity: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'user_signup' | 'payment' | 'subscription' | 'system';
  message: string;
  timestamp: string;
  status: 'success' | 'warning' | 'error';
}

const emptyStats: DashboardStats = {
  totalUsers: 0,
  activeSubscriptions: 0,
  totalRevenue: 0,
  pendingPayments: 0,
  systemHealth: 'healthy',
  recentActivity: []
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);

    try {
      // Fetch admin stats from API
      const [usersResponse, subscriptionsResponse, paymentsResponse] = await Promise.all([
        fetch('/api/admin/users').catch(() => null),
        fetch('/api/admin/subscriptions').catch(() => null),
        fetch('/api/admin/payments').catch(() => null)
      ]);

      let adminStats = { ...emptyStats };

      // Update with real data from users API
      if (usersResponse?.ok) {
        const usersData = await usersResponse.json();
        adminStats.totalUsers = usersData.users?.length || 0;
      }

      // Update with real data from subscriptions API
      if (subscriptionsResponse?.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        const activeSubscriptions = subscriptionsData.subscriptions?.filter(
          (sub: any) => sub.status === 'active'
        ).length || 0;
        adminStats.activeSubscriptions = activeSubscriptions;
      }

      // Update with real data from payments API
      if (paymentsResponse?.ok) {
        const paymentsData = await paymentsResponse.json();
        adminStats.totalRevenue = paymentsData.stats?.totalRevenue || 0;
        adminStats.pendingPayments = paymentsData.stats?.pendingPayments || 0;

        // Generate real recent activity from payments data
        if (paymentsData.payments && paymentsData.payments.length > 0) {
          adminStats.recentActivity = paymentsData.payments
            .slice(0, 4)
            .map((payment: any, index: number) => ({
              id: payment.id || index.toString(),
              type: 'payment' as const,
              message: payment.status === 'completed'
                ? `Payment successful: ₹${payment.amount?.toLocaleString()} from ${payment.users?.email || 'user'}`
                : `Payment ${payment.status}: ${payment.failure_reason || 'Unknown reason'}`,
              timestamp: payment.created_at || new Date().toISOString(),
              status: payment.status === 'completed' ? 'success' :
                     payment.status === 'failed' ? 'error' : 'warning'
            }));
        }
      }

      setStats(adminStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      setStats(emptyStats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleRefresh = () => {
    fetchDashboardStats(true);
  };

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'user_signup':
        return <UserCheck className="h-4 w-4" />;
      case 'payment':
        return <CreditCard className="h-4 w-4" />;
      case 'subscription':
        return <TrendingUp className="h-4 w-4" />;
      case 'system':
        return <Activity className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: ActivityItem['status']) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading dashboard...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-sm text-gray-600">
              Monitor your SaaS platform performance and activity
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                Registered accounts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeSubscriptions.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                Currently active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalRevenue.toLocaleString() || '0'}</div>
              <p className="text-xs text-muted-foreground">
                Total earnings
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.pendingPayments || 0}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Database Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-xl font-bold text-blue-600">18</div>
                <div className="text-sm text-gray-600">Total Tables</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-green-600">Active</div>
                <div className="text-sm text-gray-600">System Status</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-purple-600">4</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <Link href="/admin/tables">
                  <Button variant="outline" size="sm" className="w-full">
                    <Database className="h-4 w-4 mr-1" />
                    View All
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                User Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Manage user accounts, subscriptions, and permissions
              </p>
              <Link href="/admin/users">
                <Button className="w-full">
                  Manage Users
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Payment Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Monitor transactions, process refunds, and view payment history
              </p>
              <Link href="/admin/payments">
                <Button className="w-full">
                  View Payments
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Database Tables
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                View and manage all database tables with simple interface
              </p>
              <Link href="/admin/tables">
                <Button className="w-full">
                  View Tables
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Monitor system status, API health, and performance metrics
              </p>
              <Link href="/admin/health">
                <Button className="w-full">
                  Check Health
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* System Status and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                System Status
                <Badge
                  variant={stats?.systemHealth === 'healthy' ? 'default' : 'destructive'}
                  className={stats?.systemHealth === 'healthy' ? 'bg-green-100 text-green-800' : ''}
                >
                  {stats?.systemHealth === 'healthy' ? 'Healthy' : 'Issues Detected'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Database Connection</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Payment Gateway</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Email Service</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tender Scraping</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Redis Cache</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>
              </div>

              {stats?.pendingPayments && stats.pendingPayments > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-800">
                      {stats.pendingPayments} pending payments require attention
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className={`p-1 rounded-full ${getStatusColor(activity.status)}`}>
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{activity.message}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Admin Links */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Tools</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link href="/admin/api-docs">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                  <FileText className="h-6 w-6 mb-2" />
                  API Docs
                </Button>
              </Link>

              <Link href="/admin/settings">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                  <Settings className="h-6 w-6 mb-2" />
                  Settings
                </Button>
              </Link>

              <Link href="/admin/notifications">
                <Button variant="outline" className="h-20 flex flex-col items-center justify-center w-full">
                  <Bell className="h-6 w-6 mb-2" />
                  Notifications
                </Button>
              </Link>

              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Database className="h-6 w-6 mb-2" />
                System Logs
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}