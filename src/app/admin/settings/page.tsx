"use client";
import React, { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Settings,
  Save,
  RotateCcw,
  Database,
  Mail,
  CreditCard,
  Shield,
  Bell,
  Globe,
  Server,
  Key,
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    contactEmail: string;
    supportEmail: string;
    maxUsersPerPlan: number;
    maintenanceMode: boolean;
    allowNewSignups: boolean;
  };
  email: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    fromAddress: string;
    fromName: string;
    enableEmailNotifications: boolean;
  };
  payment: {
    razorpayKeyId: string;
    razorpayKeySecret: string;
    webhookSecret: string;
    currency: string;
    taxRate: number;
    enableTestMode: boolean;
  };
  security: {
    sessionTimeout: number;
    maxLoginAttempts: number;
    requireEmailVerification: boolean;
    enableTwoFactor: boolean;
    allowedDomains: string[];
    ipWhitelist: string[];
  };
  api: {
    rateLimit: number;
    enableApiLogs: boolean;
    maxRequestSize: number;
    enableCors: boolean;
    allowedOrigins: string[];
  };
  notifications: {
    slackWebhook: string;
    discordWebhook: string;
    enableSystemAlerts: boolean;
    enableUserNotifications: boolean;
    notificationRetentionDays: number;
  };
}

const defaultSettings: SystemSettings = {
  general: {
    siteName: 'RGUKT Tenders Portal',
    siteDescription: 'Government tender notification platform for RGUKT campuses',
    contactEmail: 'info@tendernotify.site',
    supportEmail: 'support@tendernotify.site',
    maxUsersPerPlan: 1000,
    maintenanceMode: false,
    allowNewSignups: true,
  },
  email: {
    smtpHost: 'smtp.resend.com',
    smtpPort: 587,
    smtpUser: 'resend',
    smtpPassword: '',
    fromAddress: 'noreply@tendernotify.site',
    fromName: 'RGUKT Tenders Portal',
    enableEmailNotifications: true,
  },
  payment: {
    razorpayKeyId: '',
    razorpayKeySecret: '',
    webhookSecret: '',
    currency: 'INR',
    taxRate: 18,
    enableTestMode: false,
  },
  security: {
    sessionTimeout: 24,
    maxLoginAttempts: 5,
    requireEmailVerification: true,
    enableTwoFactor: false,
    allowedDomains: [],
    ipWhitelist: [],
  },
  api: {
    rateLimit: 100,
    enableApiLogs: true,
    maxRequestSize: 10,
    enableCors: true,
    allowedOrigins: ['https://tendernotify.site'],
  },
  notifications: {
    slackWebhook: '',
    discordWebhook: '',
    enableSystemAlerts: true,
    enableUserNotifications: true,
    notificationRetentionDays: 30,
  },
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    const loadSettings = async () => {
      try {
        // In a real app, this would fetch from your API
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSettings(defaultSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      // In a real app, this would save to your API
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Settings saved:', settings);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultSettings);
  };

  const updateSetting = (section: keyof SystemSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  if (loading) {
    return (
      <AdminLayout title="System Settings" requiredPermission="system_settings">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2 text-gray-600">Loading settings...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="System Settings" requiredPermission="system_settings">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">System Configuration</h2>
            <p className="text-sm text-gray-600">
              Configure system-wide settings and integrations
            </p>
          </div>
          <div className="flex space-x-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to reset all settings to their default values? 
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-red-600 hover:bg-red-700">
                    Reset Settings
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="general" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>General</span>
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center space-x-2">
              <Mail className="h-4 w-4" />
              <span>Email</span>
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Security</span>
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>API</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-2">
              <Bell className="h-4 w-4" />
              <span>Notifications</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input
                      id="siteName"
                      value={settings.general.siteName}
                      onChange={(e) => updateSetting('general', 'siteName', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={settings.general.contactEmail}
                      onChange={(e) => updateSetting('general', 'contactEmail', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="siteDescription">Site Description</Label>
                  <Textarea
                    id="siteDescription"
                    value={settings.general.siteDescription}
                    onChange={(e) => updateSetting('general', 'siteDescription', e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="supportEmail">Support Email</Label>
                    <Input
                      id="supportEmail"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSetting('general', 'supportEmail', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxUsers">Max Users Per Plan</Label>
                    <Input
                      id="maxUsers"
                      type="number"
                      value={settings.general.maxUsersPerPlan}
                      onChange={(e) => updateSetting('general', 'maxUsersPerPlan', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-gray-500">Temporarily disable access to the site</p>
                    </div>
                    <Switch
                      checked={settings.general.maintenanceMode}
                      onCheckedChange={(checked) => updateSetting('general', 'maintenanceMode', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Allow New Signups</Label>
                      <p className="text-sm text-gray-500">Enable new user registrations</p>
                    </div>
                    <Switch
                      checked={settings.general.allowNewSignups}
                      onCheckedChange={(checked) => updateSetting('general', 'allowNewSignups', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpHost">SMTP Host</Label>
                    <Input
                      id="smtpHost"
                      value={settings.email.smtpHost}
                      onChange={(e) => updateSetting('email', 'smtpHost', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPort">SMTP Port</Label>
                    <Input
                      id="smtpPort"
                      type="number"
                      value={settings.email.smtpPort}
                      onChange={(e) => updateSetting('email', 'smtpPort', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="smtpUser">SMTP Username</Label>
                    <Input
                      id="smtpUser"
                      value={settings.email.smtpUser}
                      onChange={(e) => updateSetting('email', 'smtpUser', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtpPassword">SMTP Password</Label>
                    <Input
                      id="smtpPassword"
                      type="password"
                      value={settings.email.smtpPassword}
                      onChange={(e) => updateSetting('email', 'smtpPassword', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fromAddress">From Address</Label>
                    <Input
                      id="fromAddress"
                      type="email"
                      value={settings.email.fromAddress}
                      onChange={(e) => updateSetting('email', 'fromAddress', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="fromName">From Name</Label>
                    <Input
                      id="fromName"
                      value={settings.email.fromName}
                      onChange={(e) => updateSetting('email', 'fromName', e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Email Notifications</Label>
                    <p className="text-sm text-gray-500">Send automated emails to users</p>
                  </div>
                  <Switch
                    checked={settings.email.enableEmailNotifications}
                    onCheckedChange={(checked) => updateSetting('email', 'enableEmailNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payment" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Gateway Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="razorpayKeyId">Razorpay Key ID</Label>
                    <Input
                      id="razorpayKeyId"
                      value={settings.payment.razorpayKeyId}
                      onChange={(e) => updateSetting('payment', 'razorpayKeyId', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="razorpayKeySecret">Razorpay Key Secret</Label>
                    <Input
                      id="razorpayKeySecret"
                      type="password"
                      value={settings.payment.razorpayKeySecret}
                      onChange={(e) => updateSetting('payment', 'razorpayKeySecret', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="webhookSecret">Webhook Secret</Label>
                    <Input
                      id="webhookSecret"
                      type="password"
                      value={settings.payment.webhookSecret}
                      onChange={(e) => updateSetting('payment', 'webhookSecret', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={settings.payment.currency} onValueChange={(value) => updateSetting('payment', 'currency', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                        <SelectItem value="USD">USD - US Dollar</SelectItem>
                        <SelectItem value="EUR">EUR - Euro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="taxRate">Tax Rate (%)</Label>
                  <Input
                    id="taxRate"
                    type="number"
                    step="0.01"
                    value={settings.payment.taxRate}
                    onChange={(e) => updateSetting('payment', 'taxRate', parseFloat(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable Test Mode</Label>
                    <p className="text-sm text-gray-500">Use test API keys for development</p>
                  </div>
                  <Switch
                    checked={settings.payment.enableTestMode}
                    onCheckedChange={(checked) => updateSetting('payment', 'enableTestMode', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sessionTimeout">Session Timeout (hours)</Label>
                    <Input
                      id="sessionTimeout"
                      type="number"
                      value={settings.security.sessionTimeout}
                      onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Input
                      id="maxLoginAttempts"
                      type="number"
                      value={settings.security.maxLoginAttempts}
                      onChange={(e) => updateSetting('security', 'maxLoginAttempts', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Require Email Verification</Label>
                      <p className="text-sm text-gray-500">Users must verify their email before access</p>
                    </div>
                    <Switch
                      checked={settings.security.requireEmailVerification}
                      onCheckedChange={(checked) => updateSetting('security', 'requireEmailVerification', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable Two-Factor Authentication</Label>
                      <p className="text-sm text-gray-500">Require 2FA for admin accounts</p>
                    </div>
                    <Switch
                      checked={settings.security.enableTwoFactor}
                      onCheckedChange={(checked) => updateSetting('security', 'enableTwoFactor', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="rateLimit">Rate Limit (requests/minute)</Label>
                    <Input
                      id="rateLimit"
                      type="number"
                      value={settings.api.rateLimit}
                      onChange={(e) => updateSetting('api', 'rateLimit', parseInt(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxRequestSize">Max Request Size (MB)</Label>
                    <Input
                      id="maxRequestSize"
                      type="number"
                      value={settings.api.maxRequestSize}
                      onChange={(e) => updateSetting('api', 'maxRequestSize', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable API Logs</Label>
                      <p className="text-sm text-gray-500">Log all API requests and responses</p>
                    </div>
                    <Switch
                      checked={settings.api.enableApiLogs}
                      onCheckedChange={(checked) => updateSetting('api', 'enableApiLogs', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable CORS</Label>
                      <p className="text-sm text-gray-500">Allow cross-origin requests</p>
                    </div>
                    <Switch
                      checked={settings.api.enableCors}
                      onCheckedChange={(checked) => updateSetting('api', 'enableCors', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Notification Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="slackWebhook">Slack Webhook URL</Label>
                    <Input
                      id="slackWebhook"
                      type="url"
                      value={settings.notifications.slackWebhook}
                      onChange={(e) => updateSetting('notifications', 'slackWebhook', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="discordWebhook">Discord Webhook URL</Label>
                    <Input
                      id="discordWebhook"
                      type="url"
                      value={settings.notifications.discordWebhook}
                      onChange={(e) => updateSetting('notifications', 'discordWebhook', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="retentionDays">Notification Retention (days)</Label>
                  <Input
                    id="retentionDays"
                    type="number"
                    value={settings.notifications.notificationRetentionDays}
                    onChange={(e) => updateSetting('notifications', 'notificationRetentionDays', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable System Alerts</Label>
                      <p className="text-sm text-gray-500">Send alerts for system events</p>
                    </div>
                    <Switch
                      checked={settings.notifications.enableSystemAlerts}
                      onCheckedChange={(checked) => updateSetting('notifications', 'enableSystemAlerts', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Enable User Notifications</Label>
                      <p className="text-sm text-gray-500">Send notifications to users</p>
                    </div>
                    <Switch
                      checked={settings.notifications.enableUserNotifications}
                      onCheckedChange={(checked) => updateSetting('notifications', 'enableUserNotifications', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Status */}
        {saving && (
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                <span className="text-blue-800">Saving settings...</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}