'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface APIErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function APIError({ error, reset }: APIErrorProps) {
  useEffect(() => {
    // Log API error to monitoring service
    console.error('API error:', error);
    
    // In production, send to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to Sentry, LogRocket, etc.
      // errorTracking.captureException(error, { tags: { type: 'api' } });
    }
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            API Error
          </CardTitle>
          <CardDescription className="mt-2 text-gray-600">
            We encountered an error while processing your request.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {process.env.NODE_ENV === 'development' && (
            <div className="bg-gray-100 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-gray-800 mb-2">
                Error Details (Development)
              </h4>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {error.message}
              </pre>
              {error.digest && (
                <p className="text-xs text-gray-500 mt-2">
                  Error ID: {error.digest}
                </p>
              )}
            </div>
          )}
          <div className="flex space-x-3">
            <Button
              onClick={reset}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Retry</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = '/';
                }
              }}
              className="flex-1 flex items-center justify-center space-x-2"
            >
              <Home className="h-4 w-4" />
              <span>Go home</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}