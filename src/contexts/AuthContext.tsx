// Supabase Auth Context - Restored original version
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthError, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { authService, UserProfile, AuthUser } from "@/lib/auth";
import { useAutoLogout } from "@/hooks/useAutoLogout";
import { clearAllSubscriptionCache } from "@/hooks/useOptimizedSubscription";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  
  // Supabase auth methods
  signInWithMagicLink: (email: string) => Promise<{
    data: any;
    error: any;
  }>;
  signInWithGoogle: () => Promise<{
    data: any;
    error: any;
  }>;
  
  signOut: () => Promise<void>;
  updateProfile: (
    updates: Partial<UserProfile>
  ) => Promise<{ data: UserProfile | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
  
  subscription: {
    plan?: {
      name: string;
      features: string[];
    };
    status: string;
  } | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto logout hook with custom logout handler
  const { startMonitoring, stopMonitoring } = useAutoLogout({
    onLogout: async () => {
      await signOut();
    },
    onWarning: (timeLeft: number) => {
      const minutesLeft = Math.ceil(timeLeft / 60000);
      console.warn(`Session will expire in ${minutesLeft} minutes`);
    }
  });

  const loadUserProfile = async (supabaseUser: User) => {
    try {
      // Try to get existing profile from database
      const { profile, error } = await authService.getUserProfile(supabaseUser.id);

      if (error) {
        // Profile doesn't exist or error occurred, create one
        console.log("Creating user profile for:", supabaseUser.email);

        const newProfile = {
          id: supabaseUser.id,
          email: supabaseUser.email!,
          full_name: supabaseUser.user_metadata?.full_name || supabaseUser.email!.split("@")[0],
          avatar_url: supabaseUser.user_metadata?.avatar_url || undefined,
        };

        const { data: createdProfile, error: createError } = await authService.createProfile(
          supabaseUser.id, 
          newProfile
        );

        if (createError) {
          console.error("Error creating user profile:", createError);
          // Still set user without profile
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
          });
        } else if (createdProfile) {
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            profile: createdProfile as UserProfile,
          });
        } else {
          // Handle case where creation succeeded but no profile returned
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
          });
        }
      } else {
        // Profile exists
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          profile: profile as UserProfile,
        });
      }
    } catch (error) {
      console.error("Error in loadUserProfile:", error);
      // Fallback - set user without profile
      setUser({
        id: supabaseUser.id,
        email: supabaseUser.email!,
      });
    }
  };

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await loadUserProfile(session.user);
        startMonitoring();
      }
      setLoading(false);
    };

    getSession();

    // Listen for Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Supabase auth state changed:", event, session?.user?.email);

      if (session?.user) {
        await loadUserProfile(session.user);
        // Start auto logout monitoring when user is authenticated
        startMonitoring();
      } else {
        setUser(null);
        // Stop monitoring when user is logged out
        stopMonitoring();
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [startMonitoring, stopMonitoring]);

  // Supabase auth methods
  const signInWithMagicLink = async (email: string) => {
    return await authService.signInWithMagicLink(email);
  };

  const signInWithGoogle = async () => {
    return await authService.signInWithGoogle();
  };

  const signOut = async () => {
    stopMonitoring(); // Stop auto logout monitoring

    try {
      // Clear user state immediately to prevent UI issues
      setUser(null);

      // Clear all cached data first
      clearAllSubscriptionCache();

      // Clear all browser storage immediately
      if (typeof window !== 'undefined') {
        // Clear localStorage
        const localStorageKeys = [
          'supabase.auth.token',
          'supabase-auth-token',
          'auth-token',
          'session',
          'jwt-token'
        ];

        localStorageKeys.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove localStorage key: ${key}`, e);
          }
        });

        // Clear sessionStorage completely
        try {
          sessionStorage.clear();
        } catch (e) {
          console.warn('Failed to clear sessionStorage', e);
        }

        // Clear all cookies manually
        const cookiesToClear = [
          'supabase-auth-token',
          'supabase.auth.token',
          'auth-token',
          'session',
          'jwt-token'
        ];

        cookiesToClear.forEach(cookieName => {
          // Clear cookie for root domain
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname}`;
          // Clear cookie for current domain
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
          // Clear cookie without domain
          document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=.${window.location.hostname}`;
        });
      }

      // Call logout API for server-side cleanup (non-blocking)
      if (user?.id) {
        fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }).catch(error => {
          console.warn('Logout API call failed:', error);
        });
      }

      // Supabase logout (non-blocking)
      authService.signOut().catch(error => {
        console.warn('Supabase logout failed:', error);
      });

      // Wait a moment for cleanup to complete
      await new Promise(resolve => setTimeout(resolve, 100));

      // Force hard redirect to login page
      if (typeof window !== 'undefined') {
        window.location.replace('/login?loggedOut=true');
      }

    } catch (error) {
      console.error('Logout error:', error);

      // Force cleanup even on error
      setUser(null);

      if (typeof window !== 'undefined') {
        // Try to clear what we can
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (e) {
          console.warn('Failed to clear storage on error', e);
        }

        // Force redirect on error
        window.location.replace('/login?loggedOut=true');
      }
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error("No user logged in");

    const { data, error } = await authService.updateProfile(user.id, updates);

    if (!error && data) {
      setUser((prev) =>
        prev
          ? {
              ...prev,
              profile: { ...prev.profile, ...updates } as UserProfile,
            }
          : null
      );
    }

    return { data, error: error as Error | null };
  };

  const refreshProfile = async () => {
    if (!user) return;

    const { profile } = await authService.getUserProfile(user.id);

    if (profile) {
      setUser((prev) => (prev ? { ...prev, profile } : null));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithMagicLink,
        signInWithGoogle,
        signOut,
        updateProfile,
        refreshProfile,
        subscription: null, // Placeholder for subscription data
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Export types for backward compatibility
export type { UserProfile, AuthUser };