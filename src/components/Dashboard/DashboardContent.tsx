// src/components/Dashboard/DashboardContent.tsx
"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  BarChart3,
  AlertTriangle,
  Calendar,
  Clock,
  Building2,
  Download,
  RefreshCw,
  Loader2,
  Bell,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Activity
} from 'lucide-react';
import { fetchTenderData } from '@/lib/api';
import { getAllTendersFromSupabase } from '@/lib/supabase';
import { ProgressiveFeatureLoader, useConditionalRender } from '@/components/ProgressiveFeatureLoader';
import { useOptimizedAuthContext } from '@/contexts/OptimizedAuthContext';

interface DashboardStats {
  totalTenders: number;
  closingSoon: number;
  newToday: number;
  activeProjects: number;
  changePercent: {
    total: number;
    closing: number;
    new: number;
  };
}

interface RecentTender {
  name: string;
  postedDate: string;
  closingDate: string;
  source: string;
  status: 'active' | 'closing-soon' | 'expired';
}

const DashboardContent: React.FC = () => {
  const { authState, hasFeature } = useOptimizedAuthContext();
  const { renderIf } = useConditionalRender();

  const [stats, setStats] = useState<DashboardStats>({
    totalTenders: 0,
    closingSoon: 0,
    newToday: 0,
    activeProjects: 0,
    changePercent: {
      total: 0,
      closing: 0,
      new: 0
    }
  });
  const [recentTenders, setRecentTenders] = useState<RecentTender[]>([]);
  const [loading, setLoading] = useState(false); // Start with false for instant UI
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async () => {
    try {
      // setLoading(true); // Remove this to avoid showing loading state
      
      // Load dashboard data efficiently with pre-calculated stats
      // Instead of loading ALL tenders, we'll use optimized queries
      const today = new Date().toISOString().split('T')[0];
      
      // For now, use mock data for instant loading while keeping the interface
      // In production, these would be optimized database queries
      const mockStats = {
        totalTenders: 1247,
        closingSoon: 23,
        newToday: 8,
        activeProjects: 1247,
        changePercent: {
          total: 12.5,
          closing: -8.2,
          new: 24.1
        }
      };

      const mockRecentTenders = [
        {
          name: "Supply of Laboratory Equipment for Engineering College",
          postedDate: today,
          closingDate: "15-01-2025",
          source: "RGUKT Basar",
          status: 'active' as const
        },
        {
          name: "Construction of Academic Block Phase-II",
          postedDate: today,
          closingDate: "12-01-2025",
          source: "RGUKT Ongole",
          status: 'closing-soon' as const
        },
        {
          name: "Annual Maintenance Contract for IT Infrastructure",
          postedDate: "2024-12-20",
          closingDate: "18-01-2025",
          source: "RGUKT SKLM",
          status: 'active' as const
        },
        {
          name: "Supply of Library Books and Journals",
          postedDate: "2024-12-19",
          closingDate: "10-01-2025",
          source: "RGUKT RK Valley",
          status: 'closing-soon' as const
        },
        {
          name: "Catering Services for Campus Hostel",
          postedDate: "2024-12-18",
          closingDate: "20-01-2025",
          source: "RGUKT Basar",
          status: 'active' as const
        },
        {
          name: "Security Services for Campus Premises",
          postedDate: "2024-12-17",
          closingDate: "11-01-2025",
          source: "RGUKT Ongole",
          status: 'closing-soon' as const
        }
      ].filter(tender => !tender.source.includes("RGUKT Main")); // Temporarily exclude RGUKT Main

      setStats(mockStats);
      setRecentTenders(mockRecentTenders);
      
      // Optional: Load real data in background after initial render
      // This provides instant UI feedback while real data loads
      setTimeout(async () => {
        try {
          // Only load recent tenders (limited query) to avoid performance issues
          // const recentTenders = await getRecentTendersFromSupabase(10);
          // Process and update if needed
        } catch (error) {
          console.error('Background data loading error:', error);
        }
      }, 100);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const isClosingSoon = (closingDate: string): boolean => {
    try {
      const dateMatch = closingDate.match(/(\d{2})[-.\/](\d{2})[-.\/](\d{4})/);
      if (!dateMatch) return false;

      const [, day, month, year] = dateMatch;
      const closingDateTime = new Date(`${year}-${month}-${day}`);
      const now = new Date();

      const diffTime = closingDateTime.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return diffDays >= 0 && diffDays <= 3;
    } catch {
      return false;
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-800">Overview</h2>
          <p className="text-sm text-gray-500">Your tender management dashboard</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Refresh
          </Button>
          <Button size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards - Progressive Enhancement */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Always visible - Total Tenders */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Tenders
              </CardTitle>
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-gray-900">{stats.totalTenders}</p>
              <div className="flex items-center text-green-600">
                <ArrowUpRight className="w-4 h-4" />
                <span className="text-sm font-medium">+{stats.changePercent.total}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">From last month</p>
          </CardContent>
        </Card>

        {/* Always visible - Closing Soon */}
        <Card className="relative overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Closing Soon
              </CardTitle>
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-gray-900">{stats.closingSoon}</p>
              <div className="flex items-center text-red-600">
                <ArrowDownRight className="w-4 h-4" />
                <span className="text-sm font-medium">{stats.changePercent.closing}%</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">Next 3 days</p>
          </CardContent>
        </Card>

        {/* Progressive: Verified users and above */}
        {renderIf('save_searches',
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  New Today
                </CardTitle>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">{stats.newToday}</p>
                <div className="flex items-center text-green-600">
                  <ArrowUpRight className="w-4 h-4" />
                  <span className="text-sm font-medium">+{stats.changePercent.new}%</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">Posted today</p>
            </CardContent>
          </Card>
        )}

        {/* Progressive: Premium users only */}
        {renderIf('api_access',
          <Card className="relative overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-gray-600">
                  API Calls
                </CardTitle>
                <Activity className="w-4 h-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <p className="text-2xl font-bold text-gray-900">2.4k</p>
                <div className="flex items-center text-blue-600">
                  <span className="text-sm font-medium">Live</span>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-1">This month</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tenders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Recent Tenders
              </CardTitle>
              <Button variant="ghost" size="sm">
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTenders.map((tender, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{tender.name}</p>
                      <p className="text-xs text-gray-500">{tender.source}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={tender.status === 'closing-soon' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {tender.status === 'closing-soon' ? 'Closing Soon' : 'Active'}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">Closes</p>
                      <p className="text-xs font-medium">{tender.closingDate}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Search Tenders
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter by Campus
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download Reports
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Bell className="w-4 h-4 mr-2" />
                Set Notifications
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progressive: Advanced Analytics */}
      <ProgressiveFeatureLoader feature="advanced_filters">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              Tender Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                <p className="text-gray-600 font-medium">Advanced Analytics</p>
                <p className="text-sm text-gray-500">Track tender trends and insights</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </ProgressiveFeatureLoader>
    </div>
  );
};

export default DashboardContent;