// src/components/Dashboard/DashboardLayout.tsx
"use client";
import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Button } from '@/components/ui/button';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  hideNavbar?: boolean;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title = "Dashboard",
  subtitle,
  actions,
  hideNavbar = false
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileSidebarOpen(!mobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={toggleSidebar}
        isMobileOpen={mobileSidebarOpen}
        onCloseMobile={closeMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navigation Bar */}
        {!hideNavbar && (
          <header className="bg-white border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
              {/* Left Side */}
              <div className="flex items-center gap-4">
                {/* Mobile Menu Button */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMobileSidebar}
                  className="lg:hidden w-10 h-10 p-0"
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Page Title */}
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">{title}</h1>
                  {subtitle && (
                    <p className="text-sm text-gray-500 mt-1 truncate">{subtitle}</p>
                  )}
                </div>
              </div>

              {/* Right Side */}
              <div className="flex items-center gap-2 sm:gap-4">
                {/* Search Bar */}
                <div className="hidden md:flex relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tenders..."
                    className="pl-10 pr-4 py-2 w-64 lg:w-80 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors text-sm"
                  />
                </div>

                {/* Notifications */}
                <Button variant="ghost" size="sm" className="relative w-10 h-10 p-0">
                  <Bell className="w-5 h-5" />
                  <Badge
                    variant="destructive"
                    className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-xs"
                  >
                    3
                  </Badge>
                </Button>

                {/* User Avatar */}
                <div className="flex items-center gap-2 sm:gap-3">
                  {user?.profile?.avatar_url ? (
                    <Image
                      src={user.profile.avatar_url}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className="hidden sm:block min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">
                      {user?.profile?.full_name || user?.email?.split('@')[0] || 'User'}
                    </p>
                  </div>
                </div>

                {/* Custom Actions */}
                {actions && (
                  <div className="flex items-center gap-2">
                    {actions}
                  </div>
                )}
              </div>
            </div>
          </header>
        )}

        {/* Mobile Menu Button (when navbar is hidden) */}
        {hideNavbar && (
          <div className="lg:hidden p-4 bg-white border-b border-gray-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleMobileSidebar}
              className="w-10 h-10 p-0"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;