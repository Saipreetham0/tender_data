'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Shield, Book, ExternalLink, Copy, Check } from 'lucide-react';

export default function AdminApiDocsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const apiEndpoints = [
    {
      category: 'Admin Health',
      endpoints: [
        {
          method: 'GET',
          path: '/api/admin/health',
          description: 'Get comprehensive system health status',
          auth: 'Admin API Key or Bearer Token',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/health'
        }
      ]
    },
    {
      category: 'Admin Users',
      endpoints: [
        {
          method: 'GET',
          path: '/api/admin/users',
          description: 'Get all users with pagination and filtering',
          auth: 'Admin API Key or Bearer Token',
          params: 'page, limit, search, subscription',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/users?page=1&limit=50'
        },
        {
          method: 'GET',
          path: '/api/admin/users/export',
          description: 'Export users data as CSV',
          auth: 'Admin API Key or Bearer Token',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/users/export'
        }
      ]
    },
    {
      category: 'Admin Payments',
      endpoints: [
        {
          method: 'GET',
          path: '/api/admin/payments',
          description: 'Get all payment transactions',
          auth: 'Admin API Key or Bearer Token',
          params: 'page, limit, status, userId',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/payments'
        },
        {
          method: 'GET',
          path: '/api/admin/payments/[id]',
          description: 'Get specific payment details',
          auth: 'Admin API Key or Bearer Token',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/payments/payment_id'
        }
      ]
    },
    {
      category: 'Admin Analytics',
      endpoints: [
        {
          method: 'GET',
          path: '/api/admin/analytics',
          description: 'Get system analytics and metrics',
          auth: 'Admin API Key or Bearer Token',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/analytics'
        }
      ]
    },
    {
      category: 'Documentation',
      endpoints: [
        {
          method: 'GET',
          path: '/api/admin/docs',
          description: 'Get OpenAPI 3.0 specification',
          auth: 'Admin API Key or Bearer Token',
          example: 'curl -H "x-admin-key: YOUR_API_KEY" http://localhost:3000/api/admin/docs'
        }
      ]
    }
  ];

  const baseUrl = typeof window !== 'undefined' 
    ? `${window.location.protocol}//${window.location.host}`
    : 'http://localhost:3000';

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          method: 'GET',
          credentials: 'include',
        });

        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          router.push('/admin?redirect=/admin/api-docs');
        }
      } catch (error) {
        console.error('Authentication check failed:', error);
        router.push('/admin?redirect=/admin/api-docs');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">
            This API documentation is restricted to administrators only.
          </p>
          <button
            onClick={() => router.push('/admin')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            Go to Admin Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin API Documentation</h1>
                <p className="text-gray-600">Private API endpoints for system administration</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <span>Admin Access</span>
              </div>
              <button
                onClick={() => router.push('/admin')}
                className="text-gray-600 hover:text-gray-900 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5" />
            <div className="ml-3">
              <p className="text-sm text-yellow-800">
                <strong>Private Documentation:</strong> This API documentation contains sensitive administrative endpoints. 
                Do not share access credentials or API keys with unauthorized personnel.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Book className="h-4 w-4" />
              <span>Quick Links:</span>
            </div>
            <a href="#/Admin%20Users" className="text-blue-600 hover:text-blue-800">User Management</a>
            <a href="#/Admin%20Payments" className="text-blue-600 hover:text-blue-800">Payment Administration</a>
            <a href="#/Admin%20Analytics" className="text-blue-600 hover:text-blue-800">System Analytics</a>
            <a href="#/Admin%20Health" className="text-blue-600 hover:text-blue-800">Health Monitoring</a>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Authentication Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">Authentication</h3>
          <p className="text-blue-800 mb-4">
            All admin API endpoints require authentication using one of the following methods:
          </p>
          <div className="space-y-2 text-sm">
            <div className="bg-white p-3 rounded border">
              <strong>Admin API Key (Header):</strong>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">x-admin-key: YOUR_API_KEY</code>
            </div>
            <div className="bg-white p-3 rounded border">
              <strong>Bearer Token (Header):</strong>
              <code className="ml-2 bg-gray-100 px-2 py-1 rounded">Authorization: Bearer YOUR_JWT_TOKEN</code>
            </div>
          </div>
        </div>

        {/* API Endpoints */}
        <div className="space-y-6">
          {apiEndpoints.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">{category.category}</h3>
              </div>
              
              <div className="divide-y divide-gray-200">
                {category.endpoints.map((endpoint, endpointIndex) => (
                  <div key={endpointIndex} className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          endpoint.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          endpoint.method === 'POST' ? 'bg-green-100 text-green-800' :
                          endpoint.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          endpoint.method === 'DELETE' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {endpoint.method}
                        </span>
                        <code className="text-lg font-mono text-gray-900">{endpoint.path}</code>
                      </div>
                      
                      <button
                        onClick={() => window.open(`${baseUrl}${endpoint.path}`, '_blank')}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Test endpoint"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    </div>
                    
                    <p className="text-gray-700 mb-4">{endpoint.description}</p>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">Authentication</h4>
                        <p className="text-sm text-gray-600 mb-4">{endpoint.auth}</p>
                        
                        {endpoint.params && (
                          <>
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Parameters</h4>
                            <p className="text-sm text-gray-600 mb-4">{endpoint.params}</p>
                          </>
                        )}
                      </div>
                      
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900">Example Request</h4>
                          <button
                            onClick={() => copyToClipboard(endpoint.example)}
                            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors"
                          >
                            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
                          </button>
                        </div>
                        <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                          {endpoint.example}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* OpenAPI Specification Link */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">OpenAPI 3.0 Specification</h3>
              <p className="text-gray-600">
                Get the complete API specification in OpenAPI 3.0 format for use with other tools.
              </p>
            </div>
            <button
              onClick={() => window.open(`${baseUrl}/api/admin/docs`, '_blank')}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>View OpenAPI Spec</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 border-t border-gray-200 px-4 py-6 mt-8">
        <div className="max-w-7xl mx-auto text-center text-sm text-gray-600">
          <p>RGUKT Tenders SaaS Platform - Admin API v1.0.0</p>
          <p className="mt-1">For technical support, contact: admin@tender-data.com</p>
        </div>
      </div>
    </div>
  );
}