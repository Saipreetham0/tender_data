// src/app/dashboard/notifications/page.tsx
"use client";
import React from "react";
import { AuthGuard } from "@/components/AuthComponents";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Settings, Mail, Smartphone, AlertTriangle, Calendar } from "lucide-react";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "New Tender Posted - RK Valley",
      message: "Construction of Laboratory Equipment for Physics Department",
      time: "2 hours ago",
      type: "new",
      read: false
    },
    {
      id: 2,
      title: "Tender Closing Soon",
      message: "Supply of Computer Systems - Closes in 2 days",
      time: "5 hours ago", 
      type: "urgent",
      read: false
    },
    {
      id: 3,
      title: "Weekly Summary",
      message: "15 new tenders posted this week across all campuses",
      time: "1 day ago",
      type: "summary",
      read: true
    }
  ];

  return (
    <AuthGuard>
      <DashboardLayout
        title="Notifications"
        subtitle="Stay updated with the latest tender announcements"
        actions={
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                Notification Preferences
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-5 h-5 text-blue-500" />
                    <h3 className="font-semibold">Email Notifications</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Get notified via email when new tenders are posted
                  </p>
                  <Button size="sm" variant="outline">Configure Email</Button>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Smartphone className="w-5 h-5 text-green-500" />
                    <h3 className="font-semibold">Push Notifications</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Receive instant notifications on your devices
                  </p>
                  <Button size="sm" variant="outline">Enable Push</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Notifications</CardTitle>
                <Badge variant="secondary">
                  {notifications.filter(n => !n.read).length} unread
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border transition-colors ${
                      notification.read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          notification.type === 'urgent' ? 'bg-red-100' :
                          notification.type === 'new' ? 'bg-blue-100' : 'bg-gray-100'
                        }`}>
                          {notification.type === 'urgent' ? (
                            <AlertTriangle className="w-4 h-4 text-red-600" />
                          ) : notification.type === 'new' ? (
                            <Bell className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Calendar className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <h4 className={`font-semibold ${!notification.read ? 'text-gray-900' : 'text-gray-600'}`}>
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}