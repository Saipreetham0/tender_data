import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const cookieStore = await cookies()

    // Check for various auth cookies
    const authToken = cookieStore.get('supabase-auth-token')?.value ||
                     cookieStore.get('supabase.auth.token')?.value ||
                     cookieStore.get('auth-token')?.value

    if (!authToken) {
      return NextResponse.json({ authenticated: false })
    }

    // Try to get current session from Supabase
    const { data: { session }, error } = await supabase.auth.getSession()

    if (error || !session) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email
      }
    })

  } catch (error) {
    console.error('Session check error:', error)
    return NextResponse.json({ authenticated: false })
  }
}