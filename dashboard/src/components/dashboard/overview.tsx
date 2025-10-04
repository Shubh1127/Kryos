'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Key, 
  Activity, 
  AlertTriangle, 
  TrendingUp, 
  Server,
  Shield,
  Eye,
  FileText,
  Globe,
  Link as LinkIcon,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { apiService, DashboardStats } from '@/lib/api';

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [counts, setCounts] = useState<any>(null);
  const [blockchainStats, setBlockchainStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [countsLoading, setCountsLoading] = useState(true);
  const [blockchainLoading, setBlockchainLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setCountsLoading(true);
      console.log('📊 Fetching analytics counts...');
      const data = await apiService.getAnalyticsCounts();
      console.log('📊 Analytics counts received:', data);
      setCounts(data);
    } catch (error) {
      console.error('❌ Failed to fetch analytics counts:', error);
      // Don't set error for counts, just log it
    } finally {
      setCountsLoading(false);
    }
  };

  const fetchBlockchainStats = async () => {
    try {
      setBlockchainLoading(true);
      console.log('🔗 Fetching blockchain stats...');
      const data = await apiService.getBlockchainStats();
      console.log('⛓️ Blockchain stats received:', data);
      setBlockchainStats(data);
    } catch (error) {
      console.error('❌ Failed to fetch blockchain stats:', error);
      // Don't set error for blockchain stats, just log it
    } finally {
      setBlockchainLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching dashboard stats...');
      const data = await apiService.getDashboardStats();
      console.log('📊 Dashboard stats received:', data);
      setStats(data);
    } catch (error) {
      console.error('❌ Failed to fetch dashboard stats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const setupApiKey = () => {
    const apiKey = '1561b5570462230efb3a700d1dd90d87.aade1b3486efa7295df4520a65f463c6099a37180015ed1ca9fd1c1757052c48';
    apiService.setApiKey(apiKey);
    fetchStats(); // Retry fetching stats
  };

  useEffect(() => {
    fetchStats();
    fetchCounts();
    fetchBlockchainStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-600 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-600 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Show error state with API key setup button
  if (error && !loading) {
    return (
      <div className="space-y-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
              <p className="text-slate-400 mb-4">
                {error.includes('No API key') ? 
                  'Please set up your API key to view dashboard data.' : 
                  error}
              </p>
              <Button onClick={setupApiKey} className="bg-blue-600 hover:bg-blue-700">
                <Key className="h-4 w-4 mr-2" />
                Setup API Key & Load Data
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: counts?.company?.totalUsers || stats?.totalUsers || 0,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-400/10',
      change: '+12%',
      changeType: 'positive' as const,
      loading: countsLoading,
    },
    {
      title: 'API Keys',
      value: counts?.company?.totalApiKeys || stats?.totalApiKeys || 0,
      icon: Key,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-400/10',
      change: '+2',
      changeType: 'positive' as const,
      loading: countsLoading,
    },
    {
      title: 'Data Entries',
      value: counts?.company?.totalEntries || stats?.totalEntries || 0,
      icon: Activity,
      color: 'text-green-400',
      bgColor: 'bg-green-400/10',
      change: '+24%',
      changeType: 'positive' as const,
      loading: countsLoading,
    },
    {
      title: 'Security Alerts',
      value: stats?.securityAlerts?.length || 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bgColor: 'bg-red-400/10',
      change: '-8%',
      changeType: 'negative' as const,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-400">{stat.title}</p>
                    {stat.loading ? (
                      <div className="h-8 bg-slate-600 rounded w-16 animate-pulse"></div>
                    ) : (
                      <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                    )}
                    <p className={`text-xs ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'}`}>
                      {stat.change} from last month
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Debug Section */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-4">Debug Information</h3>
            <div className="space-y-2 mb-4">
              <p className="text-sm text-slate-400">Current Stats: {JSON.stringify(stats)}</p>
              <p className="text-sm text-slate-400">Current Counts: {JSON.stringify(counts)}</p>
              <p className="text-sm text-slate-400">Loading: {loading ? 'Yes' : 'No'}</p>
              <p className="text-sm text-slate-400">Counts Loading: {countsLoading ? 'Yes' : 'No'}</p>
              <p className="text-sm text-slate-400">Error: {error || 'None'}</p>
            </div>
            <Button onClick={setupApiKey} className="bg-green-600 hover:bg-green-700 mr-2">
              <Key className="h-4 w-4 mr-2" />
              Set API Key & Retry
            </Button>
            <Button onClick={fetchStats} className="bg-blue-600 hover:bg-blue-700 mr-2">
              <Activity className="h-4 w-4 mr-2" />
              Retry Fetch Stats
            </Button>
            <Button onClick={fetchCounts} className="bg-purple-600 hover:bg-purple-700">
              <TrendingUp className="h-4 w-4 mr-2" />
              Retry Fetch Counts
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Recent Activity</CardTitle>
            <CardDescription className="text-slate-400">
              Latest data entries and events from your applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentActivity?.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-slate-700/50">
                  <div className="flex-shrink-0">
                    <Activity className="h-5 w-5 text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {activity.dataType === 'user_data' ? 'User Data' : 
                       activity.dataType === 'event_data' ? 'Event Data' : 'Custom Data'}
                    </p>
                    <p className="text-xs text-slate-400">
                      ID: {activity.externalId} • {new Date(activity.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                    {activity.dataType}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-8 text-slate-400">
                  <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No recent activity</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Alerts */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Security Alerts</CardTitle>
            <CardDescription className="text-slate-400">
              Recent security events and threats detected
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.securityAlerts?.slice(0, 5).map((alert, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 rounded-lg bg-slate-700/50">
                  <div className="flex-shrink-0">
                    <AlertTriangle className={`h-5 w-5 ${
                      alert.severity === 'critical' ? 'text-red-400' :
                      alert.severity === 'high' ? 'text-orange-400' :
                      alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {alert.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <p className="text-xs text-slate-400">
                      {alert.source.ip} • {new Date(alert.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge 
                    variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}
                    className="capitalize"
                  >
                    {alert.severity}
                  </Badge>
                </div>
              )) || (
                <div className="text-center py-8 text-slate-400">
                  <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No security alerts</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blockchain Integration */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <LinkIcon className="h-5 w-5 text-blue-400" />
            Blockchain Integration
          </CardTitle>
          <CardDescription className="text-slate-400">
            Data integrity and transparency through blockchain hashing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {blockchainLoading ? (
            <div className="text-center py-8 text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p>Loading blockchain data...</p>
            </div>
          ) : blockchainStats ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {/* Total Hashes */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Total Hashes</p>
                    <p className="text-2xl font-bold text-white">{blockchainStats.totalHashes}</p>
                  </div>
                  <LinkIcon className="h-8 w-8 text-blue-400" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Stored on blockchain</p>
              </div>

              {/* Wallet Balance */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Wallet Balance</p>
                    <p className="text-2xl font-bold text-white">{parseFloat(blockchainStats.walletBalance).toFixed(4)} ETH</p>
                  </div>
                  <Globe className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Available for transactions</p>
              </div>

              {/* Network Status */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Network</p>
                    <p className="text-lg font-bold text-white">Chain #{blockchainStats.networkInfo.chainId}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Block #{blockchainStats.networkInfo.blockNumber}</p>
              </div>

              {/* Company Hashes */}
              <div className="p-4 rounded-lg bg-slate-700/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-300">Your Hashes</p>
                    <p className="text-2xl font-bold text-white">{blockchainStats.companyHashes.count}</p>
                  </div>
                  <Shield className="h-8 w-8 text-purple-400" />
                </div>
                <p className="text-xs text-slate-400 mt-2">Company data hashes</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-400">
              <XCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Blockchain service not available</p>
              <p className="text-xs mt-2">Check your blockchain configuration</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Quick Actions</CardTitle>
          <CardDescription className="text-slate-400">
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <button className="p-4 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left">
              <Key className="h-8 w-8 text-yellow-400 mb-2" />
              <p className="text-sm font-medium text-white">Generate API Key</p>
              <p className="text-xs text-slate-400">Create a new API key for your applications</p>
            </button>
            
            <button className="p-4 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left">
              <Eye className="h-8 w-8 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-white">View Live Traffic</p>
              <p className="text-xs text-slate-400">Monitor real-time application traffic</p>
            </button>
            
            <button className="p-4 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left">
              <FileText className="h-8 w-8 text-green-400 mb-2" />
              <p className="text-sm font-medium text-white">Generate Report</p>
              <p className="text-xs text-slate-400">Create security and analytics reports</p>
            </button>
            
            <button className="p-4 rounded-lg bg-slate-700 hover:bg-slate-600 transition-colors text-left">
              <Globe className="h-8 w-8 text-purple-400 mb-2" />
              <p className="text-sm font-medium text-white">Manage Watchlist</p>
              <p className="text-xs text-slate-400">Add IPs and domains to watchlist</p>
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}