'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertTriangle, 
  Shield, 
  Eye,
  CheckCircle,
  Clock,
  Search,
  Globe,
  User,
  Zap,
  Ban
} from 'lucide-react';
import { apiService, SecurityAlert } from '@/lib/api';

export function SecurityAlerts() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    investigating: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  });

  useEffect(() => {
    fetchAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, selectedSeverity]);

  const fetchAlerts = async () => {
    try {
      const response = await apiService.getSecurityAlerts({
        page: 1,
        limit: 50,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
        severity: selectedSeverity === 'all' ? undefined : selectedSeverity,
      });
      
      const alertsData = response.data.alerts || [];
      const statsData = response.data.stats || {};
      
      setAlerts(alertsData);
      setStats({
        total: statsData.total || 0,
        new: statsData.new || 0,
        investigating: statsData.investigating || 0,
        resolved: statsData.resolved || 0,
        critical: statsData.critical || 0,
        high: statsData.high || 0,
        medium: statsData.medium || 0,
        low: statsData.low || 0,
      });
      
    } catch (error) {
      console.error('Failed to fetch security alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter alerts
  useEffect(() => {
    let filtered = alerts;

    if (searchTerm) {
      filtered = filtered.filter(alert => 
        alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.source.ip.includes(searchTerm) ||
        (alert.source.location && alert.source.location.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.severity === selectedSeverity);
    }

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(alert => alert.status === selectedStatus);
    }

    // Sort by creation time (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredAlerts(filtered);
  }, [alerts, searchTerm, selectedSeverity, selectedStatus]);

  const getSeverityBadge = (severity: string) => {
    const styles = {
      critical: 'bg-red-500/20 text-red-400 border-red-500/30',
      high: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    };
    return <Badge className={styles[severity as keyof typeof styles]}>{severity.toUpperCase()}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      new: 'bg-red-500/20 text-red-400 border-red-500/30',
      investigating: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      resolved: 'bg-green-500/20 text-green-400 border-green-500/30',
      blocked: 'bg-red-600/20 text-red-300 border-red-600/30',
      quarantined: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return <Badge className={styles[status as keyof typeof styles]}>{status.replace('_', ' ').toUpperCase()}</Badge>;
  };

  const getTypeIcon = (type: string) => {
    const icons = {
      suspicious_ip: Globe,
      brute_force: User,
      sql_injection: Zap,
      xss_attempt: Shield,
      ddos: Ban,
      malware: AlertTriangle,
    };
    const Icon = icons[type as keyof typeof icons] || AlertTriangle;
    return <Icon className="h-5 w-5" />;
  };

  const getTypeDescription = (type: string) => {
    const descriptions = {
      suspicious_ip: 'Suspicious IP Activity',
      brute_force: 'Brute Force Attack',
      sql_injection: 'SQL Injection Attempt',
      xss_attempt: 'Cross-Site Scripting',
      ddos: 'DDoS Attack',
      malware: 'Malware Detection',
    };
    return descriptions[type as keyof typeof descriptions] || type.replace('_', ' ').toUpperCase();
  };

  const handleStatusChange = async (alertId: string, newStatus: string) => {
    try {
      // Update backend first
      await apiService.updateSecurityAlertStatus(alertId, newStatus);
      
      // Update local state
      setAlerts(prev => prev.map(alert => 
        alert._id === alertId ? { ...alert, status: newStatus as SecurityAlert['status'] } : alert
      ));
      
    } catch (error) {
      console.error('Failed to update alert status:', error);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-slate-600 rounded w-1/4 mb-2"></div>
          <div className="h-4 bg-slate-600 rounded w-1/2"></div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-slate-600 rounded w-3/4"></div>
                  <div className="h-8 bg-slate-600 rounded w-1/2"></div>
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
      <div>
        <h2 className="text-2xl font-bold text-white">Security Events & Alerts</h2>
        <p className="text-slate-400">Monitor and respond to security threats</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Alerts</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-400/10">
                <AlertTriangle className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Critical/High</p>
                <p className="text-2xl font-bold text-white">{stats.critical + stats.high}</p>
              </div>
              <div className="p-3 rounded-lg bg-red-400/10">
                <Shield className="h-6 w-6 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">New Alerts</p>
                <p className="text-2xl font-bold text-white">{stats.new}</p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-400/10">
                <Clock className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Resolved</p>
                <p className="text-2xl font-bold text-white">{stats.resolved}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-400/10">
                <CheckCircle className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Security Alerts</CardTitle>
          <CardDescription className="text-slate-400">
            Recent security events and threat detections
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search alerts by type, IP, or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedSeverity}
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
              >
                <option value="all">All Severities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white text-sm"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
                <option value="blocked">Blocked</option>
                <option value="quarantined">Quarantined</option>
              </select>
            </div>
          </div>

          {/* Alerts List */}
          <div className="space-y-4">
            {filteredAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No security alerts found</p>
                <p className="text-sm">Your system is secure</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => (
                <div key={alert._id} className="p-4 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-2 rounded-lg bg-slate-600/50">
                        {getTypeIcon(alert.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-white">
                            {getTypeDescription(alert.type)}
                          </h3>
                          {getSeverityBadge(alert.severity)}
                          {getStatusBadge(alert.status)}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                          <div>
                            <p className="text-slate-400">Source IP</p>
                            <p className="text-white font-mono">{alert.source.ip}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Location</p>
                            <p className="text-white">{alert.source.location || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-slate-400">Detected</p>
                            <p className="text-white">{new Date(alert.createdAt).toLocaleString()}</p>
                          </div>
                        </div>
                        
                        {/* Alert Details */}
                        <div className="mt-3 p-3 bg-slate-800 rounded-md">
                          <p className="text-slate-400 text-sm mb-2">Details:</p>
                          <div className="text-sm text-slate-300">
                            {Object.entries(alert.details).map(([key, value]) => (
                              <div key={key} className="flex justify-between py-1">
                                <span className="text-slate-400 capitalize">{key.replace('_', ' ')}:</span>
                                <span className="text-white font-mono">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2 ml-4">
                      {alert.status === 'new' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(alert._id, 'investigating')}
                          className="bg-yellow-600 hover:bg-yellow-700"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Investigate
                        </Button>
                      )}
                      {alert.status === 'investigating' && (
                        <Button
                          size="sm"
                          onClick={() => handleStatusChange(alert._id, 'resolved')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                      {alert.status === 'new' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusChange(alert._id, 'blocked')}
                          className="border-slate-600 hover:bg-slate-700"
                        >
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}