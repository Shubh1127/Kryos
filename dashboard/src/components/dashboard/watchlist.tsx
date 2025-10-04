'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Plus,
  Trash2,
  Edit,
  Globe,
  User,
  AlertTriangle,
  CheckCircle,
  Search,
  Filter,
  Eye,
  Ban
} from 'lucide-react';

interface WatchlistItem {
  id: string;
  type: 'ip' | 'domain' | 'user' | 'hash';
  value: string;
  description: string;
  category: 'malicious' | 'suspicious' | 'monitoring' | 'whitelist';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  createdAt: string;
  lastSeen?: string;
  hitCount: number;
  isActive: boolean;
}

interface ThreatIntelItem {
  id: string;
  indicator: string;
  type: 'ip' | 'domain' | 'hash' | 'url';
  threatType: string;
  confidence: number;
  source: string;
  description: string;
  firstSeen: string;
  lastSeen: string;
  tags: string[];
}

export function Watchlist() {
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [threatIntel, setThreatIntel] = useState<ThreatIntelItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('watchlist');

  useEffect(() => {
    fetchWatchlistData();
  }, []);

  const fetchWatchlistData = async () => {
    try {
      // Mock data for demonstration
      const mockWatchlist: WatchlistItem[] = [
        {
          id: '1',
          type: 'ip',
          value: '192.168.100.99',
          description: 'Suspicious IP attempting SQL injection',
          category: 'malicious',
          severity: 'high',
          source: 'Internal Detection',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          hitCount: 15,
          isActive: true,
        },
        {
          id: '2',
          type: 'domain',
          value: 'malicious-site.com',
          description: 'Known phishing domain',
          category: 'malicious',
          severity: 'critical',
          source: 'Threat Intelligence Feed',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          hitCount: 3,
          isActive: true,
        },
        {
          id: '3',
          type: 'ip',
          value: '10.0.0.100',
          description: 'Internal monitoring - Admin workstation',
          category: 'monitoring',
          severity: 'low',
          source: 'Manual Entry',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          hitCount: 245,
          isActive: true,
        },
        {
          id: '4',
          type: 'user',
          value: 'john.doe@company.com',
          description: 'Monitoring user activity for compliance',
          category: 'monitoring',
          severity: 'medium',
          source: 'Compliance Team',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
          hitCount: 87,
          isActive: true,
        }
      ];

      const mockThreatIntel: ThreatIntelItem[] = [
        {
          id: '1',
          indicator: '203.0.113.99',
          type: 'ip',
          threatType: 'Botnet C&C',
          confidence: 95,
          source: 'AlienVault OTX',
          description: 'IP address associated with Zeus botnet command and control infrastructure',
          firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          tags: ['botnet', 'c2', 'zeus', 'malware'],
        },
        {
          id: '2',
          indicator: 'evil-domain.net',
          type: 'domain',
          threatType: 'Phishing',
          confidence: 88,
          source: 'PhishTank',
          description: 'Domain used in credential harvesting campaigns targeting financial institutions',
          firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
          tags: ['phishing', 'financial', 'credentials'],
        },
        {
          id: '3',
          indicator: 'a1b2c3d4e5f6789012345678901234567890abcd',
          type: 'hash',
          threatType: 'Malware',
          confidence: 92,
          source: 'VirusTotal',
          description: 'SHA-1 hash of known trojan variant',
          firstSeen: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
          lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
          tags: ['malware', 'trojan', 'windows'],
        }
      ];

      setWatchlistItems(mockWatchlist);
      setThreatIntel(mockThreatIntel);
    } catch (error) {
      console.error('Failed to fetch watchlist data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWatchlistItem = async (itemData: Omit<WatchlistItem, 'id' | 'createdAt' | 'hitCount' | 'isActive'>) => {
    try {
      const newItem: WatchlistItem = {
        ...itemData,
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        hitCount: 0,
        isActive: true,
      };
      
      setWatchlistItems(prev => [newItem, ...prev]);
      setIsAddDialogOpen(false);
      alert('Watchlist item added successfully');
    } catch (error) {
      console.error('Failed to add watchlist item:', error);
      alert('Failed to add watchlist item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      setWatchlistItems(prev => prev.filter(item => item.id !== itemId));
      alert('Item deleted successfully');
    } catch (error) {
      console.error('Failed to delete item:', error);
      alert('Failed to delete item');
    }
  };

  const handleToggleActive = async (itemId: string) => {
    try {
      setWatchlistItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, isActive: !item.isActive } : item
      ));
    } catch (error) {
      console.error('Failed to toggle item status:', error);
    }
  };

  const addToWatchlist = async (intelItem: ThreatIntelItem) => {
    try {
      const newWatchlistItem: WatchlistItem = {
        id: Math.random().toString(36).substring(2, 15),
        type: intelItem.type as WatchlistItem['type'],
        value: intelItem.indicator,
        description: `Threat Intel: ${intelItem.description}`,
        category: 'malicious',
        severity: intelItem.confidence > 90 ? 'critical' : 
                  intelItem.confidence > 70 ? 'high' : 'medium',
        source: intelItem.source,
        createdAt: new Date().toISOString(),
        hitCount: 0,
        isActive: true,
      };
      
      setWatchlistItems(prev => [newWatchlistItem, ...prev]);
      alert('Added to watchlist successfully');
    } catch (error) {
      console.error('Failed to add to watchlist:', error);
      alert('Failed to add to watchlist');
    }
  };

  const getSeverityBadge = (severity: string) => {
    const styles = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return <Badge className={styles[severity as keyof typeof styles]}>{severity.toUpperCase()}</Badge>;
  };

  const getCategoryBadge = (category: string) => {
    const styles = {
      malicious: 'bg-red-500/20 text-red-400 border-red-500/30',
      suspicious: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      monitoring: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      whitelist: 'bg-green-500/20 text-green-400 border-green-500/30',
    };
    return <Badge className={styles[category as keyof typeof styles]}>{category.toUpperCase()}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      ip: Globe,
      domain: Globe,
      user: User,
      hash: Shield,
      url: Globe,
    };
    const Icon = icons[type as keyof typeof icons] || Shield;
    return <Icon className="h-4 w-4" />;
  };

  const filteredWatchlist = watchlistItems.filter(item => {
    const matchesSearch = item.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-600 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-600 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Watchlist & Threat Intelligence</h2>
          <p className="text-slate-400">Monitor and track potential security threats</p>
        </div>
        <AddWatchlistDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onAddItem={handleAddWatchlistItem}
        />
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Items</p>
                <p className="text-2xl font-bold text-white">{watchlistItems.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-400/10">
                <Shield className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Active Items</p>
                <p className="text-2xl font-bold text-white">
                  {watchlistItems.filter(item => item.isActive).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-green-400/10">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Critical/High</p>
                <p className="text-2xl font-bold text-white">
                  {watchlistItems.filter(item => ['critical', 'high'].includes(item.severity)).length}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-400/10">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Recent Hits</p>
                <p className="text-2xl font-bold text-white">
                  {watchlistItems.reduce((sum, item) => sum + item.hitCount, 0)}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-400/10">
                <Eye className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-slate-800">
          <TabsTrigger value="watchlist" className="data-[state=active]:bg-purple-600">
            Watchlist
          </TabsTrigger>
          <TabsTrigger value="threat-intel" className="data-[state=active]:bg-purple-600">
            Threat Intelligence
          </TabsTrigger>
        </TabsList>

        <TabsContent value="watchlist" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-white">Watchlist Items</CardTitle>
                  <CardDescription className="text-slate-400">
                    Monitor specific IPs, domains, users, and hashes
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search watchlist..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-slate-700 border-slate-600 w-64"
                    />
                  </div>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
                  >
                    <option value="all">All Categories</option>
                    <option value="malicious">Malicious</option>
                    <option value="suspicious">Suspicious</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="whitelist">Whitelist</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredWatchlist.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No watchlist items found</p>
                    <p className="text-sm">Add items to monitor potential threats</p>
                  </div>
                ) : (
                  filteredWatchlist.map((item) => (
                    <div key={item.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="p-2 rounded-lg bg-slate-600/50">
                            {getTypeIcon(item.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold text-white font-mono">
                                {item.value}
                              </h3>
                              <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                                {item.type.toUpperCase()}
                              </Badge>
                              {getSeverityBadge(item.severity)}
                              {getCategoryBadge(item.category)}
                              {!item.isActive && (
                                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">
                                  INACTIVE
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-slate-400 text-sm mb-3">{item.description}</p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-slate-400">Source</p>
                                <p className="text-white">{item.source}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Created</p>
                                <p className="text-white">{new Date(item.createdAt).toLocaleDateString()}</p>
                              </div>
                              <div>
                                <p className="text-slate-400">Last Seen</p>
                                <p className="text-white">
                                  {item.lastSeen ? new Date(item.lastSeen).toLocaleDateString() : 'Never'}
                                </p>
                              </div>
                              <div>
                                <p className="text-slate-400">Hits</p>
                                <p className="text-white">{item.hitCount}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleActive(item.id)}
                            className={`border-slate-600 ${
                              item.isActive 
                                ? 'hover:bg-red-600 hover:border-red-600' 
                                : 'hover:bg-green-600 hover:border-green-600'
                            }`}
                          >
                            {item.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
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
                            onClick={() => handleDeleteItem(item.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threat-intel" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Threat Intelligence Feed</CardTitle>
              <CardDescription className="text-slate-400">
                Latest threat indicators from various intelligence sources
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {threatIntel.map((intel) => (
                  <div key={intel.id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 rounded-lg bg-slate-600/50">
                          {getTypeIcon(intel.type)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white font-mono">
                              {intel.indicator}
                            </h3>
                            <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                              {intel.type.toUpperCase()}
                            </Badge>
                            <Badge className={`${
                              intel.confidence > 90 ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              intel.confidence > 70 ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                              'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                            }`}>
                              {intel.confidence}% CONFIDENCE
                            </Badge>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-white font-medium">{intel.threatType}</p>
                            <p className="text-slate-400 text-sm">{intel.description}</p>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mb-3">
                            {intel.tags.map((tag, index) => (
                              <Badge key={index} variant="secondary" className="bg-slate-600/50 text-slate-300">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-400">Source</p>
                              <p className="text-white">{intel.source}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">First Seen</p>
                              <p className="text-white">{new Date(intel.firstSeen).toLocaleDateString()}</p>
                            </div>
                            <div>
                              <p className="text-slate-400">Last Seen</p>
                              <p className="text-white">{new Date(intel.lastSeen).toLocaleDateString()}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          onClick={() => addToWatchlist(intel)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add to Watchlist
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function AddWatchlistDialog({ 
  isOpen, 
  onOpenChange, 
  onAddItem 
}: { 
  isOpen: boolean; 
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: Omit<WatchlistItem, 'id' | 'createdAt' | 'hitCount' | 'isActive'>) => void;
}) {
  const [formData, setFormData] = useState({
    type: 'ip' as WatchlistItem['type'],
    value: '',
    description: '',
    category: 'suspicious' as WatchlistItem['category'],
    severity: 'medium' as WatchlistItem['severity'],
    source: 'Manual Entry',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddItem(formData);
    setFormData({
      type: 'ip',
      value: '',
      description: '',
      category: 'suspicious',
      severity: 'medium',
      source: 'Manual Entry',
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add to Watchlist
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-800 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle>Add Watchlist Item</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new item to monitor for security threats
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="type">Type</Label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value as WatchlistItem['type'] })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="ip">IP Address</option>
                <option value="domain">Domain</option>
                <option value="user">User</option>
                <option value="hash">Hash</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as WatchlistItem['category'] })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="malicious">Malicious</option>
                <option value="suspicious">Suspicious</option>
                <option value="monitoring">Monitoring</option>
                <option value="whitelist">Whitelist</option>
              </select>
            </div>
          </div>
          
          <div>
            <Label htmlFor="value">Value</Label>
            <Input
              id="value"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              placeholder="Enter IP, domain, user, or hash..."
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
              placeholder="Describe why this item should be monitored"
              className="bg-slate-700 border-slate-600"
              rows={3}
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="severity">Severity</Label>
              <select
                id="severity"
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as WatchlistItem['severity'] })}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="Manual Entry"
                className="bg-slate-700 border-slate-600"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
              Add Item
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