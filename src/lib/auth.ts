// Supabase Auth Integration
import { supabase } from './supabase';
import { AuthError, Session, User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization?: string;
  phone?: string;
  preferences?: Record<string, string | number | boolean>;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

// Auth helper functions
export const authService = {
  // Sign in with magic link
  signInWithMagicLink: async (email: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign in with Google OAuth
  signInWithGoogle: async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      return { user, error };
    } catch (error) {
      return { user: null, error };
    }
  },

  // Get user profile
  getUserProfile: async (userId: string): Promise<{ profile: UserProfile | null; error: any }> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return { profile: null, error };
      }

      return { profile: data, error: null };
    } catch (error) {
      return { profile: null, error };
    }
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Create user profile
  createProfile: async (userId: string, profileData: Partial<UserProfile>) => {
    try {
      const profile = {
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profile])
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }
};

// Export Supabase auth for backward compatibility
export { supabase } from './supabase';

// Default export
export default authService;