"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface AdminGuardProps {
  children: React.ReactNode;
  requiredPermission?: string;
}

export function AdminGuard({ children, requiredPermission }: AdminGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (loading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      try {
        // Use the same logic as AdminDebug since that works
        const ADMIN_EMAILS = [
          'admin@tendernotify.site',
          'koyyalasaipreetham@gmail.com',
          'info@kspdigitalsolutions.com'
        ];

        const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
        
        if (isAdminEmail) {
          // Get admin permissions based on email
          const permissions = user.email === 'admin@tendernotify.site' 
            ? ['view_dashboard', 'view_users', 'view_payments', 'view_analytics', 'view_api_logs', 'manage_users', 'manage_payments', 'manage_subscriptions', 'view_system_logs', 'manage_admins', 'system_settings', 'dangerous_operations', 'export_data']
            : ['view_dashboard', 'view_users', 'view_payments', 'view_analytics', 'view_api_logs', 'manage_users', 'manage_payments', 'manage_subscriptions', 'view_system_logs'];
          
          // Check specific permission if required
          if (requiredPermission && !permissions.includes(requiredPermission)) {
            setIsAdmin(false);
          } else {
            setIsAdmin(true);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin verification error:', error);
        setIsAdmin(false);
      } finally {
        setChecking(false);
      }
    };

    checkAdminStatus();
  }, [user, loading, router, requiredPermission]);

  if (loading || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verifying Access
            </h2>
            <p className="text-gray-600">
              Please wait while we verify your administrative privileges...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Required
            </h2>
            <p className="text-gray-600">
              Please log in to access the admin panel.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isAdmin === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-96">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Access Denied
            </h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the admin panel.
            </p>
            <p className="text-sm text-gray-500">
              Contact your system administrator if you believe this is an error.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}