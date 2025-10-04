'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  PieChart,
  Activity,
  Users,
  Globe
} from 'lucide-react';
import { apiService, DashboardStats } from '@/lib/api';

interface AnalyticsData {
  overview: {
    totalRequests: number;
    uniqueUsers: number;
    dataVolume: string;
    avgResponseTime: number;
  };
  traffic: {
    date: string;
    requests: number;
    users: number;
  }[];
  topEndpoints: {
    endpoint: string;
    requests: number;
    change: number;
  }[];
  userActivity: {
    hour: number;
    activeUsers: number;
  }[];
  geographicData: {
    country: string;
    users: number;
    requests: number;
  }[];
}

export function Analytics() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const dashboardStats = await apiService.getDashboardStats();
      
      // Transform and enhance data for analytics
      const mockAnalytics: AnalyticsData = {
        overview: {
          totalRequests: 125849,
          uniqueUsers: 3421,
          dataVolume: '2.4 GB',
          avgResponseTime: 145,
        },
        traffic: dashboardStats.trafficByDay || [],
        topEndpoints: [
          { endpoint: '/api/data/users', requests: 45234, change: 12.5 },
          { endpoint: '/api/data/entries', requests: 32156, change: -3.2 },
          { endpoint: '/api/analytics/dashboard', requests: 18976, change: 8.7 },
          { endpoint: '/api/data/files', requests: 15432, change: 5.4 },
          { endpoint: '/api/api-keys', requests: 9876, change: -1.8 },
        ],
        userActivity: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          activeUsers: Math.floor(Math.random() * 200) + 50,
        })),
        geographicData: [
          { country: 'United States', users: 1245, requests: 45123 },
          { country: 'United Kingdom', users: 892, requests: 28456 },
          { country: 'Germany', users: 634, requests: 19876 },
          { country: 'Canada', users: 423, requests: 15432 },
          { country: 'Australia', users: 287, requests: 9876 },
        ],
      };
      
      setAnalyticsData(mockAnalytics);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    // In a real app, this would generate and download a report
    alert('Report export feature coming soon!');
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

  if (!analyticsData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Analytics & Reports</h2>
          <p className="text-slate-400">Comprehensive data insights and trends</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-slate-700 rounded-lg p-1">
            {(['24h', '7d', '30d', '90d'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1 rounded-md text-sm transition-colors ${
                  timeRange === range
                    ? 'bg-purple-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <Button
            variant="outline"
            onClick={fetchAnalytics}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button
            onClick={handleExportReport}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{analyticsData.overview.totalRequests.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-sm text-green-400">+12.5%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-blue-400/10">
                <BarChart3 className="h-6 w-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Unique Users</p>
                <p className="text-2xl font-bold text-white">{analyticsData.overview.uniqueUsers.toLocaleString()}</p>
                <div className="flex items-center mt-1">
                  <TrendingUp className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-sm text-green-400">+8.2%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-400/10">
                <Users className="h-6 w-6 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Data Volume</p>
                <p className="text-2xl font-bold text-white">{analyticsData.overview.dataVolume}</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-red-400 mr-1" />
                  <span className="text-sm text-red-400">-2.1%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-purple-400/10">
                <PieChart className="h-6 w-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-400">Avg Response Time</p>
                <p className="text-2xl font-bold text-white">{analyticsData.overview.avgResponseTime}ms</p>
                <div className="flex items-center mt-1">
                  <TrendingDown className="h-4 w-4 text-green-400 mr-1" />
                  <span className="text-sm text-green-400">-5.3%</span>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-yellow-400/10">
                <Activity className="h-6 w-6 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Traffic Chart */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Traffic Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Requests and users over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.traffic.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="text-sm text-slate-400">
                    {new Date(day.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-white">{day.requests} requests</span>
                    </div>
                    <div className="w-32 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-400 h-2 rounded-full" 
                        style={{ width: `${(day.requests / Math.max(...analyticsData.traffic.map(d => d.requests))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Endpoints */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Endpoints</CardTitle>
            <CardDescription className="text-slate-400">
              Most requested API endpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topEndpoints.map((endpoint, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{endpoint.endpoint}</p>
                    <p className="text-xs text-slate-400">{endpoint.requests.toLocaleString()} requests</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={endpoint.change > 0 ? "default" : "secondary"}
                      className={endpoint.change > 0 
                        ? "bg-green-500/20 text-green-400 border-green-500/30" 
                        : "bg-red-500/20 text-red-400 border-red-500/30"
                      }
                    >
                      {endpoint.change > 0 ? '+' : ''}{endpoint.change.toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* User Activity Heatmap */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">User Activity by Hour</CardTitle>
            <CardDescription className="text-slate-400">
              Peak usage times during the day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-1">
              {analyticsData.userActivity.map((hour) => (
                <div
                  key={hour.hour}
                  className="aspect-square rounded text-xs flex items-center justify-center text-white"
                  style={{
                    backgroundColor: `rgba(147, 51, 234, ${hour.activeUsers / 250})`,
                  }}
                  title={`${hour.hour}:00 - ${hour.activeUsers} users`}
                >
                  {hour.hour}
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-4 text-xs text-slate-400">
              <span>Less active</span>
              <div className="flex gap-1">
                {[0.2, 0.4, 0.6, 0.8, 1].map((opacity) => (
                  <div
                    key={opacity}
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: `rgba(147, 51, 234, ${opacity})` }}
                  ></div>
                ))}
              </div>
              <span>More active</span>
            </div>
          </CardContent>
        </Card>

        {/* Geographic Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Geographic Distribution</CardTitle>
            <CardDescription className="text-slate-400">
              Users by country/region
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.geographicData.map((country, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-white">{country.country}</p>
                      <p className="text-xs text-slate-400">{country.users} users</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-white">{country.requests.toLocaleString()}</p>
                    <p className="text-xs text-slate-400">requests</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Report Generation */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Report Generation</CardTitle>
          <CardDescription className="text-slate-400">
            Generate detailed analytics reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              variant="outline"
              onClick={handleExportReport}
              className="border-slate-600 hover:bg-slate-700 h-20 flex-col"
            >
              <BarChart3 className="h-6 w-6 mb-2" />
              <span>Traffic Report</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportReport}
              className="border-slate-600 hover:bg-slate-700 h-20 flex-col"
            >
              <Users className="h-6 w-6 mb-2" />
              <span>User Analytics</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleExportReport}
              className="border-slate-600 hover:bg-slate-700 h-20 flex-col"
            >
              <Activity className="h-6 w-6 mb-2" />
              <span>Performance Report</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}