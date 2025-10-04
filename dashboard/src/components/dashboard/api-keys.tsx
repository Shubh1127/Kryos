'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Key,
  Copy,
  Plus,
  Eye,
  EyeOff,
  Trash2,
  Edit,
  Shield,
  Activity
} from 'lucide-react';
import { apiService, ApiKey } from '@/lib/api';
import { CompanySetup } from './company-setup';

interface CreateApiKeyData {
  name: string;
  description: string;
  permissions: string[];
  expiresAt: string;
}

export function ApiKeyManagement() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [revealing, setRevealing] = useState<{ [key: string]: boolean }>({});
  const [hasCompany, setHasCompany] = useState<boolean | null>(null);

  const checkCompany = async () => {
    try {
      const companyId = localStorage.getItem('company_id');
      if (!companyId) {
        setHasCompany(false);
        return;
      }

      // Verify company still exists
      await apiService.getCompany(companyId);
      setHasCompany(true);
    } catch (error) {
      console.error('Company check failed:', error);
      setHasCompany(false);
      // Clear invalid company data
      localStorage.removeItem('company_id');
      localStorage.removeItem('company_data');
    }
  };

  const fetchApiKeys = async () => {
    try {
      // Initial load WITHOUT secrets (safer); user can reveal per key later
      const response = await apiService.getApiKeys(undefined, false);
      // Transform backend data to match frontend interface
      const transformedKeys = (response.data || []).map((key: unknown) => {
        const apiKey = key as Record<string, unknown>;
        return {
          ...apiKey,
          id: apiKey._id || apiKey.id,
          key: apiKey.fullApiKey || `${apiKey.keyId}.************************`, // masked by default
          status: apiKey.isActive ? 'active' : 'disabled',
          usageCount: apiKey.usageCount || 0,
          rateLimit: 1000,
        } as ApiKey;
      });
      setApiKeys(transformedKeys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      // Don't show mock data - show empty state instead
      setApiKeys([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initializeComponent = async () => {
      await checkCompany();
      if (hasCompany !== false) {
        await fetchApiKeys();
      }
    };

    initializeComponent();
  }, [hasCompany]);

  const handleCreateApiKey = async (keyData: CreateApiKeyData) => {
    try {
      // Check if company already has an API key
      if (apiKeys.length > 0) {
        alert('You can only have one production API key. Please delete the existing key first.');
        return;
      }

      await apiService.createApiKey(keyData);
      await fetchApiKeys(); // Refresh the list
      setIsCreateDialogOpen(false);
      alert('Production API key created successfully! Please copy and store it securely.');
    } catch (error) {
      console.error('Failed to create API key:', error);
      alert('Failed to create API key. Please check your connection and try again.');
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return;

    try {
      await apiService.deleteApiKey(keyId);
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
      alert('API key deleted successfully');
    } catch (error) {
      console.error('Failed to delete API key:', error);
      alert('Failed to delete API key');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('API key copied to clipboard');
  };

  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys(prev => ({
      ...prev,
      [keyId]: !prev[keyId]
    }));
  };

  const handleRevealFullKey = async (keyId: string) => {
    if (!confirm('Reveal full key? Only do this in a secure environment.')) return;
    try {
      setRevealing(r => ({ ...r, [keyId]: true }));
      const key = apiKeys.find(k => k.id === keyId);
      if (!key) return;
      const resp = await apiService.getApiKeyById(keyId, true);
      const full = resp.data?.fullApiKey || resp.data?.apiKey;
      if (full) {
        setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, key: full } : k));
        setShowKeys(prev => ({ ...prev, [keyId]: true }));
      } else {
        alert('Full key not available.');
      }
    } catch (e) {
      console.error('Reveal failed', e);
      alert('Failed to reveal key');
    } finally {
      setRevealing(r => ({ ...r, [keyId]: false }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'expired':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Expired</Badge>;
      case 'disabled':
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Disabled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Show company setup if no company is configured
  if (hasCompany === false) {
    return <CompanySetup />;
  }

  if (loading || hasCompany === null) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">API Key Management</h2>
            <p className="text-slate-400">Manage your API keys and access permissions</p>
          </div>
          <div className="h-10 bg-slate-600 rounded w-32 animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-600 rounded w-1/4"></div>
                  <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                  <div className="h-4 bg-slate-600 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">API Key Management</h2>
          <p className="text-slate-400">Manage your API keys and access permissions</p>
        </div>
        {/* Only show create button when no API keys exist */}
        {apiKeys.length === 0 && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Production API Key
          </Button>
        )}
      </div>

      <CreateApiKeyDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateKey={handleCreateApiKey}
      />

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <Key className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">No Production API Key</h3>
              <p className="text-slate-400 mb-6">
                Create your production API key to start sending data to Kryos and enable monitoring for your applications
              </p>
              <Button
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Production API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((apiKey) => (
            <Card key={apiKey.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-white">{apiKey.name}</h3>
                      {getStatusBadge(apiKey.status)}
                    </div>

                    <p className="text-slate-400 text-sm mb-4">{apiKey.description}</p>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1 bg-slate-700 rounded-lg p-3 font-mono text-sm">
                        <span className="text-slate-300">
                          {showKeys[apiKey.id] ? apiKey.key : `${'*'.repeat(32)}...${apiKey.key.slice(-8)}`}
                        </span>
                        {!showKeys[apiKey.id] && (
                          <p className="text-xs text-slate-500 mt-1">API key is masked for security. Click eye icon to reveal.</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleKeyVisibility(apiKey.id)}
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        {showKeys[apiKey.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(apiKey.key)}
                        className="border-slate-600 hover:bg-slate-700"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {(!apiKey.key || apiKey.key.includes('************************')) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={revealing[apiKey.id]}
                          onClick={() => handleRevealFullKey(apiKey.id)}
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          {revealing[apiKey.id] ? 'Revealing...' : 'Reveal Full Key'}
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-400">Created</p>
                        <p className="text-white">{new Date(apiKey.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Last Used</p>
                        <p className="text-white">
                          {apiKey.lastUsed ? new Date(apiKey.lastUsed).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Expires</p>
                        <p className="text-white">
                          {apiKey.expiresAt ? new Date(apiKey.expiresAt).toLocaleDateString() : 'Never'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-slate-400 text-sm mb-2">Permissions:</p>
                      <div className="flex flex-wrap gap-2">
                        {apiKey.permissions.map((permission, index) => (
                          <Badge key={index} variant="secondary" className="bg-slate-700 text-slate-200">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-700">
                      <div className="flex items-center gap-4 text-sm text-slate-400">
                        <div className="flex items-center gap-1">
                          <Activity className="h-4 w-4" />
                          <span>{apiKey.usageCount || 0} requests</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Shield className="h-4 w-4" />
                          <span>Rate limit: {apiKey.rateLimit || 1000}/hour</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-600 hover:bg-slate-700"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeleteApiKey(apiKey.id)}
                      className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function CreateApiKeyDialog({
  isOpen,
  onOpenChange,
  onCreateKey
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateKey: (keyData: CreateApiKeyData) => void;
}) {
  const [formData, setFormData] = useState<CreateApiKeyData>({
    name: 'Production API Key',
    description: 'Main API key for production environment',
    permissions: ['data:read', 'data:write', 'analytics:read'],
    expiresAt: '',
  });
  // const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);


  // const fetchApiKeys = async () => {
  //   try {
  //     const response = await apiService.getApiKeys();
  //     // Transform backend data to match frontend interface
  //     const transformedKeys = (response.data || []).map((key: unknown) => {
  //       const apiKey = key as Record<string, unknown>;
  //       return {
  //         ...apiKey,
  //         id: apiKey._id || apiKey.id,
  //         key: `${apiKey.keyId}.************************`, // Show keyId with masked secret
  //         status: apiKey.isActive ? 'active' : 'disabled',
  //         usageCount: apiKey.usageCount || 0,
  //         rateLimit: 1000,
  //       } as ApiKey;
  //     });
  //     setApiKeys(transformedKeys);
  //   } catch (error) {
  //     console.error('Failed to fetch API keys:', error);
  //     // Don't show mock data - show empty state instead
  //     setApiKeys([]);
  //   } finally {
  //     setLoading(false);
  //   }
  // };
  // fetchApiKeys();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateKey(formData);
    setFormData({
      name: 'Production API Key',
      description: 'Main API key for production environment',
      permissions: ['data:read', 'data:write', 'analytics:read'],
      expiresAt: ''
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {/* {
          apiKeys.length !== 0 && (
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create API Key
            </Button>

          )
        } */}

      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Create Production API Key</DialogTitle>
          <DialogDescription className="text-slate-400">
            Create your production API key to start integrating with Kryos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">API Key Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="bg-slate-700 border-slate-600"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-slate-700 border-slate-600"
              rows={3}
            />
          </div>

          <div className="bg-slate-700 p-4 rounded-lg">
            <Label className="text-sm font-medium">Default Permissions</Label>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">data:read - Read access to your data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">data:write - Write access to send data</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-slate-300">analytics:read - Access to analytics data</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Create API Key
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 hover:bg-slate-700"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}