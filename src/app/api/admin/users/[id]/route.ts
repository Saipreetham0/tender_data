import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/admin-auth';
import { supabase } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) {
      return admin;
    }

    const { action } = await request.json();
    const { id: userId } = await params;

    let result;
    let activityAction = '';

    switch (action) {
      case 'ban':
        // Ban user for 30 days
        const banUntil = new Date();
        banUntil.setDate(banUntil.getDate() + 30);
        
        result = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: '30d'
        });
        activityAction = 'ban_user';
        break;

      case 'unban':
        result = await supabase.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        });
        activityAction = 'unban_user';
        break;

      case 'resend_confirmation':
        // Get user first
        const { data: { user } } = await supabase.auth.admin.getUserById(userId);
        if (user?.email) {
          result = await supabase.auth.resend({
            type: 'signup',
            email: user.email
          });
        }
        activityAction = 'resend_confirmation';
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    if (result?.error) {
      console.error(`Error ${action} user:`, result.error);
      return NextResponse.json(
        { error: `Failed to ${action} user` },
        { status: 500 }
      );
    }

    // Log admin activity
    await logAdminActivity(
      admin.email,
      activityAction,
      'user',
      userId,
      { action }
    );

    return NextResponse.json({
      success: true,
      message: `User ${action} successful`
    });

  } catch (error) {
    console.error(`Error in user action API:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}