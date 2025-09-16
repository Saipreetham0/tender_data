// Optimized Auth Context with Progressive Loading
'use client';

import React, { createContext, useContext } from 'react';
import { useOptimizedAuth, useFeatureAccess, AuthState } from '@/lib/auth-optimization';
import { useAuth as useOriginalAuth } from '@/contexts/AuthContext';

interface OptimizedAuthContextType {
  // Progressive auth state
  authState: AuthState;
  user: any;
  profile: any;
  subscription: any;
  permissions: string[];

  // Loading states
  isLoading: boolean;
  error: any;

  // Feature access
  hasFeature: (featureId: string) => boolean;

  // Original auth methods
  signInWithMagicLink: (email: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signOut: () => Promise<void>;
  updateProfile: (updates: any) => Promise<any>;
  refreshProfile: () => Promise<void>;
}

const OptimizedAuthContext = createContext<OptimizedAuthContextType | undefined>(undefined);

export function OptimizedAuthProvider({ children }: { children: React.ReactNode }) {
  // Use original auth for authentication methods
  const originalAuth = useOriginalAuth();

  // Use optimized auth for data and progressive states
  const optimizedAuth = useOptimizedAuth();
  const { hasFeature } = useFeatureAccess();

  const contextValue: OptimizedAuthContextType = {
    // Progressive data
    authState: optimizedAuth.authState,
    user: optimizedAuth.user,
    profile: optimizedAuth.profile,
    subscription: optimizedAuth.subscription,
    permissions: optimizedAuth.permissions,

    // Loading states
    isLoading: optimizedAuth.isLoading,
    error: optimizedAuth.error,

    // Feature access
    hasFeature,

    // Original auth methods
    signInWithMagicLink: originalAuth.signInWithMagicLink,
    signInWithGoogle: originalAuth.signInWithGoogle,
    signOut: originalAuth.signOut,
    updateProfile: originalAuth.updateProfile,
    refreshProfile: originalAuth.refreshProfile,
  };

  return (
    <OptimizedAuthContext.Provider value={contextValue}>
      {children}
    </OptimizedAuthContext.Provider>
  );
}

export function useOptimizedAuthContext() {
  const context = useContext(OptimizedAuthContext);
  if (!context) {
    throw new Error('useOptimizedAuthContext must be used within OptimizedAuthProvider');
  }
  return context;
}

// Backwards compatibility hook
export function useAuth() {
  return useOptimizedAuthContext();
}