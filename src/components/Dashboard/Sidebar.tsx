// src/components/Dashboard/Sidebar.tsx
"use client";
import React, { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  User,
  // Settings,
  CreditCard,
  // Search,
  // Download,
  ChevronLeft,
  ChevronRight,
  // Menu,
  X,
  Calendar,
  // Mail,
  LogOut
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  badge?: string;
  isActive?: boolean;
  isPro?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onCloseMobile
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();

  const navigationItems: NavItem[] = [
    {
      icon: LayoutDashboard,
      label: 'Overview',
      href: '/dashboard',
      isActive: pathname === '/dashboard'
    },
    {
      icon: Building2,
      label: 'All Tenders',
      href: '/dashboard/tenders',
      badge: '125',
      isActive: pathname.startsWith('/dashboard/tenders')
    },
    // {
    //   icon: Search,
    //   label: 'Search & Filter',
    //   href: '/dashboard/search',
    //   isActive: pathname.startsWith('/dashboard/search')
    // },
    // {
    //   icon: Calendar,
    //   label: 'Tender Calendar',
    //   href: '/dashboard/calendar',
    //   isActive: pathname.startsWith('/dashboard/calendar')
    // },
    // {
    //   icon: Download,
    //   label: 'Downloads',
    //   href: '/dashboard/downloads',
    //   isActive: pathname.startsWith('/dashboard/downloads')
    // },
    {
      icon: CreditCard,
      label: 'Subscription',
      href: '/dashboard/subscription',
      isActive: pathname.startsWith('/dashboard/subscription')
    }
  ];

  const bottomNavigationItems: NavItem[] = [
    {
      icon: User,
      label: 'Account & Settings',
      href: '/profile',
      isActive: pathname === '/profile' || pathname.startsWith('/dashboard/settings')
    }
  ];

  const handleNavigation = (href: string) => {
    router.push(href);
    onCloseMobile();
  };

  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks

    setIsSigningOut(true);
    try {
      await signOut();
      // signOut function will handle the redirect
    } catch (error) {
      console.error('Sign out error:', error);
      // Force redirect even on error
      window.location.replace('/login?loggedOut=true');
    }
  };

  const SidebarContent = () => (
    <>
      {/* Compact Header */}
      <div className={`border-b border-gray-200 flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-4'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <h1 className="text-sm font-semibold text-gray-800 truncate">RGUKT Hub</h1>
              </div>
            )}
          </div>
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="hidden lg:flex w-6 h-6 p-0 flex-shrink-0"
            >
              <ChevronLeft className="w-3 h-3" />
            </Button>
          )}
        </div>
      </div>

      {/* Compact User Profile */}
      <div className={`border-b border-gray-100 flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        <div className="flex items-center gap-2">
          {user?.profile?.avatar_url ? (
            <Image
              src={user.profile.avatar_url}
              alt="Profile"
              width={32}
              height={32}
              className="w-8 h-8 rounded-full border border-blue-200 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">
                {user?.profile?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
      </div>

      {/* Compact Navigation */}
      <div className={`flex-1 space-y-1 overflow-y-auto ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {navigationItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-left relative group ${
                item.isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'flex-shrink-0'}`} />
              {!isCollapsed && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="ml-auto flex items-center gap-1">
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className={`text-xs px-1.5 py-0.5 ${
                          item.isActive
                            ? 'bg-white/20 text-white border-white/20'
                            : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </div>
                </>
              )}
              {isCollapsed && item.badge && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {item.badge}
                </div>
              )}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}

      </div>

      {/* Compact Bottom Navigation */}
      <div className={`border-t border-gray-200 space-y-1 flex-shrink-0 ${isCollapsed ? 'p-2' : 'p-3'}`}>
        {bottomNavigationItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={() => handleNavigation(item.href)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-left relative group ${
                item.isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-700 hover:bg-blue-50 hover:text-blue-700'
              } ${isCollapsed ? 'justify-center px-2' : ''}`}
            >
              <Icon className={`w-4 h-4 ${isCollapsed ? '' : 'flex-shrink-0'}`} />
              {!isCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isSigningOut}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md transition-all duration-200 text-left relative group ${
            isCollapsed ? 'justify-center px-2' : ''
          } ${
            isSigningOut
              ? 'text-gray-400 bg-gray-50 cursor-not-allowed'
              : 'text-red-600 hover:bg-red-50 hover:text-red-700'
          }`}
        >
          <LogOut className={`w-4 h-4 ${isCollapsed ? '' : 'flex-shrink-0'} ${isSigningOut ? 'animate-spin' : ''}`} />
          {!isCollapsed && (
            <span className="text-sm font-medium">
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </span>
          )}
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
              {isSigningOut ? 'Signing Out...' : 'Sign Out'}
            </div>
          )}
        </button>
      </div>

      {/* Collapse Button (when collapsed) */}
      {isCollapsed && (
        <div className="p-2 border-t border-gray-200 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleCollapse}
            className="w-full h-8 p-0"
          >
            <ChevronRight className="w-3 h-3" />
          </Button>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Desktop Sidebar */}
      <div className={`hidden lg:flex flex-col bg-white border-r border-gray-200 h-screen sticky top-0 transition-all duration-300 shadow-sm ${
        isCollapsed ? 'w-16' : 'w-60'
      }`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed left-0 top-0 h-full w-60 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 shadow-xl ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-600 rounded-lg">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-gray-800">RGUKT Hub</h1>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCloseMobile}
            className="w-6 h-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        <div className="flex flex-col h-full overflow-hidden">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;