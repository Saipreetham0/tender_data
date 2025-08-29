// src/hooks/useAutoLogout.ts
"use client";
import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

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

  const checkTokenExpiration = useCallback(async () => {
    try {
      // Check Supabase session instead of localStorage token
      const { supabase } = await import('@/lib/auth');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log('No valid session found, logging out...');
        await handleLogout();
        return;
      }

      // Check token expiration
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
      // If session check fails, logout for security
      await handleLogout();
    }
  }, [onLogout, warningTime, onWarning]);

  const handleLogout = useCallback(async () => {
    try {
      // Call custom logout handler if provided (this will handle Supabase signOut)
      if (onLogout) {
        await onLogout();
      } else {
        // Fallback: directly sign out from Supabase
        const { supabase } = await import('@/lib/auth');
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

    // Check immediately
    checkTokenExpiration();
    
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
  }, []);

  // Manual logout function
  const logout = useCallback(async () => {
    await handleLogout();
  }, [handleLogout]);

  useEffect(() => {
    // Only start monitoring if we're on the client side
    if (typeof window !== 'undefined') {
      // Check if there's a valid session before starting monitoring
      const checkInitialSession = async () => {
        try {
          const { supabase } = await import('@/lib/auth');
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            startMonitoring();
          }
        } catch (error) {
          console.error('Error checking initial session:', error);
        }
      };
      
      checkInitialSession();
    }

    return () => {
      stopMonitoring();
    };
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