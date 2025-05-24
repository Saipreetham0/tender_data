// src/app/dashboard/page.tsx
'use client';
import React from 'react';
import { AuthGuard } from '@/components/AuthComponents';
// import TenderDashboard from '@/components/Dashboard';

export default function DashboardPage() {
  return (
    <AuthGuard>
      {/* <TenderDashboard /> */}
      <div className="min-h-screen bg-gray-50 py-8">
        <h1 className="text-2xl font-bold text-center mb-8 mt-24">Welcome to the Dashboard</h1>
      </div>
    </AuthGuard>
  );
}