import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import DataEntry from '../models/DataEntry';
import User from '../models/User';
import ApiKey from '../models/ApiKey';

const router = express.Router();

// Middleware to authenticate all dashboard routes
router.use(authenticateApiKey);

// Real-time monitoring data for dashboard
router.get('/monitoring', checkPermission('dashboard:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company._id;

    // Get current system status
    const [totalApiKeys, activeUsers, totalRequests] = await Promise.all([
      ApiKey.countDocuments({ company: companyId, status: 'active' }),
      User.countDocuments({ company: companyId, lastActive: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
      DataEntry.countDocuments({ company: companyId, createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }),
    ]);

    // Generate mock real-time metrics
    const systemMetrics = {
      cpu: Math.floor(Math.random() * 30) + 20, // 20-50%
      memory: Math.floor(Math.random() * 40) + 30, // 30-70%
      disk: Math.floor(Math.random() * 20) + 15, // 15-35%
      network: Math.floor(Math.random() * 50) + 10, // 10-60 Mbps
    };

    // Generate response time data for the last hour
    const responseTimeData = [];
    const now = new Date();
    for (let i = 59; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - i * 60 * 1000);
      responseTimeData.push({
        timestamp: timestamp.toISOString(),
        responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
        requests: Math.floor(Math.random() * 20) + 5, // 5-25 requests per minute
      });
    }

    // Get recent errors (mock data for now)
    const recentErrors = [
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        type: 'HTTP 500',
        endpoint: '/api/data/submit',
        message: 'Internal server error during data processing',
        count: 3,
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        type: 'HTTP 429',
        endpoint: '/api/data/users',
        message: 'Rate limit exceeded',
        count: 12,
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        type: 'HTTP 400',
        endpoint: '/api/api-keys',
        message: 'Invalid API key format',
        count: 7,
      },
    ];

    // Active connections and endpoints status
    const endpointStatus = [
      { endpoint: '/api/data/submit', status: 'healthy', responseTime: 89, uptime: 99.9 },
      { endpoint: '/api/data/users', status: 'healthy', responseTime: 145, uptime: 99.7 },
      { endpoint: '/api/data/files', status: 'warning', responseTime: 234, uptime: 98.2 },
      { endpoint: '/api/api-keys', status: 'healthy', responseTime: 67, uptime: 99.9 },
      { endpoint: '/api/companies', status: 'healthy', responseTime: 123, uptime: 99.8 },
    ];

    res.json({
      success: true,
      data: {
        systemStatus: {
          status: 'operational', // operational, degraded, maintenance, outage
          uptime: '99.9%',
          lastUpdate: new Date().toISOString(),
        },
        systemMetrics,
        apiMetrics: {
          totalApiKeys,
          activeUsers,
          totalRequests,
          requestsPerMinute: Math.floor(Math.random() * 100) + 20,
          averageResponseTime: Math.floor(Math.random() * 50) + 100,
          errorRate: (Math.random() * 2).toFixed(2) + '%',
        },
        responseTimeData,
        recentErrors,
        endpointStatus,
        activeConnections: Math.floor(Math.random() * 500) + 100,
        geographicDistribution: [
          { region: 'North America', requests: Math.floor(Math.random() * 1000) + 500 },
          { region: 'Europe', requests: Math.floor(Math.random() * 800) + 300 },
          { region: 'Asia Pacific', requests: Math.floor(Math.random() * 600) + 200 },
          { region: 'South America', requests: Math.floor(Math.random() * 200) + 50 },
          { region: 'Africa', requests: Math.floor(Math.random() * 100) + 20 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get watchlist data
router.get('/watchlist', checkPermission('watchlist:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Mock watchlist data - in a real implementation, this would come from a threat intelligence service
    const watchlistItems = [
      {
        _id: 'watch-1',
        type: 'ip_address',
        value: '192.168.1.100',
        source: 'Internal Detection',
        risk: 'high',
        category: 'Brute Force',
        description: 'IP address showing repeated failed login attempts',
        dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        hitCount: 15,
        status: 'active',
      },
      {
        _id: 'watch-2',
        type: 'domain',
        value: 'suspicious-domain.com',
        source: 'Threat Intelligence Feed',
        risk: 'critical',
        category: 'Malware C&C',
        description: 'Known command and control server for malware',
        dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        hitCount: 3,
        status: 'monitoring',
      },
      {
        _id: 'watch-3',
        type: 'file_hash',
        value: 'a1b2c3d4e5f6789012345678901234567890abcd',
        source: 'File Analysis',
        risk: 'medium',
        category: 'Suspicious File',
        description: 'File hash associated with potentially unwanted program',
        dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        hitCount: 1,
        status: 'archived',
      },
      {
        _id: 'watch-4',
        type: 'user_agent',
        value: 'BadBot/1.0',
        source: 'Behavioral Analysis',
        risk: 'low',
        category: 'Automated Tool',
        description: 'User agent string associated with scanning tools',
        dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
        lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        hitCount: 28,
        status: 'active',
      },
    ];

    // Generate threat intelligence summary
    const threatIntelligence = {
      totalIndicators: watchlistItems.length,
      activeThreats: watchlistItems.filter(item => item.status === 'active').length,
      criticalRisk: watchlistItems.filter(item => item.risk === 'critical').length,
      highRisk: watchlistItems.filter(item => item.risk === 'high').length,
      mediumRisk: watchlistItems.filter(item => item.risk === 'medium').length,
      lowRisk: watchlistItems.filter(item => item.risk === 'low').length,
      recentHits: watchlistItems.reduce((sum, item) => sum + item.hitCount, 0),
      lastUpdated: new Date().toISOString(),
    };

    // Category distribution
    const categoryDistribution = {};
    watchlistItems.forEach(item => {
      categoryDistribution[item.category] = (categoryDistribution[item.category] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        watchlistItems,
        threatIntelligence,
        categoryDistribution,
        sources: [
          { name: 'Internal Detection', count: 2 },
          { name: 'Threat Intelligence Feed', count: 1 },
          { name: 'File Analysis', count: 1 },
          { name: 'Behavioral Analysis', count: 1 },
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;