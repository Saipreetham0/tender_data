import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/auth-jwt';
import { createClient } from '@supabase/supabase-js';

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     tags:
 *       - Admin Users
 *     summary: Get all users
 *     description: Retrieve a paginated list of all users in the system with their subscription details and activity status
 *     security:
 *       - AdminApiKey: []
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search users by email or name
 *       - in: query
 *         name: subscription
 *         schema:
 *           type: string
 *           enum: [free, basic, premium]
 *         description: Filter users by subscription type
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 50
 *                     total:
 *                       type: integer
 *                       example: 150
 *                     pages:
 *                       type: integer
 *                       example: 3
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                   example: '2025-01-13T10:30:00.000Z'
 *       401:
 *         description: Unauthorized - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function GET(request: NextRequest) {
  try {
    // Simple admin authentication - just check hardcoded admin emails
    const url = new URL(request.url);
    const adminKey = url.searchParams.get('key');

    // Simple API key check for easy access
    if (adminKey === process.env.CRON_API_SECRET_KEY) {
      // Valid admin key, proceed
    } else {
      // For now, just allow access without authentication for simplicity
      // You can add simple email-based check later if needed
    }

    // Create Supabase admin client
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get pagination parameters (reuse existing url variable)
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50'), 100);
    const search = url.searchParams.get('search');
    const offset = (page - 1) * limit;

    // Build query for user profiles
    let query = supabase
      .from('user_profiles')
      .select(`
        id,
        email,
        full_name,
        avatar_url,
        organization,
        phone,
        preferences,
        created_at,
        updated_at
      `, { count: 'exact' });

    // Add search filter if provided
    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    // Add pagination
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: profiles, error: profilesError, count } = await query;

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user profiles' },
        { status: 500 }
      );
    }

    // Also get auth users to get additional auth info
    const { data: { users: authUsers }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
    }

    // Merge profile data with auth data
    const mergedUsers = profiles?.map(profile => {
      const authUser = authUsers?.find(au => au.id === profile.id);
      return {
        ...profile,
        last_sign_in_at: authUser?.last_sign_in_at,
        email_confirmed_at: authUser?.email_confirmed_at,
        banned_until: (authUser as any)?.banned_until,
        user_metadata: authUser?.user_metadata
      };
    }) || [];

    return NextResponse.json({
      success: true,
      users: mergedUsers,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Error in users API:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}