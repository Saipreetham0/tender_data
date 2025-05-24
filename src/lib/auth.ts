// // src/lib/auth.ts
// import { createClient, PostgrestError } from '@supabase/supabase-js';

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
// const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// export interface UserProfile {
//   id: string;
//   email: string;
//   full_name?: string;
//   avatar_url?: string;
//   organization?: string;
//   phone?: string;
//   preferences?: Record<string, string | number | boolean>;
// }

// export interface AuthUser {
//   id: string;
//   email: string;
//   profile?: UserProfile;
// }

// // Auth helper functions
// export const auth = {
//   // Sign in with magic link
//   signInWithMagicLink: async (email: string) => {
//     const { data, error } = await supabase.auth.signInWithOtp({
//       email,
//       options: {
//         emailRedirectTo: `${window.location.origin}/auth/callback`
//       }
//     });
//     return { data, error };
//   },

//   // Sign in with Google
//   signInWithGoogle: async () => {
//     const { data, error } = await supabase.auth.signInWithOAuth({
//       provider: 'google',
//       options: {
//         redirectTo: `${window.location.origin}/auth/callback`
//       }
//     });
//     return { data, error };
//   },

//   // Sign out
//   signOut: async () => {
//     const { error } = await supabase.auth.signOut();
//     return { error };
//   },

//   // Get current user
//   getCurrentUser: async () => {
//     const { data: { user }, error } = await supabase.auth.getUser();
//     return { user, error };
//   },

//   // Get user profile
//   getUserProfile: async (userId: string): Promise<{ profile: UserProfile | null; error: PostgrestError | null }> => {
//     const { data, error } = await supabase
//       .from('user_profiles')
//       .select('*')
//       .eq('id', userId)
//       .single();

//     return { profile: data, error };
//   },

//   // Update user profile
//   updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
//     const { data, error } = await supabase
//       .from('user_profiles')
//       .update({
//         ...updates,
//         updated_at: new Date().toISOString()
//       })
//       .eq('id', userId)
//       .select()
//       .single();

//     return { data, error };
//   }
// };

// src/lib/auth.ts
import { createClient, PostgrestError } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization?: string;
  phone?: string;
  preferences?: Record<string, string | number | boolean>;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

// Auth helper functions
export const auth = {
  // Sign in with magic link
  signInWithMagicLink: async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Get current user
  getCurrentUser: async () => {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user, error };
  },

  // Get user profile
  //   getUserProfile: async (userId: string): Promise<{ profile: UserProfile | null; error: any }> => {
  getUserProfile: async (
    userId: string
  ): Promise<{ profile: UserProfile | null; error: PostgrestError | null }> => {
    const { data, error } = await supabase
      .from("user_profiles")
      .select("*")
      .eq("id", userId)
      .single();

    return { profile: data, error };
  },

  // Update user profile
  updateProfile: async (userId: string, updates: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    return { data, error };
  },

  // Create user profile (for manual creation if needed)
  createProfile: async (userId: string, profileData: Partial<UserProfile>) => {
    const { data, error } = await supabase
      .from("user_profiles")
      .insert({
        id: userId,
        ...profileData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  },
};
