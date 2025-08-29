"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  UserCheck, 
  UserX, 
  Mail, 
  Calendar,
  Users,
  Loader2,
  RefreshCw,
  Download,
  Ban,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: string;
  email: string;
  user_metadata: {
    name?: string;
    full_name?: string;
  };
  created_at: string;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
  banned_until: string | null;
}

interface UserSubscription {
  id: string;
  user_id: string;
  plan_name: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  inactiveUsers: number;
}

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [users, setUsers] = useState<User[]>([]);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    premiumUsers: 0,
    inactiveUsers: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users
      const usersResponse = await fetch('/api/admin/users');
      if (!usersResponse.ok) {
        throw new Error('Failed to fetch users');
      }
      const usersData = await usersResponse.json();
      setUsers(usersData.users || []);

      // Fetch subscriptions
      const subscriptionsResponse = await fetch('/api/admin/subscriptions');
      let subscriptionsData: any = null;
      if (subscriptionsResponse.ok) {
        subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData.subscriptions || []);
      }

      // Calculate stats
      const totalUsers = usersData.users?.length || 0;
      const activeUsers = usersData.users?.filter((u: User) => 
        u.last_sign_in_at && 
        new Date(u.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      ).length || 0;
      const premiumUsers = subscriptionsData?.subscriptions?.filter((s: UserSubscription) => 
        s.status === 'active' && s.plan_name !== 'free'
      ).length || 0;

      setStats({
        totalUsers,
        activeUsers,
        premiumUsers,
        inactiveUsers: totalUsers - activeUsers
      });

    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [currentUser]);

  const handleUserAction = async (userId: string, action: 'ban' | 'unban' | 'resend_confirmation') => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`);
      }

      // Refresh users list
      await fetchUsers();
    } catch (err) {
      console.error(`Error ${action} user:`, err);
      alert(`Failed to ${action} user`);
    }
  };

  const exportUsers = async () => {
    try {
      const response = await fetch('/api/admin/users/export');
      if (!response.ok) {
        throw new Error('Failed to export users');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting users:', err);
      alert('Failed to export users');
    }
  };

  const getUserSubscription = (userId: string) => {
    return subscriptions.find(sub => sub.user_id === userId);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.user_metadata?.name || user.user_metadata?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'active') return matchesSearch && user.last_sign_in_at && new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (filterStatus === 'inactive') return matchesSearch && (!user.last_sign_in_at || new Date(user.last_sign_in_at) <= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    if (filterStatus === 'banned') return matchesSearch && user.banned_until;
    
    return matchesSearch;
  });

  if (loading) {
    return (
      <AdminGuard requiredPermission="view_users">
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredPermission="view_users">
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
              <p className="text-gray-600 mt-1">Manage users, subscriptions, and access</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={fetchUsers}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportUsers}>
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </Button>
            </div>
          </div>

          {error && (
            <Card className="border-red-200">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Premium Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.premiumUsers}</p>
                  </div>
                  <UserCheck className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Inactive Users</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.inactiveUsers}</p>
                  </div>
                  <UserX className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card>
            <CardHeader>
              <CardTitle>Users ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={filterStatus === 'all' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('all')}
                    size="sm"
                  >
                    All
                  </Button>
                  <Button
                    variant={filterStatus === 'active' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('active')}
                    size="sm"
                  >
                    Active
                  </Button>
                  <Button
                    variant={filterStatus === 'inactive' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('inactive')}
                    size="sm"
                  >
                    Inactive
                  </Button>
                  <Button
                    variant={filterStatus === 'banned' ? 'default' : 'outline'}
                    onClick={() => setFilterStatus('banned')}
                    size="sm"
                  >
                    Banned
                  </Button>
                </div>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Subscription</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Join Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Last Active</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => {
                      const subscription = getUserSubscription(user.id);
                      const isActive = user.last_sign_in_at && new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
                      const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
                      
                      return (
                        <tr key={user.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.user_metadata?.name || user.user_metadata?.full_name || 'Unknown'}
                              </p>
                              <p className="text-sm text-gray-600">{user.email}</p>
                              {!user.email_confirmed_at && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  Unconfirmed
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={subscription?.plan_name !== 'free' ? 'default' : 'secondary'}>
                              {subscription?.plan_name || 'Free'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4">
                            <Badge variant={
                              isBanned ? 'destructive' : 
                              isActive ? 'default' : 
                              'secondary'
                            }>
                              {isBanned ? 'Banned' : isActive ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {new Date(user.created_at).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4 text-sm text-gray-600">
                            {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-1">
                              {!user.email_confirmed_at && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'resend_confirmation')}
                                  title="Resend confirmation email"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              {isBanned ? (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'unban')}
                                  title="Unban user"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              ) : (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleUserAction(user.id, 'ban')}
                                  title="Ban user"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No users found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}