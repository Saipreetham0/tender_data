// src/lib/auth-service.ts - Production-level authentication service
import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

export interface AuthUser {
  id: string;
  email: string;
  email_verified?: boolean;
  phone?: string;
  phone_verified?: boolean;
  user_metadata?: Record<string, any>;
  app_metadata?: Record<string, any>;
  profile?: UserProfile;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization?: string;
  phone?: string;
  role: 'user' | 'admin';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'expired';
  subscription_plan?: string;
  subscription_expires_at?: string;
  preferences: Record<string, any>;
  email_verified: boolean;
  phone_verified: boolean;
  two_factor_enabled: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  data?: any;
  error?: Error | null;
  success: boolean;
  message?: string;
}

class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  // Get current session
  async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      return { data: session, error, success: !error };
    } catch (error) {
      console.error('Session fetch error:', error);
      return { data: null, error: error as Error, success: false };
    }
  }

  // Sign in with email (magic link)
  async signInWithMagicLink(email: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email,
            sign_in_method: 'magic_link'
          }
        },
      });

      if (error) throw error;

      return {
        data,
        success: true,
        message: 'Magic link sent to your email'
      };
    } catch (error) {
      console.error('Magic link error:', error);
      return {
        error: error as Error,
        success: false,
        message: 'Failed to send magic link'
      };
    }
  }

  // Sign in with Google OAuth
  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;

      return {
        data,
        success: true,
        message: 'Redirecting to Google...'
      };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return {
        error: error as Error,
        success: false,
        message: 'Failed to sign in with Google'
      };
    }
  }

  // Sign out
  async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) throw error;

      // Clear any local storage or cached data
      localStorage.removeItem('user-preferences');
      sessionStorage.clear();

      return {
        success: true,
        message: 'Signed out successfully'
      };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        error: error as Error,
        success: false,
        message: 'Failed to sign out'
      };
    }
  }

  // Get or create user profile
  async getOrCreateProfile(user: any): Promise<{ profile: UserProfile | null; error: Error | null }> {
    try {
      if (!user?.id || !user?.email) {
        throw new Error('Invalid user data');
      }

      // First, try to get existing profile
      const profileResponse = await fetch(`/api/auth/profile?userId=${user.id}`);
      const profileData = await profileResponse.json();

      if (profileData.success && profileData.profile) {
        return { profile: profileData.profile, error: null };
      }

      // Profile doesn't exist, create one
      const createResponse = await fetch('/api/auth/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user,
          profileData: {
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
          }
        }),
      });

      const createData = await createResponse.json();

      if (!createData.success) {
        throw new Error(createData.error || 'Failed to create profile');
      }

      return { profile: createData.profile, error: null };

    } catch (error) {
      console.error('Profile management error:', error);
      return { profile: null, error: error as Error };
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<AuthResponse> {
    try {
      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          updates
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error);
      }

      return {
        data: data.profile,
        success: true,
        message: 'Profile updated successfully'
      };

    } catch (error) {
      console.error('Profile update error:', error);
      return {
        error: error as Error,
        success: false,
        message: 'Failed to update profile'
      };
    }
  }

  // Change password
  async changePassword(newPassword: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return {
        data,
        success: true,
        message: 'Password updated successfully'
      };
    } catch (error) {
      console.error('Password change error:', error);
      return {
        error: error as Error,
        success: false,
        message: 'Failed to change password'
      };
    }
  }

  // Update email
  async updateEmail(newEmail: string): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (error) throw error;

      return {
        data,
        success: true,
        message: 'Email update initiated. Please check your new email for confirmation.'
      };
    } catch (error) {
      console.error('Email update error:', error);
      return {
        error: error as Error,
        success: false,
        message: 'Failed to update email'
      };
    }
  }

  // Listen to auth state changes
  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  // Get Supabase client (for advanced usage)
  getClient() {
    return supabase;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();
export { supabase };
export default authService;