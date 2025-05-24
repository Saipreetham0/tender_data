// // src/contexts/AuthContext.tsx
// 'use client';
// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { AuthError, Provider, Session, User } from '@supabase/supabase-js';
// import { supabase, AuthUser, UserProfile, auth } from '@/lib/auth';

// interface AuthContextType {
//   user: AuthUser | null;
//   loading: boolean;
//   signInWithMagicLink: (email: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
//   signInWithGoogle: () => Promise<{ data: { provider: Provider; url: string } | { provider: Provider; url: null }; error: AuthError | null }>;
//   signOut: () => Promise<void>;
//   updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: Error | null }>;
//   refreshProfile: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [user, setUser] = useState<AuthUser | null>(null);
//   const [loading, setLoading] = useState(true);

//   const loadUserProfile = async (authUser: User) => {
//     try {
//       const { profile, error } = await auth.getUserProfile(authUser.id);

//       if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
//         console.error('Error loading user profile:', error);
//       }

//       setUser({
//         id: authUser.id,
//         email: authUser.email!,
//         profile: profile || undefined
//       });
//     } catch (error) {
//       console.error('Error in loadUserProfile:', error);
//       setUser({
//         id: authUser.id,
//         email: authUser.email!
//       });
//     }
//   };

//   useEffect(() => {
//     // Get initial session
//     const getInitialSession = async () => {
//       const { data: { session } } = await supabase.auth.getSession();

//       if (session?.user) {
//         await loadUserProfile(session.user);
//       }

//       setLoading(false);
//     };

//     getInitialSession();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         if (session?.user) {
//           await loadUserProfile(session.user);
//         } else {
//           setUser(null);
//         }
//         setLoading(false);
//       }
//     );

//     return () => subscription.unsubscribe();
//   }, []);

//   const signInWithMagicLink = async (email: string) => {
//     return await auth.signInWithMagicLink(email);
//   };

//   const signInWithGoogle = async () => {
//     return await auth.signInWithGoogle();
//   };

//   const signOut = async () => {
//     await auth.signOut();
//     setUser(null);
//   };

//   const updateProfile = async (updates: Partial<UserProfile>) => {
//     if (!user) throw new Error('No user logged in');

//     const result = await auth.updateProfile(user.id, updates);

//     if (!result.error) {
//       setUser(prev => prev ? {
//         ...prev,
//         profile: { ...prev.profile, ...updates } as UserProfile
//       } : null);
//     }

//     return result;
//   };

//   const refreshProfile = async () => {
//     if (!user) return;

//     const { profile } = await auth.getUserProfile(user.id);
//     setUser(prev => prev ? { ...prev, profile: profile || undefined } : null);
//   };

//   return (
//     <AuthContext.Provider value={{
//       user,
//       loading,
//       signInWithMagicLink,
//       signInWithGoogle,
//       signOut,
//       updateProfile,
//       refreshProfile
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }


// src/contexts/AuthContext.tsx - Improved version with better error handling
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthError, Provider, Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/auth';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  organization?: string;
  phone?: string;
  preferences?: Record<string, string | number | boolean | null>;
}

export interface AuthUser {
  id: string;
  email: string;
  profile?: UserProfile;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
//   signInWithMagicLink: (email: string) => Promise<{ data: any; error: any }>;
//   signInWithGoogle: () => Promise<{ data: any; error: any }>;
//   signOut: () => Promise<void>;
//   updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: any; error: any }>;
//   refreshProfile: () => Promise<void>;

  signInWithMagicLink: (email: string) => Promise<{ data: { user: User | null; session: Session | null } | null; error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ data: { provider: Provider; url: string } | { provider: Provider; url: null }; error: AuthError | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ data: UserProfile | null; error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserProfile = async (authUser: User) => {
    try {
      // First, try to get existing profile
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist, create one
        console.log('Creating user profile for:', authUser.email);

        const newProfile = {
          id: authUser.id,
          email: authUser.email!,
          full_name: authUser.user_metadata?.full_name ||
                    authUser.user_metadata?.name ||
                    authUser.email?.split('@')[0],
          avatar_url: authUser.user_metadata?.avatar_url
        };

        const { data: createdProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (createError) {
          console.error('Error creating user profile:', createError);
          // Still set user without profile
          setUser({
            id: authUser.id,
            email: authUser.email!
          });
        } else {
          setUser({
            id: authUser.id,
            email: authUser.email!,
            profile: createdProfile
          });
        }
      } else if (error) {
        console.error('Error loading user profile:', error);
        // Set user without profile
        setUser({
          id: authUser.id,
          email: authUser.email!
        });
      } else {
        // Profile exists
        setUser({
          id: authUser.id,
          email: authUser.email!,
          profile
        });
      }
    } catch (error) {
      console.error('Error in loadUserProfile:', error);
      // Fallback - set user without profile
      setUser({
        id: authUser.id,
        email: authUser.email!
      });
    }
  };

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
        }

        if (session?.user) {
          await loadUserProfile(session.user);
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);

        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          setUser(null);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithMagicLink = async (email: string) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) throw new Error('No user logged in');

    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single();

    if (!error) {
      setUser(prev => prev ? {
        ...prev,
        profile: { ...prev.profile, ...updates } as UserProfile
      } : null);
    }

    return { data, error };
  };

  const refreshProfile = async () => {
    if (!user) return;

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profile) {
      setUser(prev => prev ? { ...prev, profile } : null);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signInWithMagicLink,
      signInWithGoogle,
      signOut,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}