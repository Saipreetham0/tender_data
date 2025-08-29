// src/app/api/auth/signin-new/route.ts - New production-ready sign-in API
import { NextRequest, NextResponse } from 'next/server';
import { createApiHandler, AuthError, ValidationError } from '@/infrastructure/errors/error-handler';
import { validateAuth } from '@/infrastructure/security/input-validator';
import { logger, createRequestLogger } from '@/infrastructure/monitoring/logger';
import { supabase } from '@/lib/supabase';

interface SignInRequest {
  email: string;
  password: string;
}

interface SignInResponse {
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      fullName?: string;
      role: string;
    };
    session: {
      accessToken: string;
      refreshToken: string;
      expiresAt: string;
    };
  };
}

async function handleSignIn(request: NextRequest): Promise<NextResponse<SignInResponse>> {
  const requestId = request.headers.get('x-request-id') || 'unknown';
  const requestLogger = createRequestLogger(requestId);
  const startTime = Date.now();

  try {
    // 1. Parse and validate request body
    const body = await request.json();
    const validatedInput = validateAuth.signIn(body);
    
    requestLogger.logRequest('POST', '/api/auth/signin-new', {
      email: validatedInput.email, // Safe to log email
    });

    // 2. Rate limiting is handled by middleware
    
    // 3. Authenticate with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validatedInput.email,
      password: validatedInput.password,
    });

    if (authError) {
      requestLogger.logAuthEvent('sign_in_failed', undefined, {
        email: validatedInput.email,
        errorMessage: authError.message,
      });
      
      throw new AuthError('Invalid credentials', {
        supabaseError: authError.message,
      });
    }

    if (!authData.user || !authData.session) {
      throw new AuthError('Authentication failed - no user or session returned');
    }

    // 4. Get or create user profile
    let userProfile = null;
    try {
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .maybeSingle();

      if (profileError) {
        requestLogger.warn('Failed to fetch user profile', {
          userId: authData.user.id,
          errorMessage: profileError.message,
        });
      } else {
        userProfile = profile;
      }

      // Create profile if it doesn't exist
      if (!userProfile) {
        const { data: newProfile, error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            full_name: authData.user.user_metadata?.full_name || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (createError) {
          requestLogger.warn('Failed to create user profile', {
            userId: authData.user.id,
            errorMessage: createError.message,
          });
        } else {
          userProfile = newProfile;
          requestLogger.info('Profile created for user', {
            userId: authData.user.id,
            email: authData.user.email,
            event: 'profile_created'
          });
        }
      }
    } catch (profileError) {
      // Profile errors shouldn't prevent sign-in
      requestLogger.warn('Profile operation failed', {
        userId: authData.user.id,
        errorData: profileError,
      });
    }

    // 5. Log successful authentication
    requestLogger.logAuthEvent('sign_in_success', authData.user.id, {
      email: authData.user.email,
      hasProfile: !!userProfile,
    });

    // 6. Prepare response
    const duration = Date.now() - startTime;
    const response: SignInResponse = {
      success: true,
      data: {
        user: {
          id: authData.user.id,
          email: authData.user.email!,
          fullName: userProfile?.full_name || authData.user.user_metadata?.full_name || undefined,
          role: userProfile?.role || 'user',
        },
        session: {
          accessToken: authData.session.access_token,
          refreshToken: authData.session.refresh_token,
          expiresAt: new Date(authData.session.expires_at! * 1000).toISOString(),
        },
      },
    };

    // 7. Log response
    requestLogger.logResponse('POST', '/api/auth/signin-new', 200, duration, {
      userId: authData.user.id,
    });

    // 8. Set secure cookies (optional - depending on auth strategy)
    const nextResponse = NextResponse.json(response);
    
    // Set httpOnly cookie for refresh token (more secure)
    if (process.env.NODE_ENV === 'production') {
      nextResponse.cookies.set('refresh_token', authData.session.refresh_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });
    }

    return nextResponse;

  } catch (error) {
    const duration = Date.now() - startTime;
    
    // Log error response
    const statusCode = error instanceof AuthError ? 401 : 500;
    requestLogger.logResponse('POST', '/api/auth/signin-new', statusCode, duration, {
      errorMessage: error instanceof Error ? error.message : String(error),
    });

    // Re-throw to let error handler deal with it
    throw error;
  }
}

// Export handlers with error handling
export const { POST } = createApiHandler({
  POST: handleSignIn,
});

// Export for testing (only in development)
if (process.env.NODE_ENV !== 'production') {
  module.exports.handleSignIn = handleSignIn;
}