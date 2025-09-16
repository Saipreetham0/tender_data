"use client";
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Activity,
  Settings,
  Database,
  Bell,
  BarChart3,
  Shield,
  Cog,
  LogOut,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface AdminSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    permission: 'view_dashboard'
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users,
    permission: 'view_users'
  },
  {
    name: 'Payments',
    href: '/admin/payments',
    icon: CreditCard,
    permission: 'view_payments'
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    permission: 'view_analytics'
  },
  {
    name: 'API Management',
    href: '/admin/api',
    icon: Database,
    permission: 'view_api_logs'
  },
  {
    name: 'Database Tables',
    href: '/admin/tables',
    icon: Database,
    permission: 'view_dashboard'
  },
  {
    name: 'Notifications',
    href: '/admin/notifications', 
    icon: Bell,
    permission: 'view_dashboard'
  },
  {
    name: 'System Health',
    href: '/admin/health',
    icon: Activity,
    permission: 'view_system_logs'
  },
  {
    name: 'API Documentation',
    href: '/admin/api-docs',
    icon: BookOpen,
    permission: 'view_api_logs'
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'system_settings'
  }
];

export function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  const pathname = usePathname();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  return (
    <div className={cn(
      "bg-gray-900 text-white transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="font-bold text-lg">Admin Panel</h1>
                <p className="text-xs text-gray-400">RGUKT Tenders</p>
              </div>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/admin' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors",
                "hover:bg-gray-800 hover:text-white",
                isActive ? "bg-blue-600 text-white" : "text-gray-300",
                collapsed && "justify-center"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && (
                <span className="font-medium">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Button
          variant="ghost"
          onClick={handleSignOut}
          className={cn(
            "w-full justify-start text-gray-300 hover:text-white hover:bg-gray-800",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="ml-3">Sign Out</span>}
        </Button>
      </div>
    </div>
  );
}