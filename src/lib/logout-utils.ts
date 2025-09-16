// src/lib/logout-utils.ts - Comprehensive logout utilities

/**
 * Force clear all authentication data from browser
 * This is a utility function that can be called manually if logout gets stuck
 */
export const forceLogoutCleanup = () => {
  try {
    // Clear all localStorage
    if (typeof window !== 'undefined') {
      const localStorageKeys = [
        'supabase.auth.token',
        'supabase-auth-token',
        'auth-token',
        'session',
        'jwt-token',
        'sb-access-token',
        'sb-refresh-token'
      ];

      localStorageKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove localStorage key: ${key}`, e);
        }
      });

      // Clear all sessionStorage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('Failed to clear sessionStorage', e);
      }

      // Clear all cookies with different domain/path combinations
      const cookiesToClear = [
        'supabase-auth-token',
        'supabase.auth.token',
        'auth-token',
        'session',
        'jwt-token',
        'sb-access-token',
        'sb-refresh-token'
      ];

      cookiesToClear.forEach(cookieName => {
        // Multiple approaches to ensure cookie deletion
        const expireDate = 'Thu, 01 Jan 1970 00:00:00 GMT';

        // Clear for current domain and path
        document.cookie = `${cookieName}=; expires=${expireDate}; path=/`;

        // Clear for current domain with subdomain
        document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=${window.location.hostname}`;

        // Clear for parent domain
        const parts = window.location.hostname.split('.');
        if (parts.length > 1) {
          const parentDomain = '.' + parts.slice(-2).join('.');
          document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=${parentDomain}`;
        }

        // Clear for root path
        document.cookie = `${cookieName}=; expires=${expireDate}; path=/; domain=`;

        // Clear for different paths that might be used
        const pathsToTry = ['/', '/dashboard', '/login', '/auth'];
        pathsToTry.forEach(path => {
          document.cookie = `${cookieName}=; expires=${expireDate}; path=${path}`;
        });
      });

      console.log('Force logout cleanup completed');
      return true;
    }
  } catch (error) {
    console.error('Force logout cleanup failed:', error);
    return false;
  }
};

/**
 * Check if user appears to be logged in based on browser storage
 */
export const checkAuthState = () => {
  if (typeof window === 'undefined') return false;

  const authIndicators = [
    'supabase.auth.token',
    'supabase-auth-token',
    'auth-token',
    'session',
    'jwt-token'
  ];

  // Check localStorage
  const hasLocalStorageAuth = authIndicators.some(key => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  });

  // Check cookies
  const hasCookieAuth = authIndicators.some(cookieName => {
    return document.cookie.includes(`${cookieName}=`);
  });

  return hasLocalStorageAuth || hasCookieAuth;
};

/**
 * Manual logout function that can be called from browser console
 * Usage: window.forceLogout()
 */
if (typeof window !== 'undefined') {
  (window as any).forceLogout = () => {
    forceLogoutCleanup();
    window.location.replace('/login?forceLogout=true');
  };

  (window as any).checkAuthState = checkAuthState;
}

export default forceLogoutCleanup;