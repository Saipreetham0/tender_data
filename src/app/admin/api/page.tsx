"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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
  Database,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Clock,
  Search,
  RefreshCw,
  Download,
  Eye,
  Loader2
} from 'lucide-react';

interface APILog {
  id: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: string;
  userAgent: string;
  ipAddress: string;
  userId?: string;
  errorMessage?: string;
}

interface APIStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  requestsPerHour: number;
  topEndpoints: { endpoint: string; count: number; }[];
  recentErrors: APILog[];
}

const mockApiLogs: APILog[] = [
  {
    id: '1',
    endpoint: '/api/tenders/basar',
    method: 'GET',
    statusCode: 200,
    responseTime: 245,
    timestamp: '2024-01-15T10:30:00Z',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    ipAddress: '192.168.1.100',
    userId: 'user123'
  },
  {
    id: '2',
    endpoint: '/api/subscription/current',
    method: 'GET',
    statusCode: 401,
    responseTime: 123,
    timestamp: '2024-01-15T10:25:00Z',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ipAddress: '192.168.1.101',
    errorMessage: 'Unauthorized access'
  },
  {
    id: '3',
    endpoint: '/api/payment/create-order',
    method: 'POST',
    statusCode: 500,
    responseTime: 1234,
    timestamp: '2024-01-15T10:20:00Z',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1)',
    ipAddress: '192.168.1.102',
    userId: 'user456',
    errorMessage: 'Internal server error - Database connection failed'
  },
  {
    id: '4',
    endpoint: '/api/tenders/basar',
    method: 'GET',
    statusCode: 200,
    responseTime: 189,
    timestamp: '2024-01-15T10:15:00Z',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    ipAddress: '192.168.1.103',
    userId: 'user789'
  }
];

const mockApiStats: APIStats = {
  totalRequests: 15420,
  successfulRequests: 14892,
  failedRequests: 528,
  averageResponseTime: 312,
  requestsPerHour: 1285,
  topEndpoints: [
    { endpoint: '/api/tenders/basar', count: 3421 },
    { endpoint: '/api/tenders/ongole', count: 2876 },
    { endpoint: '/api/subscription/current', count: 2145 },
    { endpoint: '/api/tenders/sklm', count: 1987 },
    { endpoint: '/api/payment/create-order', count: 1234 }
  ],
  recentErrors: mockApiLogs.filter(log => log.statusCode >= 400)
};

export default function APIManagementPage() {
  const [apiLogs, setApiLogs] = useState<APILog[]>([]);
  const [apiStats, setApiStats] = useState<APIStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');

  useEffect(() => {
    const fetchApiData = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setApiLogs(mockApiLogs);
        setApiStats(mockApiStats);
      } catch (error) {
        console.error('Failed to fetch API data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchApiData();
  }, []);

  const filteredLogs = apiLogs.filter(log => {
    const matchesSearch = log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.ipAddress.includes(searchTerm) ||
                         (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'success' && log.statusCode < 400) ||
                         (statusFilter === 'error' && log.statusCode >= 400);
    
    const matchesMethod = methodFilter === 'all' || log.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusBadge = (statusCode: number) => {
    if (statusCode < 300) {
      return <Badge className="bg-green-100 text-green-800">Success</Badge>;
    } else if (statusCode < 400) {
      return <Badge className="bg-blue-100 text-blue-800">Redirect</Badge>;
    } else if (statusCode < 500) {
      return <Badge className="bg-yellow-100 text-yellow-800">Client Error</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800">Server Error</Badge>;
    }
  };

  const getStatusIcon = (statusCode: number) => {
    if (statusCode < 400) {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getResponseTimeColor = (responseTime: number) => {
    if (responseTime < 200) return 'text-green-600';
    if (responseTime < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <AdminLayout title="API Management" requiredPermission="view_api_logs">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading API data...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="API Management" requiredPermission="view_api_logs">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">API Management</h2>
            <p className="text-sm text-gray-600">
              Monitor API performance, logs, and usage statistics
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export Logs
            </Button>
            <Button onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* API Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold">{apiStats?.totalRequests.toLocaleString()}</p>
                </div>
                <Database className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {apiStats ? Math.round((apiStats.successfulRequests / apiStats.totalRequests) * 100) : 0}%
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold">{apiStats?.averageResponseTime}ms</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Requests/Hour</p>
                  <p className="text-2xl font-bold">{apiStats?.requestsPerHour.toLocaleString()}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">API Logs</TabsTrigger>
            <TabsTrigger value="endpoints">Top Endpoints</TabsTrigger>
            <TabsTrigger value="errors">Recent Errors</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                      <Input
                        placeholder="Search by endpoint, IP, or user ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="success">Success (2xx-3xx)</SelectItem>
                      <SelectItem value="error">Error (4xx-5xx)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* API Logs Table */}
            <Card>
              <CardHeader>
                <CardTitle>API Request Logs</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Endpoint</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Response Time</TableHead>
                      <TableHead>IP Address</TableHead>
                      <TableHead>User ID</TableHead>
                      <TableHead>Timestamp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="font-mono text-sm">
                            {log.endpoint}
                          </div>
                          {log.errorMessage && (
                            <div className="text-xs text-red-600 mt-1">
                              {log.errorMessage}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{log.method}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(log.statusCode)}
                            <span className="font-mono">{log.statusCode}</span>
                            {getStatusBadge(log.statusCode)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`font-mono ${getResponseTimeColor(log.responseTime)}`}>
                            {log.responseTime}ms
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {log.ipAddress}
                        </TableCell>
                        <TableCell>
                          {log.userId ? (
                            <span className="font-mono text-sm">{log.userId}</span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="endpoints" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Most Popular Endpoints</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiStats?.topEndpoints.map((endpoint, index) => (
                    <div key={endpoint.endpoint} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-mono text-sm">{endpoint.endpoint}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{endpoint.count.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">requests</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span>Recent Errors</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiStats?.recentErrors.map((error) => (
                    <div key={error.id} className="border border-red-200 rounded-lg p-4 bg-red-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className="bg-red-100 text-red-800">
                              {error.statusCode}
                            </Badge>
                            <span className="font-mono text-sm">{error.method}</span>
                            <span className="font-mono text-sm">{error.endpoint}</span>
                          </div>
                          <p className="text-sm text-red-800">
                            {error.errorMessage || `HTTP ${error.statusCode} Error`}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-600">
                            <span>IP: {error.ipAddress}</span>
                            {error.userId && <span>User: {error.userId}</span>}
                            <span>{new Date(error.timestamp).toLocaleString()}</span>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}