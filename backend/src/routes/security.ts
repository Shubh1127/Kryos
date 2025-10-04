import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Middleware to authenticate all security alert routes
router.use(authenticateApiKey);

// Mock security alerts data - in a real implementation, this would be stored in MongoDB
const mockSecurityAlerts = [
  {
    _id: 'alert-1',
    type: 'suspicious_ip',
    severity: 'high',
    title: 'Suspicious IP Activity Detected',
    description: 'Multiple failed authentication attempts from unknown IP address',
    source: {
      ip: '192.168.1.100',
      location: 'Unknown',
      userAgent: 'curl/7.68.0',
    },
    details: {
      attempts: 15,
      timeWindow: '10 minutes',
      endpoint: '/api/auth/login',
      method: 'POST',
    },
    status: 'new',
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
  },
  {
    _id: 'alert-2',
    type: 'brute_force',
    severity: 'critical',
    title: 'Brute Force Attack Detected',
    description: 'Coordinated brute force attack targeting API endpoints',
    source: {
      ip: '10.0.0.55',
      location: 'Russia',
      userAgent: 'python-requests/2.28.1',
    },
    details: {
      attempts: 50,
      timeWindow: '5 minutes',
      endpoint: '/api/data/users',
      method: 'GET',
    },
    status: 'investigating',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    _id: 'alert-3',
    type: 'rate_limit_exceeded',
    severity: 'medium',
    title: 'Rate Limit Exceeded',
    description: 'Client exceeded API rate limits multiple times',
    source: {
      ip: '203.0.113.42',
      location: 'Singapore',
      userAgent: 'Mozilla/5.0 (compatible; bot/1.0)',
    },
    details: {
      attempts: 1000,
      timeWindow: '1 hour',
      endpoint: '/api/data/submit',
      method: 'POST',
    },
    status: 'resolved',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
  },
  {
    _id: 'alert-4',
    type: 'sql_injection',
    severity: 'critical',
    title: 'SQL Injection Attempt',
    description: 'Potential SQL injection attack detected in request parameters',
    source: {
      ip: '198.51.100.23',
      location: 'United States',
      userAgent: 'curl/7.64.1',
    },
    details: {
      attempts: 3,
      timeWindow: '2 minutes',
      endpoint: '/api/data/search',
      method: 'GET',
      payload: "'; DROP TABLE users; --",
    },
    status: 'blocked',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
  },
  {
    _id: 'alert-5',
    type: 'malware_detected',
    severity: 'high',
    title: 'Malware Upload Detected',
    description: 'Suspicious file upload flagged by security scanner',
    source: {
      ip: '172.16.0.5',
      location: 'Germany',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    details: {
      attempts: 1,
      timeWindow: '1 minute',
      endpoint: '/api/data/file-upload',
      method: 'POST',
      fileName: 'document.exe',
      fileSize: '2.5MB',
      threat: 'Trojan.Generic',
    },
    status: 'quarantined',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
  },
];

// Get all security alerts
router.get('/', checkPermission('security:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { status, severity, type, page = 1, limit = 20 } = req.query;

    let filteredAlerts = [...mockSecurityAlerts];

    // Apply filters
    if (status && status !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status);
    }
    if (severity && severity !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    if (type && type !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }

    // Sort by creation date (newest first)
    filteredAlerts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Pagination
    const startIndex = (Number(page) - 1) * Number(limit);
    const endIndex = startIndex + Number(limit);
    const paginatedAlerts = filteredAlerts.slice(startIndex, endIndex);

    // Calculate statistics
    const stats = {
      total: filteredAlerts.length,
      new: filteredAlerts.filter(alert => alert.status === 'new').length,
      investigating: filteredAlerts.filter(alert => alert.status === 'investigating').length,
      resolved: filteredAlerts.filter(alert => alert.status === 'resolved').length,
      blocked: filteredAlerts.filter(alert => alert.status === 'blocked').length,
      quarantined: filteredAlerts.filter(alert => alert.status === 'quarantined').length,
      critical: filteredAlerts.filter(alert => alert.severity === 'critical').length,
      high: filteredAlerts.filter(alert => alert.severity === 'high').length,
      medium: filteredAlerts.filter(alert => alert.severity === 'medium').length,
      low: filteredAlerts.filter(alert => alert.severity === 'low').length,
    };

    res.json({
      success: true,
      data: {
        alerts: paginatedAlerts,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: filteredAlerts.length,
          pages: Math.ceil(filteredAlerts.length / Number(limit)),
        },
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get a specific security alert
router.get('/:id', checkPermission('security:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const alert = mockSecurityAlerts.find(alert => alert._id === id);

    if (!alert) {
      throw new CustomError('Security alert not found', 404);
    }

    res.json({
      success: true,
      data: alert,
    });
  } catch (error) {
    next(error);
  }
});

// Update security alert status
router.patch('/:id/status', checkPermission('security:write'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'investigating', 'resolved', 'blocked', 'quarantined'];
    if (!status || !validStatuses.includes(status)) {
      throw new CustomError('Invalid status provided', 400);
    }

    const alertIndex = mockSecurityAlerts.findIndex(alert => alert._id === id);
    if (alertIndex === -1) {
      throw new CustomError('Security alert not found', 404);
    }

    // Update the alert status
    mockSecurityAlerts[alertIndex].status = status;
    mockSecurityAlerts[alertIndex].updatedAt = new Date().toISOString();

    res.json({
      success: true,
      message: `Alert status updated to ${status}`,
      data: mockSecurityAlerts[alertIndex],
    });
  } catch (error) {
    next(error);
  }
});

// Get security metrics for dashboard
router.get('/metrics/dashboard', checkPermission('security:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filter alerts by time periods
    const last24hAlerts = mockSecurityAlerts.filter(alert => new Date(alert.createdAt) >= last24h);
    const last7dAlerts = mockSecurityAlerts.filter(alert => new Date(alert.createdAt) >= last7d);

    // Calculate threat level based on recent critical/high severity alerts
    const recentCriticalAlerts = last24hAlerts.filter(alert => alert.severity === 'critical').length;
    const recentHighAlerts = last24hAlerts.filter(alert => alert.severity === 'high').length;

    let threatLevel = 'low';
    if (recentCriticalAlerts > 0) {
      threatLevel = 'critical';
    } else if (recentHighAlerts > 2) {
      threatLevel = 'high';
    } else if (recentHighAlerts > 0 || last24hAlerts.length > 5) {
      threatLevel = 'medium';
    }

    // Generate timeline data for the last 7 days
    const timelineData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);

      const dayAlerts = mockSecurityAlerts.filter(alert => {
        const alertDate = new Date(alert.createdAt);
        return alertDate >= dayStart && alertDate <= dayEnd;
      });

      timelineData.push({
        date: date.toISOString().split('T')[0],
        threats: dayAlerts.length,
        blocked: dayAlerts.filter(alert => alert.status === 'blocked').length,
        resolved: dayAlerts.filter(alert => alert.status === 'resolved').length,
      });
    }

    // Top threat sources
    const topSources = {};
    mockSecurityAlerts.forEach(alert => {
      const source = alert.source.location || 'Unknown';
      topSources[source] = (topSources[source] || 0) + 1;
    });

    const topSourcesArray = Object.entries(topSources)
      .map(([location, count]) => ({ location, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        threatLevel,
        alertsLast24h: last24hAlerts.length,
        alertsLast7d: last7dAlerts.length,
        activeThreats: mockSecurityAlerts.filter(alert => ['new', 'investigating'].includes(alert.status)).length,
        blockedThreats: mockSecurityAlerts.filter(alert => alert.status === 'blocked').length,
        timelineData,
        topSources: topSourcesArray,
        recentAlerts: mockSecurityAlerts
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .slice(0, 5),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get alert types distribution
router.get('/metrics/types', checkPermission('security:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const typeDistribution = {};
    mockSecurityAlerts.forEach(alert => {
      typeDistribution[alert.type] = (typeDistribution[alert.type] || 0) + 1;
    });

    const typeData = Object.entries(typeDistribution).map(([type, count]) => ({
      type: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      count: count as number,
      percentage: Math.round(((count as number) / mockSecurityAlerts.length) * 100),
    }));

    res.json({
      success: true,
      data: typeData,
    });
  } catch (error) {
    next(error);
  }
});

export default router;