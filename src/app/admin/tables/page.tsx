"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Database,
  Users,
  CreditCard,
  FileText,
  Activity,
  Shield,
  Settings,
  Eye,
  Download,
  Loader2,
  RefreshCw
} from 'lucide-react';

interface TableInfo {
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  rowCount?: number;
  lastUpdated?: string;
}

const TABLES: TableInfo[] = [
  // User Management
  {
    name: 'user_profiles',
    description: 'User account information and preferences',
    category: 'User Management',
    icon: <Users className="h-5 w-5" />
  },
  {
    name: 'user_sessions',
    description: 'Active user sessions for JWT token management',
    category: 'User Management',
    icon: <Shield className="h-5 w-5" />
  },
  {
    name: 'user_usage',
    description: 'Daily usage statistics per user',
    category: 'User Management',
    icon: <Activity className="h-5 w-5" />
  },
  {
    name: 'user_tender_access',
    description: 'Tracking of user access to tenders',
    category: 'User Management',
    icon: <Eye className="h-5 w-5" />
  },

  // Subscription & Payment
  {
    name: 'subscription_plans',
    description: 'Available subscription plans and pricing',
    category: 'Subscription & Payment',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    name: 'user_subscriptions',
    description: 'User subscription records and status',
    category: 'Subscription & Payment',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    name: 'payment_orders',
    description: 'Payment order tracking with Razorpay integration',
    category: 'Subscription & Payment',
    icon: <CreditCard className="h-5 w-5" />
  },
  {
    name: 'payment_history',
    description: 'Audit trail for all payment events',
    category: 'Subscription & Payment',
    icon: <FileText className="h-5 w-5" />
  },

  // Admin Management
  {
    name: 'admin_roles',
    description: 'Admin users and their permissions',
    category: 'Admin Management',
    icon: <Shield className="h-5 w-5" />
  },
  {
    name: 'admin_activity_logs',
    description: 'Admin action tracking',
    category: 'Admin Management',
    icon: <Activity className="h-5 w-5" />
  },
  {
    name: 'system_settings',
    description: 'System configuration settings',
    category: 'Admin Management',
    icon: <Settings className="h-5 w-5" />
  },

  // Content & Monitoring
  {
    name: 'tenders',
    description: 'Tender notices and related information',
    category: 'Content & Monitoring',
    icon: <FileText className="h-5 w-5" />
  },
  {
    name: 'email_subscriptions',
    description: 'Email subscriptions for campus-specific notifications',
    category: 'Content & Monitoring',
    icon: <Users className="h-5 w-5" />
  },
  {
    name: 'application_logs',
    description: 'Application-wide logging',
    category: 'Content & Monitoring',
    icon: <Activity className="h-5 w-5" />
  },
  {
    name: 'metrics',
    description: 'System and business metrics',
    category: 'Content & Monitoring',
    icon: <Activity className="h-5 w-5" />
  },
  {
    name: 'cron_logs',
    description: 'Cron job execution logs',
    category: 'Content & Monitoring',
    icon: <Activity className="h-5 w-5" />
  },
  {
    name: 'security_events',
    description: 'Security-related events and incidents',
    category: 'Content & Monitoring',
    icon: <Shield className="h-5 w-5" />
  },
  {
    name: 'rate_limits',
    description: 'Rate limiting tracking per user/endpoint',
    category: 'Content & Monitoring',
    icon: <Shield className="h-5 w-5" />
  }
];

export default function AdminTablesPage() {
  const [tables, setTables] = useState<TableInfo[]>(TABLES);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', ...Array.from(new Set(TABLES.map(t => t.category)))];

  const fetchTableStats = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/tables/stats');
      if (response.ok) {
        const data = await response.json();
        setTables(prev => prev.map(table => ({
          ...table,
          rowCount: data.stats?.[table.name]?.count || 0,
          lastUpdated: data.stats?.[table.name]?.lastUpdated
        })));
      }
    } catch (error) {
      console.error('Error fetching table stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTableStats();
  }, []);

  const filteredTables = selectedCategory === 'all'
    ? tables
    : tables.filter(table => table.category === selectedCategory);

  const getCategoryColor = (category: string) => {
    const colors = {
      'User Management': 'bg-blue-100 text-blue-800',
      'Subscription & Payment': 'bg-green-100 text-green-800',
      'Admin Management': 'bg-purple-100 text-purple-800',
      'Content & Monitoring': 'bg-orange-100 text-orange-800'
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const handleViewTable = (tableName: string) => {
    window.open(`/admin/tables/${tableName}`, '_blank');
  };

  const handleExportTable = async (tableName: string) => {
    try {
      const response = await fetch(`/api/admin/tables/${tableName}/export`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tableName}_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting table:', error);
    }
  };

  return (
    <AdminLayout title="Database Tables">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Database Tables</h1>
            <p className="text-gray-600 mt-1">Manage and view all Supabase tables</p>
          </div>
          <Button onClick={fetchTableStats} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh Stats
          </Button>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              size="sm"
            >
              {category === 'all' ? 'All Tables' : category}
            </Button>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTables.map((table) => (
            <Card key={table.name} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    {table.icon}
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                  </div>
                  <Badge className={getCategoryColor(table.category)} variant="secondary">
                    {table.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">{table.description}</p>

                {/* Stats */}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Rows:</span>
                  <span className="font-medium">
                    {loading ? '...' : (table.rowCount?.toLocaleString() || '0')}
                  </span>
                </div>

                {table.lastUpdated && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Last Updated:</span>
                    <span className="font-medium">
                      {new Date(table.lastUpdated).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewTable(table.name)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleExportTable(table.name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTables.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No tables found in this category.</p>
            </CardContent>
          </Card>
        )}

        {/* Summary Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Database Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{tables.length}</div>
                <div className="text-sm text-gray-600">Total Tables</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {tables.reduce((sum, table) => sum + (table.rowCount || 0), 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Total Rows</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{categories.length - 1}</div>
                <div className="text-sm text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {tables.filter(t => (t.rowCount || 0) > 0).length}
                </div>
                <div className="text-sm text-gray-600">Active Tables</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}