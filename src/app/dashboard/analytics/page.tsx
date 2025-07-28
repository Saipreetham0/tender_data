// src/app/dashboard/analytics/page.tsx
"use client";
import React from "react";
import { AuthGuard } from "@/components/AuthComponents";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, TrendingUp, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  return (
    <AuthGuard>
      <DashboardLayout
        title="Analytics"
        subtitle="Advanced insights and reporting for tender data"
        actions={
          <Button size="sm" className="bg-gradient-to-r from-amber-500 to-orange-500">
            <Crown className="w-4 h-4 mr-2" />
            Upgrade to Pro
          </Button>
        }
      >
        <div className="space-y-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Advanced Analytics</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-gray-600 mb-6">
                Get detailed insights into tender trends, success rates, and performance metrics across all campuses.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg border">
                  <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Trend Analysis</h3>
                  <p className="text-sm text-gray-600">Track tender patterns over time</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <BarChart3 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Performance Metrics</h3>
                  <p className="text-sm text-gray-600">Detailed success rate analysis</p>
                </div>
                <div className="p-4 bg-white rounded-lg border">
                  <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                  <h3 className="font-semibold">Custom Reports</h3>
                  <p className="text-sm text-gray-600">Generate customized analytics</p>
                </div>
              </div>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600">
                <Crown className="w-4 h-4 mr-2" />
                Upgrade to Access Analytics
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}