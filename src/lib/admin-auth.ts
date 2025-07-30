import { NextRequest } from 'next/server';
import { supabase } from './auth';

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'super_admin' | 'moderator';
  permissions: string[];
}

export interface AdminRole {
  id: string;
  user_id: string | null;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: any;
  description: string | null;
  category: string;
  is_public: boolean;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Check if user is admin using database
export async function isAdmin(email: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('is_active')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error checking admin status:', error);
      return false;
    }

    return data?.is_active === true;
  } catch (error) {
    console.error('Error in isAdmin:', error);
    return false;
  }
}

// Get admin role and permissions from database
export async function getAdminRole(email: string): Promise<AdminRole | null> {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('email', email.toLowerCase())
      .eq('is_active', true)
      .single();

    if (error) {
      console.error('Error fetching admin role:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error in getAdminRole:', error);
    return null;
  }
}

// Get admin permissions from database
export async function getAdminPermissions(email: string): Promise<string[]> {
  try {
    const adminRole = await getAdminRole(email);
    return adminRole?.permissions || [];
  } catch (error) {
    console.error('Error getting admin permissions:', error);
    return [];
  }
}

export async function verifyAdminAuth(request: NextRequest): Promise<AdminUser | null> {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user || !user.email) {
      return null;
    }

    const adminRole = await getAdminRole(user.email);
    if (!adminRole || !adminRole.is_active) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: adminRole.role,
      permissions: adminRole.permissions
    };
  } catch (error) {
    console.error('Admin auth verification error:', error);
    return null;
  }
}

export async function requireAdmin(request: NextRequest) {
  const admin = await verifyAdminAuth(request);
  
  if (!admin) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized - Admin access required' }),
      { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  return admin;
}

export function hasPermission(admin: AdminUser, permission: string): boolean {
  return admin.permissions.includes(permission);
}

// Log admin activity
export async function logAdminActivity(
  adminEmail: string,
  action: string,
  targetType?: string,
  targetId?: string,
  details?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_email: adminEmail,
        action,
        target_type: targetType || null,
        target_id: targetId || null,
        details: details || {},
        ip_address: ipAddress || null,
        user_agent: userAgent || null
      });

    if (error) {
      console.error('Error logging admin activity:', error);
    }
  } catch (error) {
    console.error('Error in logAdminActivity:', error);
  }
}

// Get all admin roles (for management)
export async function getAllAdminRoles(): Promise<AdminRole[]> {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching admin roles:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllAdminRoles:', error);
    return [];
  }
}

// Create new admin role
export async function createAdminRole(
  email: string,
  role: 'super_admin' | 'admin' | 'moderator',
  permissions: string[],
  createdBy: string
): Promise<AdminRole | null> {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .insert({
        email: email.toLowerCase(),
        role,
        permissions,
        created_by: createdBy,
        is_active: true
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating admin role:', error);
      return null;
    }

    // Log the activity
    await logAdminActivity(
      createdBy,
      'create_admin',
      'admin_role',
      data.id,
      { email, role, permissions }
    );

    return data;
  } catch (error) {
    console.error('Error in createAdminRole:', error);
    return null;
  }
}

// Update admin role
export async function updateAdminRole(
  id: string,
  updates: Partial<Pick<AdminRole, 'role' | 'permissions' | 'is_active'>>,
  updatedBy: string
): Promise<AdminRole | null> {
  try {
    const { data, error } = await supabase
      .from('admin_roles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating admin role:', error);
      return null;
    }

    // Log the activity
    await logAdminActivity(
      updatedBy,
      'update_admin',
      'admin_role',
      id,
      updates
    );

    return data;
  } catch (error) {
    console.error('Error in updateAdminRole:', error);
    return null;
  }
}

// Delete admin role
export async function deleteAdminRole(id: string, deletedBy: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('admin_roles')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting admin role:', error);
      return false;
    }

    // Log the activity
    await logAdminActivity(
      deletedBy,
      'delete_admin',
      'admin_role',
      id
    );

    return true;
  } catch (error) {
    console.error('Error in deleteAdminRole:', error);
    return false;
  }
}