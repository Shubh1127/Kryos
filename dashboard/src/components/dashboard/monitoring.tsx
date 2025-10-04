'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Activity, 
  Play,
  Pause,
  RefreshCw,
  Search,
  Filter,
  Globe,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { apiService, DataEntry } from '@/lib/api';
import { usePollingRealTime } from '@/hooks/use-realtime';

interface TrafficLog {
  id: string;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  responseTime: number;
  ipAddress: string;
  userAgent: string;
  dataType: string;
}

export function RealTimeMonitoring() {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [trafficLogs, setTrafficLogs] = useState<TrafficLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<TrafficLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'success' | 'error' | 'warning'>('all');
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    activeConnections: 0,
  });

  // Use real-time polling for live updates
  const { data: realTimeData, isPolling, startPolling, stopPolling } = usePollingRealTime({
    enabled: isMonitoring,
    interval: 3000, // Update every 3 seconds
    onError: (error) => {
      console.error('Real-time monitoring error:', error);
    },
  });

  // Generate mock traffic data
  const generateMockTraffic = (): TrafficLog => {
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const endpoints = [
      '/api/data/users',
      '/api/data/entries',
      '/api/data/files',
      '/api/analytics/dashboard',
      '/api/api-keys',
      '/api/companies'
    ];
    const statusCodes = [200, 201, 400, 401, 403, 404, 500];
    const ips = ['192.168.1.100', '10.0.0.55', '172.16.0.10', '203.0.113.42'];
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'curl/7.68.0',
      'PostmanRuntime/7.28.4',
      'Python-requests/2.28.1'
    ];
    const dataTypes = ['user_data', 'event_data', 'custom_data', 'system_log'];

    return {
      id: Math.random().toString(36).substring(2, 15),
      timestamp: new Date().toISOString(),
      method: methods[Math.floor(Math.random() * methods.length)],
      endpoint: endpoints[Math.floor(Math.random() * endpoints.length)],
      statusCode: statusCodes[Math.floor(Math.random() * statusCodes.length)],
      responseTime: Math.floor(Math.random() * 500) + 50,
      ipAddress: ips[Math.floor(Math.random() * ips.length)],
      userAgent: userAgents[Math.floor(Math.random() * userAgents.length)],
      dataType: dataTypes[Math.floor(Math.random() * dataTypes.length)],
    };
  };

  // Start/stop monitoring
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isMonitoring) {
      interval = setInterval(() => {
        const newLog = generateMockTraffic();
        setTrafficLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
      }, 2000); // New log every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring]);

  // Update stats with real-time data
  useEffect(() => {
    if (realTimeData?.systemMetrics && realTimeData?.apiMetrics) {
      setStats({
        totalRequests: realTimeData.apiMetrics.requestsPerMinute * 60, // Approximate total
        successRate: 100 - parseFloat(realTimeData.apiMetrics.errorRate.replace('%', '')),
        avgResponseTime: realTimeData.apiMetrics.averageResponseTime,
        activeConnections: realTimeData.apiMetrics.activeConnections,
      });
    }
  }, [realTimeData]);

  // Filter logs based on search and filter criteria
  useEffect(() => {
    let filtered = trafficLogs;

    if (searchTerm) {
      filtered = filtered.filter(log => 
        log.endpoint.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.method.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.ipAddress.includes(searchTerm)
      );
    }

    if (selectedFilter !== 'all') {
      filtered = filtered.filter(log => {
        switch (selectedFilter) {
          case 'success':
            return log.statusCode >= 200 && log.statusCode < 300;
          case 'error':
            return log.statusCode >= 400;
          case 'warning':
            return log.statusCode >= 300 && log.statusCode < 400;
          default:
            return true;
        }
      });
    }

    setFilteredLogs(filtered);
  }, [trafficLogs, searchTerm, selectedFilter]);

  const getStatusBadge = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">{statusCode}</Badge>;
    } else if (statusCode >= 300 && statusCode < 400) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">{statusCode}</Badge>;
    } else {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">{statusCode}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    const colors = {
      GET: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      POST: 'bg-green-500/20 text-green-400 border-green-500/30',
      PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return <Badge className={colors[method as keyof typeof colors] || 'bg-gray-500/20 text-gray-400'}>{method}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Real-Time Monitoring</h2>
          <p className="text-slate-400">Monitor live traffic and API requests</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={isMonitoring ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
          >
            {isMonitoring ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Stop Monitoring
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Start Monitoring
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => setTrafficLogs([])}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-400/10">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Success Rate</p>
                <p className="text-2xl font-bold text-white">{stats.successRate.toFixed(1)}%</p>
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
                <p className="text-sm font-medium text-slate-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">{stats.avgResponseTime}ms</p>
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
                <p className="text-sm font-medium text-slate-400">Active Connections</p>
                <p className="text-2xl font-bold text-white">{stats.activeConnections}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-400/10">
                <Globe className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Traffic Logs</CardTitle>
          <CardDescription className="text-slate-400">
            Real-time API requests and responses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search by endpoint, method, or IP..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-700 border-slate-600"
                />
              </div>
            </div>
            <div className="flex gap-2">
              {['all', 'success', 'warning', 'error'].map((filter) => (
                <Button
                  key={filter}
                  variant={selectedFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedFilter(filter as 'all' | 'success' | 'error' | 'warning')}
                  className={selectedFilter === filter ? 
                    "bg-purple-600 hover:bg-purple-700" : 
                    "border-slate-600 hover:bg-slate-700"
                  }
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Button>
              ))}
            </div>
          </div>

          {/* Monitoring Status */}
          <div className={`flex items-center gap-2 mb-4 p-3 rounded-lg ${
            isMonitoring ? 'bg-green-500/10 border border-green-500/20' : 'bg-slate-700/50'
          }`}>
            <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-green-400 animate-pulse' : 'bg-slate-400'}`} />
            <span className="text-sm text-slate-300">
              {isMonitoring ? 'Live monitoring active' : 'Monitoring stopped'}
            </span>
            {isMonitoring && (
              <Badge variant="secondary" className="ml-auto bg-green-500/20 text-green-400">
                LIVE
              </Badge>
            )}
          </div>

          {/* Traffic Logs Table */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>{isMonitoring ? 'Waiting for traffic...' : 'No traffic logs available'}</p>
                <p className="text-sm">
                  {!isMonitoring && 'Start monitoring to see real-time traffic'}
                </p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-colors">
                  <div className="text-xs text-slate-400 w-20">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </div>
                  
                  <div className="flex gap-2">
                    {getMethodBadge(log.method)}
                    {getStatusBadge(log.statusCode)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {log.endpoint}
                    </p>
                    <p className="text-xs text-slate-400">
                      {log.ipAddress} • {log.responseTime}ms • {log.dataType}
                    </p>
                  </div>
                  
                  <div className="text-xs text-slate-400">
                    {log.userAgent.split(' ')[0]}
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