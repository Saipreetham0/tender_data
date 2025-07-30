"use client";
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminDebug() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  const ADMIN_EMAILS = [
    'admin@tendernotify.site',
    'koyyalasaipreetham@gmail.com',
    'info@kspdigitalsolutions.com'
  ];

  const isAdminEmail = user ? ADMIN_EMAILS.includes(user.email.toLowerCase()) : false;

  return (
    <div className="max-w-md mx-auto mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Admin Access Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <strong>Current User:</strong>
            <p className="text-sm text-gray-600">
              {user ? user.email : 'Not logged in'}
            </p>
          </div>
          
          <div>
            <strong>Admin Status:</strong>
            <p className={`text-sm ${isAdminEmail ? 'text-green-600' : 'text-red-600'}`}>
              {isAdminEmail ? '✅ Admin Access Granted' : '❌ Not an Admin'}
            </p>
          </div>

          <div>
            <strong>Admin Emails:</strong>
            <ul className="text-sm text-gray-600 mt-1">
              {ADMIN_EMAILS.map(email => (
                <li key={email} className={user?.email.toLowerCase() === email ? 'text-green-600 font-bold' : ''}>
                  {email} {user?.email.toLowerCase() === email && '← You are here'}
                </li>
              ))}
            </ul>
          </div>

          {!user && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Please log in first:</strong><br />
                Go to <a href="/login" className="underline">/login</a> and sign in with an admin email.
              </p>
            </div>
          )}

          {user && !isAdminEmail && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                <strong>Access Denied:</strong><br />
                Your email ({user.email}) is not in the admin list. Please contact the administrator.
              </p>
            </div>
          )}

          {user && isAdminEmail && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                <strong>Access Granted!</strong><br />
                You can now access the admin panel.
              </p>
              <a 
                href="/admin" 
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Admin Panel
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}