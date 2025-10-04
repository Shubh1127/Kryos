'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings as SettingsIcon, 
  Building,
  User,
  Shield,
  Bell,
  Database,
  Key,
  Globe,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';

interface CompanySettings {
  name: string;
  email: string;
  contactPerson: string;
  phone: string;
  website: string;
  description: string;
  logo?: string;
}

interface SecuritySettings {
  twoFactorEnabled: boolean;
  apiKeyRotationDays: number;
  maxFailedAttempts: number;
  sessionTimeoutMinutes: number;
  ipWhitelist: string[];
  auditLogRetentionDays: number;
}

interface NotificationSettings {
  emailAlerts: boolean;
  securityAlerts: boolean;
  maintenanceAlerts: boolean;
  weeklyReports: boolean;
  monthlyReports: boolean;
  alertThreshold: 'low' | 'medium' | 'high' | 'critical';
}

interface SystemSettings {
  dataRetentionDays: number;
  backupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
}

export function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    name: 'Demo Company',
    email: 'demo@company.com',
    contactPerson: 'John Doe',
    phone: '+1 (555) 123-4567',
    website: 'https://company.com',
    description: 'A demo company using Kryos security monitoring',
  });

  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorEnabled: true,
    apiKeyRotationDays: 90,
    maxFailedAttempts: 5,
    sessionTimeoutMinutes: 60,
    ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
    auditLogRetentionDays: 365,
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailAlerts: true,
    securityAlerts: true,
    maintenanceAlerts: false,
    weeklyReports: true,
    monthlyReports: true,
    alertThreshold: 'medium',
  });

  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    dataRetentionDays: 180,
    backupEnabled: true,
    backupFrequency: 'daily',
    compressionEnabled: true,
    encryptionEnabled: true,
    logLevel: 'info',
  });

  useEffect(() => {
    // Load settings from API or localStorage
    if (user) {
      setCompanySettings(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email,
      }));
    }
  }, [user]);

  const handleSaveCompanySettings = async () => {
    setLoading(true);
    try {
      // In a real app, save to API
      // await apiService.updateCompanySettings(companySettings);
      
      // Update auth context if needed
      // updateUser(updatedUserData);
      
      alert('Company settings saved successfully');
    } catch (error) {
      console.error('Failed to save company settings:', error);
      alert('Failed to save company settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSecuritySettings = async () => {
    setLoading(true);
    try {
      // await apiService.updateSecuritySettings(securitySettings);
      alert('Security settings saved successfully');
    } catch (error) {
      console.error('Failed to save security settings:', error);
      alert('Failed to save security settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotificationSettings = async () => {
    setLoading(true);
    try {
      // await apiService.updateNotificationSettings(notificationSettings);
      alert('Notification settings saved successfully');
    } catch (error) {
      console.error('Failed to save notification settings:', error);
      alert('Failed to save notification settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setLoading(true);
    try {
      // await apiService.updateSystemSettings(systemSettings);
      alert('System settings saved successfully');
    } catch (error) {
      console.error('Failed to save system settings:', error);
      alert('Failed to save system settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTestNotifications = async () => {
    try {
      alert('Test notification sent! Check your email.');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      alert('Failed to send test notification');
    }
  };

  const addIpToWhitelist = () => {
    const ip = prompt('Enter IP address or CIDR range:');
    if (ip && ip.trim()) {
      setSecuritySettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, ip.trim()],
      }));
    }
  };

  const removeIpFromWhitelist = (index: number) => {
    setSecuritySettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white">System Settings</h2>
        <p className="text-slate-400">Configure your account and system preferences</p>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-800">
          <TabsTrigger value="company" className="data-[state=active]:bg-purple-600">
            <Building className="h-4 w-4 mr-2" />
            Company
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-purple-600">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-purple-600">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-purple-600">
            <Database className="h-4 w-4 mr-2" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription className="text-slate-400">
                Manage your company profile and contact information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={companySettings.name}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyEmail">Company Email</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={companySettings.email}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, email: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    value={companySettings.contactPerson}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, contactPerson: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="companyPhone">Phone Number</Label>
                  <Input
                    id="companyPhone"
                    value={companySettings.phone}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="companyWebsite">Website</Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={companySettings.website}
                    onChange={(e) => setCompanySettings(prev => ({ ...prev, website: e.target.value }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="companyDescription">Description</Label>
                <Textarea
                  id="companyDescription"
                  value={companySettings.description}
                  onChange={(e) => setCompanySettings(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-700 border-slate-600"
                  rows={4}
                />
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveCompanySettings} 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure security policies and access controls
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-slate-400">Require 2FA for all users</p>
                  </div>
                  <Switch
                    checked={securitySettings.twoFactorEnabled}
                    onCheckedChange={(checked) => setSecuritySettings(prev => ({ ...prev, twoFactorEnabled: checked }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="apiKeyRotation">API Key Rotation (days)</Label>
                  <Input
                    id="apiKeyRotation"
                    type="number"
                    value={securitySettings.apiKeyRotationDays}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, apiKeyRotationDays: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="maxFailedAttempts">Max Failed Login Attempts</Label>
                  <Input
                    id="maxFailedAttempts"
                    type="number"
                    value={securitySettings.maxFailedAttempts}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, maxFailedAttempts: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    value={securitySettings.sessionTimeoutMinutes}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, sessionTimeoutMinutes: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="auditLogRetention">Audit Log Retention (days)</Label>
                  <Input
                    id="auditLogRetention"
                    type="number"
                    value={securitySettings.auditLogRetentionDays}
                    onChange={(e) => setSecuritySettings(prev => ({ ...prev, auditLogRetentionDays: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>IP Whitelist</Label>
                    <p className="text-sm text-slate-400">Allowed IP addresses and ranges</p>
                  </div>
                  <Button
                    onClick={addIpToWhitelist}
                    variant="outline"
                    size="sm"
                    className="border-slate-600 hover:bg-slate-700"
                  >
                    Add IP
                  </Button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {securitySettings.ipWhitelist.map((ip, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-slate-700/50 rounded">
                      <span className="font-mono text-sm text-white">{ip}</span>
                      <Button
                        onClick={() => removeIpFromWhitelist(index)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSecuritySettings} 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notification Settings */}
        <TabsContent value="notifications">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Alerts</Label>
                    <p className="text-sm text-slate-400">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, emailAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-slate-400">Get notified of security events</p>
                  </div>
                  <Switch
                    checked={notificationSettings.securityAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, securityAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Maintenance Alerts</Label>
                    <p className="text-sm text-slate-400">System maintenance notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.maintenanceAlerts}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, maintenanceAlerts: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Weekly Reports</Label>
                    <p className="text-sm text-slate-400">Receive weekly analytics reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, weeklyReports: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Monthly Reports</Label>
                    <p className="text-sm text-slate-400">Receive monthly summary reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.monthlyReports}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, monthlyReports: checked }))}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="alertThreshold">Alert Threshold</Label>
                <select
                  id="alertThreshold"
                  value={notificationSettings.alertThreshold}
                  onChange={(e) => setNotificationSettings(prev => ({ ...prev, alertThreshold: e.target.value as any }))}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white mt-2"
                >
                  <option value="low">Low - All alerts</option>
                  <option value="medium">Medium - Important alerts only</option>
                  <option value="high">High - Critical alerts only</option>
                  <option value="critical">Critical - Emergency alerts only</option>
                </select>
              </div>
              
              <div className="flex justify-between">
                <Button
                  onClick={handleTestNotifications}
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-700"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Test Notifications
                </Button>
                <Button 
                  onClick={handleSaveNotificationSettings} 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Settings */}
        <TabsContent value="system">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                System Configuration
              </CardTitle>
              <CardDescription className="text-slate-400">
                Configure system behavior and data management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="dataRetention">Data Retention (days)</Label>
                  <Input
                    id="dataRetention"
                    type="number"
                    value={systemSettings.dataRetentionDays}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, dataRetentionDays: parseInt(e.target.value) }))}
                    className="bg-slate-700 border-slate-600"
                  />
                </div>
                
                <div>
                  <Label htmlFor="logLevel">Log Level</Label>
                  <select
                    id="logLevel"
                    value={systemSettings.logLevel}
                    onChange={(e) => setSystemSettings(prev => ({ ...prev, logLevel: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  >
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                    <option value="debug">Debug</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Automatic Backups</Label>
                    <p className="text-sm text-slate-400">Enable automatic data backups</p>
                  </div>
                  <Switch
                    checked={systemSettings.backupEnabled}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, backupEnabled: checked }))}
                  />
                </div>
                
                {systemSettings.backupEnabled && (
                  <div>
                    <Label htmlFor="backupFrequency">Backup Frequency</Label>
                    <select
                      id="backupFrequency"
                      value={systemSettings.backupFrequency}
                      onChange={(e) => setSystemSettings(prev => ({ ...prev, backupFrequency: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white mt-2"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Compression</Label>
                    <p className="text-sm text-slate-400">Compress stored data to save space</p>
                  </div>
                  <Switch
                    checked={systemSettings.compressionEnabled}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, compressionEnabled: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Data Encryption</Label>
                    <p className="text-sm text-slate-400">Encrypt sensitive data at rest</p>
                  </div>
                  <Switch
                    checked={systemSettings.encryptionEnabled}
                    onCheckedChange={(checked) => setSystemSettings(prev => ({ ...prev, encryptionEnabled: checked }))}
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button 
                  onClick={handleSaveSystemSettings} 
                  disabled={loading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Changes
                </Button>
              </div>
              <div className="pt-6 border-t border-slate-700 flex justify-between items-center flex-col sm:flex-row gap-4">
                <div className="text-left">
                  <p className="text-white font-medium">Logout</p>
                  <p className="text-sm text-slate-400">End your current dashboard session</p>
                </div>
                <Button
                  type="button"
                  onClick={() => {
                    // Clear client auth state
                    if (typeof window !== 'undefined') {
                      localStorage.removeItem('auth_token');
                      localStorage.removeItem('company_id');
                      localStorage.removeItem('company_data');
                    }
                    // Redirect to auth page
                    window.location.href = '/auth';
                  }}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-600/10 hover:text-red-300"
                >
                  Logout
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}