// Optimized Navbar Subscription Status Component
'use client';

import React from 'react';
import { Crown, Zap, Shield, Star, CreditCard } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useOptimizedAuthContext } from '@/contexts/OptimizedAuthContext';
import { useSubscriptionData } from '@/hooks/useSubscriptionData';
import { AuthState } from '@/lib/auth-optimization';

interface NavbarSubscriptionStatusProps {
  onUpgradeClick?: () => void;
  compact?: boolean;
}

export function NavbarSubscriptionStatus({
  onUpgradeClick,
  compact = false
}: NavbarSubscriptionStatusProps) {
  const { authState, hasFeature } = useOptimizedAuthContext();
  const { subscription, isLoading } = useSubscriptionData();

  // Loading state
  if (isLoading) {
    return (
      <div className={`animate-pulse ${compact ? 'h-4 w-16' : 'h-6 w-24'} bg-gray-200 rounded`} />
    );
  }

  // Guest state
  if (authState === AuthState.GUEST) {
    return (
      <Button
        size={compact ? "sm" : "default"}
        variant="outline"
        onClick={onUpgradeClick}
        className="text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Crown className="h-4 w-4 mr-1" />
        Get Started
      </Button>
    );
  }

  // Get subscription info
  const getSubscriptionInfo = () => {
    if (subscription?.status === 'active') {
      const planName = subscription.plan?.name || 'Premium';
      return {
        status: 'active',
        label: planName,
        icon: Crown,
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-200',
        iconColor: 'text-yellow-500'
      };
    }

    // Based on auth state for non-premium users
    switch (authState) {
      case AuthState.AUTHENTICATED:
        return {
          status: 'basic',
          label: 'Basic',
          icon: Shield,
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          iconColor: 'text-blue-500'
        };
      case AuthState.VERIFIED:
        return {
          status: 'verified',
          label: 'Verified',
          icon: Zap,
          bgColor: 'bg-purple-100',
          textColor: 'text-purple-800',
          borderColor: 'border-purple-200',
          iconColor: 'text-purple-500'
        };
      default:
        return {
          status: 'free',
          label: 'Free',
          icon: Star,
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          borderColor: 'border-gray-200',
          iconColor: 'text-gray-500'
        };
    }
  };

  const subscriptionInfo = getSubscriptionInfo();
  const { status, label, icon: Icon, bgColor, textColor, borderColor, iconColor } = subscriptionInfo;

  // Compact version for navbar
  if (compact) {
    return (
      <div className="flex items-center space-x-1">
        <Icon className={`h-3 w-3 ${iconColor}`} />
        <span className={`text-xs ${textColor}`}>
          {label}
        </span>
      </div>
    );
  }

  // Full version for dropdown
  return (
    <div className="flex items-center justify-between w-full">
      <Badge className={`${bgColor} ${textColor} ${borderColor} flex items-center space-x-1`}>
        <Icon className="h-3 w-3" />
        <span>{label} Plan</span>
      </Badge>

      {status === 'active' ? (
        <span className="text-xs text-green-600 font-medium">Active</span>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          onClick={onUpgradeClick}
          className="text-xs h-6 px-2 text-blue-600 hover:bg-blue-50"
        >
          <Crown className="h-3 w-3 mr-1" />
          Upgrade
        </Button>
      )}
    </div>
  );
}

// Quick subscription action component
export function QuickSubscriptionAction() {
  const { authState } = useOptimizedAuthContext();
  const { subscription } = useSubscriptionData();

  if (subscription?.status === 'active') {
    return (
      <Button size="sm" variant="ghost" className="text-green-600">
        <Crown className="h-4 w-4 mr-1" />
        Manage Plan
      </Button>
    );
  }

  const getActionText = () => {
    switch (authState) {
      case AuthState.GUEST:
        return "Get Started";
      case AuthState.AUTHENTICATED:
        return "Upgrade";
      case AuthState.VERIFIED:
        return "Go Premium";
      default:
        return "Upgrade";
    }
  };

  return (
    <Button size="sm" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
      <CreditCard className="h-4 w-4 mr-1" />
      {getActionText()}
    </Button>
  );
}