// src/app/dashboard/tenders/page.tsx
"use client";
import React, { useState } from "react";
import { AuthGuard } from "@/components/AuthComponents";
import Sidebar from "@/components/Dashboard/Sidebar";
import TenderDashboard from "@/components/Dashboard";

export default function TendersPage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(!sidebarCollapsed);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar 
          isCollapsed={sidebarCollapsed} 
          onToggleCollapse={toggleSidebar} 
          isMobileOpen={mobileSidebarOpen} 
          onCloseMobile={closeMobileSidebar} 
        />
        <div className="flex-1 flex flex-col min-w-0">
          <main className="flex-1 overflow-auto">
            <TenderDashboard />
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}