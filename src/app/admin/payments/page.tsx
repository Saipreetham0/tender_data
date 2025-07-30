"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  CreditCard,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
  RotateCcw
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Payment {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: 'completed' | 'failed' | 'pending' | 'refunded';
  payment_method: string;
  gateway_transaction_id: string;
  gateway: string;
  plan_name: string;
  description: string;
  created_at: string;
  completed_at?: string;
  failed_at?: string;
  refunded_at?: string;
  failure_reason?: string;
  refund_reason?: string;
  gateway_response?: any;
  users?: {
    email: string;
    user_metadata: {
      name?: string;
      full_name?: string;
    };
  };
}

interface PaymentStats {
  totalPayments: number;
  successfulPayments: number;
  pendingPayments: number;
  failedPayments: number;
  totalRevenue: number;
  monthlyRevenue: number;
}

export default function PaymentsPage() {
  const { user: currentUser } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    totalPayments: 0,
    successfulPayments: 0,
    pendingPayments: 0,
    failedPayments: 0,
    totalRevenue: 0,
    monthlyRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/admin/payments');
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }

      const data = await response.json();
      setPayments(data.payments || []);
      setStats(data.stats || {
        totalPayments: 0,
        successfulPayments: 0,
        pendingPayments: 0,
        failedPayments: 0,
        totalRevenue: 0,
        monthlyRevenue: 0
      });
    } catch (err) {
      console.error('Error fetching payments:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [currentUser]);

  const handlePaymentAction = async (paymentId: string, action: string, reason?: string) => {
    try {
      setActionLoading(paymentId);

      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} payment`);
      }

      // Refresh payments list
      await fetchPayments();
      setSelectedPayment(null);
      setRefundReason('');
    } catch (err) {
      console.error(`Error ${action} payment:`, err);
      alert(`Failed to ${action} payment`);
    } finally {
      setActionLoading(null);
    }
  };

  const exportPayments = async () => {
    try {
      const response = await fetch('/api/admin/payments/export');
      if (!response.ok) {
        throw new Error('Failed to export payments');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `payments-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting payments:', err);
      alert('Failed to export payments');
    }
  };

  const filteredPayments = payments.filter(payment => {
    const userEmail = payment.users?.email || '';
    const userName = payment.users?.user_metadata?.name || payment.users?.user_metadata?.full_name || '';
    
    const matchesSearch = userEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.gateway_transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'refunded':
        return <RotateCcw className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    const variants = {
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      refunded: 'bg-orange-100 text-orange-800'
    };

    return (
      <Badge className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <AdminGuard requiredPermission="view_payments">
        <AdminLayout>
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </AdminLayout>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard requiredPermission="view_payments">
      <AdminLayout>
        <div className="space-y-6">
          {/* Header Actions */}
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="text-gray-600 mt-1">Manage and monitor all payment transactions</p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={fetchPayments}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button variant="outline" onClick={exportPayments}>
                <Download className="h-4 w-4 mr-2" />
                Export
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

          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Payments</p>
                    <p className="text-2xl font-bold">{stats.totalPayments}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Successful</p>
                    <p className="text-2xl font-bold text-green-600">{stats.successfulPayments}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Failed</p>
                    <p className="text-2xl font-bold text-red-600">{stats.failedPayments}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                    <p className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</p>
                  </div>
                  <CreditCard className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search by email, transaction ID, or payment ID..."
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
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="refunded">Refunded</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>Payments ({filteredPayments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Gateway</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => {
                    const user = payment.users;
                    const userName = user?.user_metadata?.name || user?.user_metadata?.full_name || 'Unknown';
                    
                    return (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{userName}</p>
                            <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            ₹{payment.amount.toLocaleString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(payment.status)}
                            {getStatusBadge(payment.status)}
                          </div>
                        </TableCell>
                        <TableCell>{payment.plan_name}</TableCell>
                        <TableCell className="capitalize">
                          {payment.gateway} ({payment.payment_method})
                        </TableCell>
                        <TableCell>
                          {new Date(payment.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={actionLoading === payment.id}>
                                {actionLoading === payment.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreHorizontal className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedPayment(payment)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {payment.status === 'completed' && (
                                <DropdownMenuItem 
                                  onClick={() => handlePaymentAction(payment.id, 'refund', refundReason)}
                                  className="text-orange-600"
                                >
                                  <RotateCcw className="h-4 w-4 mr-2" />
                                  Refund
                                </DropdownMenuItem>
                              )}
                              {payment.status === 'pending' && (
                                <>
                                  <DropdownMenuItem 
                                    onClick={() => handlePaymentAction(payment.id, 'mark_completed')}
                                    className="text-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Mark Completed
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handlePaymentAction(payment.id, 'mark_failed', 'Manual failure')}
                                    className="text-red-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Mark Failed
                                  </DropdownMenuItem>
                                </>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {filteredPayments.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  No payments found matching your criteria.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details Dialog */}
          {selectedPayment && (
            <Dialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
              <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Payment Details</DialogTitle>
                  <DialogDescription>
                    Complete information about payment {selectedPayment.id}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium">Payment ID</label>
                      <p className="text-sm text-gray-600 font-mono">{selectedPayment.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">User Email</label>
                      <p className="text-sm text-gray-600">{selectedPayment.users?.email || 'N/A'}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Amount</label>
                      <p className="text-sm text-gray-600 font-semibold">
                        {selectedPayment.currency} {selectedPayment.amount.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Status</label>
                      <div className="mt-1">
                        {getStatusBadge(selectedPayment.status)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Gateway Transaction ID</label>
                      <p className="text-sm text-gray-600 font-mono">{selectedPayment.gateway_transaction_id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Payment Gateway</label>
                      <p className="text-sm text-gray-600 capitalize">{selectedPayment.gateway}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Payment Method</label>
                      <p className="text-sm text-gray-600 capitalize">{selectedPayment.payment_method}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Plan</label>
                      <p className="text-sm text-gray-600">{selectedPayment.plan_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Created At</label>
                      <p className="text-sm text-gray-600">
                        {new Date(selectedPayment.created_at).toLocaleString()}
                      </p>
                    </div>
                    {selectedPayment.completed_at && (
                      <div>
                        <label className="text-sm font-medium">Completed At</label>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedPayment.completed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedPayment.failed_at && (
                      <div>
                        <label className="text-sm font-medium">Failed At</label>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedPayment.failed_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {selectedPayment.refunded_at && (
                      <div>
                        <label className="text-sm font-medium">Refunded At</label>
                        <p className="text-sm text-gray-600">
                          {new Date(selectedPayment.refunded_at).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedPayment.description && (
                    <div>
                      <label className="text-sm font-medium">Description</label>
                      <p className="text-sm text-gray-600">{selectedPayment.description}</p>
                    </div>
                  )}

                  {selectedPayment.failure_reason && (
                    <div>
                      <label className="text-sm font-medium">Failure Reason</label>
                      <p className="text-sm text-red-600">{selectedPayment.failure_reason}</p>
                    </div>
                  )}

                  {selectedPayment.refund_reason && (
                    <div>
                      <label className="text-sm font-medium">Refund Reason</label>
                      <p className="text-sm text-orange-600">{selectedPayment.refund_reason}</p>
                    </div>
                  )}

                  {selectedPayment.gateway_response && (
                    <div>
                      <label className="text-sm font-medium">Gateway Response</label>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(selectedPayment.gateway_response, null, 2)}
                      </pre>
                    </div>
                  )}

                  {selectedPayment.status === 'completed' && (
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-2">Refund Payment</h4>
                      <Textarea
                        placeholder="Reason for refund..."
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                        className="mb-2"
                      />
                      <Button 
                        onClick={() => handlePaymentAction(selectedPayment.id, 'refund', refundReason)}
                        variant="destructive"
                        disabled={!refundReason.trim() || actionLoading === selectedPayment.id}
                      >
                        {actionLoading === selectedPayment.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <RotateCcw className="h-4 w-4 mr-2" />
                        )}
                        Process Refund
                      </Button>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}