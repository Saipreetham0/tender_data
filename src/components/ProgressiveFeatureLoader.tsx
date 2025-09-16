// Progressive Feature Loading Component
'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useOptimizedAuth, useFeatureAccess, AuthState } from '@/lib/auth-optimization';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Crown, Lock, Loader2 } from 'lucide-react';

interface ProgressiveFeatureLoaderProps {
  feature: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  upgradePrompt?: boolean;
}

export function ProgressiveFeatureLoader({
  feature,
  children,
  fallback,
  upgradePrompt = true
}: ProgressiveFeatureLoaderProps) {
  const { authState, isLoading } = useOptimizedAuth();
  const { hasFeature } = useFeatureAccess();
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Progressive loading states
  if (isLoading) {
    return fallback || <FeatureSkeleton />;
  }

  // Feature access check
  const canAccess = hasFeature(feature);

  if (!canAccess) {
    if (upgradePrompt && authState !== AuthState.PREMIUM) {
      return <UpgradePrompt feature={feature} authState={authState} />;
    }
    return fallback || <AccessDenied feature={feature} />;
  }

  return <>{children}</>;
}

// Skeleton loader for features
function FeatureSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-32 w-full" />
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// Access denied component
function AccessDenied({ feature }: { feature: string }) {
  return (
    <Card className="p-6 text-center border-gray-200 bg-gray-50">
      <Lock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        Feature Not Available
      </h3>
      <p className="text-gray-600">
        The {feature} feature is not available with your current access level.
      </p>
    </Card>
  );
}

// Smart upgrade prompt
function UpgradePrompt({ feature, authState }: { feature: string; authState: AuthState }) {
  const getUpgradeMessage = () => {
    switch (authState) {
      case AuthState.GUEST:
        return "Sign up to unlock this feature";
      case AuthState.AUTHENTICATED:
        return "Verify your email to access this feature";
      case AuthState.VERIFIED:
        return "Upgrade to Premium to unlock this feature";
      default:
        return "Upgrade required";
    }
  };

  const getUpgradeAction = () => {
    switch (authState) {
      case AuthState.GUEST:
        return "Sign Up";
      case AuthState.AUTHENTICATED:
        return "Verify Email";
      case AuthState.VERIFIED:
        return "Upgrade to Premium";
      default:
        return "Upgrade";
    }
  };

  return (
    <Card className="p-6 text-center border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <Crown className="mx-auto h-12 w-12 text-amber-500 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {getUpgradeMessage()}
      </h3>
      <p className="text-gray-600 mb-4">
        Get access to {feature} and unlock all premium features.
      </p>
      <Button className="bg-amber-500 hover:bg-amber-600">
        {getUpgradeAction()}
      </Button>
    </Card>
  );
}

// Feature wrapper with lazy loading
export function LazyFeature({
  component: Component,
  feature,
  ...props
}: {
  component: React.ComponentType<any>;
  feature: string;
  [key: string]: any;
}) {
  return (
    <ProgressiveFeatureLoader feature={feature}>
      <Suspense fallback={<FeatureSkeleton />}>
        <Component {...props} />
      </Suspense>
    </ProgressiveFeatureLoader>
  );
}

// Hook for conditional feature rendering
export function useConditionalRender() {
  const { hasFeature } = useFeatureAccess();

  const renderIf = (feature: string, component: React.ReactNode, fallback?: React.ReactNode) => {
    return hasFeature(feature) ? component : (fallback || null);
  };

  return { renderIf, hasFeature };
}