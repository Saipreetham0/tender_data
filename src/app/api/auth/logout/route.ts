import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { sessionCache } from '@/lib/session-cache'
import { createRateLimitMiddleware } from '@/lib/rate-limiter'

const rateLimitCheck = createRateLimitMiddleware('AUTH')

export async function POST(request: Request) {
  // Apply rate limiting
  const clientIP = request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown'

  const rateLimitResult = await rateLimitCheck(request, clientIP)
  if (rateLimitResult) {
    return rateLimitResult
  }

  try {
    const { userId } = await request.json()

    if (userId) {
      // Clear Redis cache for user session and subscription data
      await Promise.all([
        sessionCache.deleteSession(userId),
        sessionCache.deleteSubscription(userId)
      ])
    }

    // Clear auth cookies
    const cookieStore = await cookies()

    // Clear all possible auth-related cookies
    const authCookies = [
      'supabase-auth-token',
      'supabase.auth.token',
      'auth-token',
      'session',
      'jwt-token',
      'sb-access-token',
      'sb-refresh-token'
    ]

    authCookies.forEach(cookieName => {
      // Clear with different path and domain combinations
      cookieStore.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
        httpOnly: false, // Allow client-side clearing too
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })

      // Also clear with httpOnly: true for server-side cookies
      cookieStore.set({
        name: cookieName,
        value: '',
        expires: new Date(0),
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      })
    })

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully'
    })

  } catch (error) {
    console.error('Logout error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to logout properly'
      },
      { status: 500 }
    )
  }
}