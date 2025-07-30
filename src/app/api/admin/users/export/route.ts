import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAdminActivity } from '@/lib/admin-auth';
import { supabase } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await requireAdmin(request);
    if (admin instanceof Response) {
      return admin;
    }

    // Fetch users from Supabase auth
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('Error fetching users for export:', error);
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      );
    }

    // Fetch subscriptions
    const { data: subscriptions } = await supabase
      .from('user_subscriptions')
      .select('*');

    // Create CSV content
    const csvHeaders = [
      'ID',
      'Email', 
      'Name',
      'Email Confirmed',
      'Created At',
      'Last Sign In',
      'Subscription Plan',
      'Subscription Status',
      'Status'
    ].join(',');

    const csvRows = users.map(user => {
      const subscription = subscriptions?.find(sub => sub.user_id === user.id);
      const name = user.user_metadata?.name || user.user_metadata?.full_name || '';
      const isActive = user.last_sign_in_at && 
        new Date(user.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const isBanned = user.banned_until && new Date(user.banned_until) > new Date();
      
      const status = isBanned ? 'Banned' : isActive ? 'Active' : 'Inactive';

      return [
        user.id,
        user.email,
        `"${name}"`,
        user.email_confirmed_at ? 'Yes' : 'No',
        user.created_at,
        user.last_sign_in_at || 'Never',
        subscription?.plan_name || 'Free',
        subscription?.status || 'None',
        status
      ].join(',');
    });

    const csvContent = [csvHeaders, ...csvRows].join('\n');

    // Log admin activity
    await logAdminActivity(
      admin.email,
      'export_users',
      'users',
      undefined,
      { count: users.length }
    );

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="users-export-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

  } catch (error) {
    console.error('Error in users export API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}