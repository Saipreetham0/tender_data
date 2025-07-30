"use client";
import React, { useState } from 'react';
import { AdminGuard } from './AdminGuard';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  requiredPermission?: string;
}

export function AdminLayout({ children, title = "Admin Dashboard", requiredPermission }: AdminLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <AdminGuard requiredPermission={requiredPermission}>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Sidebar */}
        <AdminSidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <AdminHeader title={title} />
          
          {/* Content */}
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </AdminGuard>
  );
}