import { NextRequest, NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin-auth';
import { supabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Get the session to verify admin status
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userIsAdmin = await isAdmin(session.user.email);
    
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: 'Not authorized' },
        { status: 403 }
      );
    }

    // In a real implementation, you would query your notifications table
    // For now, return a mock count
    const mockNotificationCount = Math.floor(Math.random() * 10);
    
    return NextResponse.json({
      count: mockNotificationCount,
      success: true
    });

  } catch (error) {
    console.error('Error fetching notification count:', error);
    return NextResponse.json(
      { error: 'Internal server error', count: 0 },
      { status: 500 }
    );
  }
}