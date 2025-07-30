"use client";
import React from 'react';
import { AdminDebug } from '@/components/admin/AdminDebug';

export default function AdminDebugPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Admin Access Debug
          </h1>
          <p className="text-gray-600">
            Use this page to check your admin access status and troubleshoot login issues.
          </p>
        </div>
        
        <AdminDebug />
      </div>
    </div>
  );
}