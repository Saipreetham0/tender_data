import { NextRequest, NextResponse } from 'next/server';
import { getAdminRole } from '@/lib/admin-auth';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client with cookies for server-side auth
    const cookieStore = cookies();
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );

    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.user?.email) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Check admin role from database
    const adminRole = await getAdminRole(session.user.email);
    
    if (!adminRole || !adminRole.is_active) {
      return NextResponse.json(
        { isAdmin: false, error: 'Not authorized' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      isAdmin: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: adminRole.role
      },
      permissions: adminRole.permissions
    });

  } catch (error) {
    console.error('Admin verification error:', error);
    return NextResponse.json(
      { isAdmin: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}