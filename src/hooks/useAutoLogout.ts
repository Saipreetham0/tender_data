// Supabase Auto Logout Hook
"use client";
import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';

interface UseAutoLogoutOptions {
  onLogout?: () => Promise<void> | void;
  checkInterval?: number; // milliseconds
  warningTime?: number; // milliseconds before expiration to show warning
  onWarning?: (timeLeft: number) => void;
}

export function useAutoLogout(options: UseAutoLogoutOptions = {}) {
  const {
    onLogout,
    checkInterval = 60000, // Check every minute
    warningTime = 300000, // 5 minutes warning
    onWarning
  } = options;
  
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const warningShownRef = useRef(false);
  const currentUserRef = useRef<User | null>(null);

  const checkTokenExpiration = useCallback(async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('No valid session found, logging out...');
        await handleLogout();
        return;
      }

      const user = session.user;
      currentUserRef.current = user;

      // Check if token is expired based on expires_at
      const expirationTime = session.expires_at ? session.expires_at * 1000 : 0;
      const currentTime = Date.now();
      const timeLeft = expirationTime - currentTime;

      // If token is expired, logout immediately
      if (timeLeft <= 0) {
        console.log('Token expired, logging out...');
        await handleLogout();
        return;
      }

      // If warning time is reached and warning hasn't been shown
      if (timeLeft <= warningTime && !warningShownRef.current) {
        warningShownRef.current = true;
        onWarning?.(timeLeft);
      }

      // Reset warning flag if user has more time again (token was refreshed)
      if (timeLeft > warningTime) {
        warningShownRef.current = false;
      }

    } catch (error) {
      console.error('Error checking token expiration:', error);
      // If token check fails, logout for security
      await handleLogout();
    }
  }, [onLogout, warningTime, onWarning]);

  const handleLogout = useCallback(async () => {
    try {
      // Call custom logout handler if provided
      if (onLogout) {
        await onLogout();
      } else {
        // Fallback: directly sign out from Supabase
        await supabase.auth.signOut();
      }
      
      // Redirect to login page
      router.push('/login?reason=session_expired');
    } catch (error) {
      console.error('Error during auto logout:', error);
      // Force redirect even if logout fails
      router.push('/login?reason=session_expired');
    }
  }, [onLogout, router]);

  // Start monitoring token expiration
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Check immediately if user is available
    if (currentUserRef.current) {
      checkTokenExpiration();
    }
    
    // Set up periodic checking
    intervalRef.current = setInterval(checkTokenExpiration, checkInterval);
  }, [checkTokenExpiration, checkInterval]);

  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    warningShownRef.current = false;
    currentUserRef.current = null;
  }, []);

  // Manual logout function
  const logout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

  useEffect(() => {
    // Only start monitoring if we're on the client side
    if (typeof window !== 'undefined') {
      // Set up auth state listener to track current user
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        const user = session?.user || null;
        currentUserRef.current = user;
        
        if (user) {
          startMonitoring();
        } else {
          stopMonitoring();
        }
      });

      return () => {
        subscription.unsubscribe();
        stopMonitoring();
      };
    }
  }, [startMonitoring, stopMonitoring]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    startMonitoring,
    stopMonitoring,
    logout,
    checkTokenExpiration
  };
}