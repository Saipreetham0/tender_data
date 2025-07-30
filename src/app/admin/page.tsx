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
  RefreshCw
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  pendingPayments: number;
  apiCalls: number;
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

const mockStats: DashboardStats = {
  totalUsers: 1247,
  activeSubscriptions: 892,
  totalRevenue: 1543750,
  pendingPayments: 23,
  apiCalls: 45821,
  systemHealth: 'healthy',
  recentActivity: [
    {
      id: '1',
      type: 'user_signup',
      message: 'New user registered: john@example.com',
      timestamp: '2024-01-15T10:30:00Z',
      status: 'success'
    },
    {
      id: '2',
      type: 'payment',
      message: 'Payment successful: ₹1,499 from user@domain.com',
      timestamp: '2024-01-15T10:25:00Z',
      status: 'success'
    },
    {
      id: '3',
      type: 'system',
      message: 'Cron job completed successfully',
      timestamp: '2024-01-15T10:00:00Z',
      status: 'success'
    },
    {
      id: '4',
      type: 'payment',
      message: 'Payment failed: Insufficient funds',
      timestamp: '2024-01-15T09:45:00Z',
      status: 'error'
    }
  ]
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardStats = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    
    try {
      // In a real app, this would fetch from your API
      // const response = await fetch('/api/admin/dashboard-stats');
      // const data = await response.json();
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setStats(mockStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
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
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Overview</h2>
            <p className="text-sm text-gray-600">
              Monitor your platform's performance and activity
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

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalUsers.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.activeSubscriptions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{stats?.totalRevenue.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +15% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">API Calls</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.apiCalls.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +23% from last month
              </p>
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
                <span className="text-sm">Cron Jobs</span>
                <Badge variant="default" className="bg-green-100 text-green-800">Running</Badge>
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
                {stats?.recentActivity.map((activity) => (
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
                ))}
              </div>
              <div className="mt-4">
                <Button variant="outline" className="w-full">
                  View All Activity
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Users className="h-6 w-6 mb-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <CreditCard className="h-6 w-6 mb-2" />
                Process Payments
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Database className="h-6 w-6 mb-2" />
                System Maintenance
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}