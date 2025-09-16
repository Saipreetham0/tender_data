"use client";
import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ArrowLeft,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import Link from 'next/link';

interface TableData {
  columns: string[];
  rows: any[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

export default function TableViewPage() {
  const params = useParams();
  const tableName = params.tableName as string;

  const [data, setData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(50);

  const fetchTableData = async (page = 1, search = '') => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (search) {
        params.set('search', search);
      }

      const response = await fetch(`/api/admin/tables/${tableName}/data?${params}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch table data');
      }

      const result = await response.json();
      setData(result.data);
      setCurrentPage(page);
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tableName) {
      fetchTableData();
    }
  }, [tableName]);

  const handleSearch = () => {
    fetchTableData(1, searchTerm);
  };

  const handlePageChange = (page: number) => {
    fetchTableData(page, searchTerm);
  };

  const handleExport = async () => {
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

  const formatCellValue = (value: any): string => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'string' && value.length > 100) {
      return value.substring(0, 100) + '...';
    }
    return String(value);
  };

  const getColumnType = (column: string, value: any): string => {
    if (column.includes('id')) return 'ID';
    if (column.includes('email')) return 'Email';
    if (column.includes('_at')) return 'DateTime';
    if (typeof value === 'boolean') return 'Boolean';
    if (typeof value === 'number') return 'Number';
    if (typeof value === 'object') return 'JSON';
    return 'Text';
  };

  if (loading && !data) {
    return (
      <AdminLayout title={`Table: ${tableName}`}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading table data...</span>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title={`Table: ${tableName}`}>
        <Card className="border-red-200">
          <CardContent className="p-6">
            <p className="text-red-600">{error}</p>
            <Button onClick={() => fetchTableData()} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={`Table: ${tableName}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/admin/tables">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tables
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{tableName}</h1>
              <p className="text-gray-600">
                {data ? `${data.totalCount.toLocaleString()} total records` : 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => fetchTableData(currentPage, searchTerm)}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search table data..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </CardContent>
        </Card>

        {/* Table Data */}
        {data && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Table Data</CardTitle>
                <div className="flex items-center space-x-4">
                  <Badge variant="outline">
                    {data.columns.length} columns
                  </Badge>
                  <Badge variant="outline">
                    Page {data.currentPage} of {data.totalPages}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      {data.columns.map((column, index) => (
                        <th key={index} className="text-left py-3 px-4 font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{column}</span>
                            <span className="text-xs text-gray-500 font-normal">
                              {data.rows.length > 0 && getColumnType(column, data.rows[0][column])}
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b hover:bg-gray-50">
                        {data.columns.map((column, colIndex) => (
                          <td key={colIndex} className="py-3 px-4 max-w-xs">
                            <div className="truncate" title={formatCellValue(row[column])}>
                              {formatCellValue(row[column])}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data.totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-600">
                    Showing {((data.currentPage - 1) * limit) + 1} to {Math.min(data.currentPage * limit, data.totalCount)} of {data.totalCount} entries
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage - 1)}
                      disabled={data.currentPage <= 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex items-center space-x-1">
                      {[...Array(Math.min(5, data.totalPages))].map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === data.currentPage ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(data.currentPage + 1)}
                      disabled={data.currentPage >= data.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {data.rows.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No data found in this table.
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}