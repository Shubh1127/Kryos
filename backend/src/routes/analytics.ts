import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';

// Import models
import User from '../models/User';
import DataEntry from '../models/DataEntry';
import MediaFile from '../models/MediaFile';
import ApiKey from '../models/ApiKey';
import Company from '../models/Company';

const router = express.Router();

// Middleware to authenticate all analytics routes
router.use(authenticateApiKey);

// Dashboard analytics endpoint
router.get('/dashboard', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company._id;
    console.log('🔍 Analytics Dashboard - Company ID:', companyId);
    console.log('🔍 Company Name:', req.company.name);

    // Get basic counts
    const [totalUsers, totalEntries, totalFiles, totalApiKeys] = await Promise.all([
      User.countDocuments({ company: companyId }),
      DataEntry.countDocuments({ company: companyId }),
      MediaFile.countDocuments({ company: companyId }),
      ApiKey.countDocuments({ company: companyId }),
    ]);

    console.log('📊 Counts - Users:', totalUsers, 'Entries:', totalEntries, 'Files:', totalFiles, 'API Keys:', totalApiKeys);

    // Debug: Check total counts without company filter
    const [totalUsersAll, totalEntriesAll, totalFilesAll, totalApiKeysAll] = await Promise.all([
      User.countDocuments({}),
      DataEntry.countDocuments({}),
      MediaFile.countDocuments({}),
      ApiKey.countDocuments({}),
    ]);
    console.log('📊 Total Counts (All Companies) - Users:', totalUsersAll, 'Entries:', totalEntriesAll, 'Files:', totalFilesAll, 'API Keys:', totalApiKeysAll);

    // Debug: Check what companies exist in data entries
    const dataEntriesCompanies = await DataEntry.distinct('company');
    console.log('🏢 Companies in DataEntries:', dataEntriesCompanies);
    
    // Debug: Check what companies exist in API keys
    const apiKeysCompanies = await ApiKey.distinct('company');
    console.log('🔑 Companies in ApiKeys:', apiKeysCompanies);

    // Get recent activity (last 10 data entries)
    const recentActivity = await DataEntry.find({ company: companyId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Generate traffic data for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trafficByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const requests = await DataEntry.countDocuments({
        company: companyId,
        createdAt: { $gte: startOfDay, $lte: endOfDay }
      });

      trafficByDay.push({
        date: date.toISOString().split('T')[0],
        requests,
        users: Math.floor(requests * 0.3) // Approximate unique users
      });
    }

    // Get event types distribution
    const eventTypes = await DataEntry.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$dataType', count: { $sum: 1 } } },
      { $project: { type: '$_id', count: 1, _id: 0 } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Generate mock security alerts (in a real implementation, these would come from a SecurityAlert model)
    const securityAlerts = [
      {
        _id: 'mock-1',
        type: 'suspicious_ip',
        severity: 'medium',
        source: {
          ip: '192.168.1.100',
          location: 'Unknown',
        },
        details: {
          attempts: 5,
          timeWindow: '5 minutes',
        },
        status: 'new',
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
      },
      {
        _id: 'mock-2',
        type: 'brute_force',
        severity: 'high',
        source: {
          ip: '10.0.0.55',
          userAgent: 'curl/7.68.0',
        },
        details: {
          endpoint: '/api/data/users',
          attempts: 15,
        },
        status: 'investigating',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
      },
    ];

    res.json({
      success: true,
      data: {
        totalUsers,
        totalEntries,
        totalFiles,
        totalApiKeys,
        recentActivity,
        trafficByDay,
        eventTypes,
        securityAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Traffic analytics endpoint
router.get('/traffic', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company._id;
    const { timeRange = '7d' } = req.query;

    let days = 7;
    if (timeRange === '24h') days = 1;
    else if (timeRange === '30d') days = 30;
    else if (timeRange === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get traffic data grouped by day
    const trafficData = await DataEntry.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          requests: { $sum: 1 },
          uniqueUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id',
          requests: 1,
          uniqueUsers: { $size: '$uniqueUsers' },
          _id: 0
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Get endpoint popularity
    const topEndpoints = await DataEntry.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$dataType',
          requests: { $sum: 1 }
        }
      },
      {
        $project: {
          endpoint: '$_id',
          requests: 1,
          change: { $literal: Math.floor(Math.random() * 20) - 10 }, // Mock change percentage
          _id: 0
        }
      },
      { $sort: { requests: -1 } },
      { $limit: 10 }
    ]);

    res.json({
      success: true,
      data: {
        trafficData,
        topEndpoints,
        summary: {
          totalRequests: await DataEntry.countDocuments({
            company: companyId,
            createdAt: { $gte: startDate }
          }),
          uniqueUsers: (await DataEntry.distinct('user', {
            company: companyId,
            createdAt: { $gte: startDate }
          })).length,
          avgResponseTime: Math.floor(Math.random() * 200) + 100, // Mock response time
        }
      },
    });
  } catch (error) {
    next(error);
  }
});

// User activity analytics
router.get('/users', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company._id;
    const { timeRange = '7d' } = req.query;

    let days = 7;
    if (timeRange === '24h') days = 1;
    else if (timeRange === '30d') days = 30;
    else if (timeRange === '90d') days = 90;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get user activity by hour (for heatmap)
    const userActivity = await DataEntry.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          activeUsers: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          hour: '$_id',
          activeUsers: { $size: '$activeUsers' },
          _id: 0
        }
      },
      { $sort: { hour: 1 } }
    ]);

    // Fill in missing hours with 0
    const completeActivity = Array.from({ length: 24 }, (_, hour) => {
      const existing = userActivity.find(activity => activity.hour === hour);
      return {
        hour,
        activeUsers: existing ? existing.activeUsers : 0
      };
    });

    // Get geographic distribution (mock data for now)
    const geographicData = [
      { country: 'United States', users: Math.floor(Math.random() * 1000) + 500, requests: Math.floor(Math.random() * 50000) + 10000 },
      { country: 'United Kingdom', users: Math.floor(Math.random() * 800) + 300, requests: Math.floor(Math.random() * 30000) + 8000 },
      { country: 'Germany', users: Math.floor(Math.random() * 600) + 200, requests: Math.floor(Math.random() * 20000) + 5000 },
      { country: 'Canada', users: Math.floor(Math.random() * 400) + 150, requests: Math.floor(Math.random() * 15000) + 3000 },
      { country: 'Australia', users: Math.floor(Math.random() * 300) + 100, requests: Math.floor(Math.random() * 10000) + 2000 },
    ];

    res.json({
      success: true,
      data: {
        userActivity: completeActivity,
        geographicData,
        totalActiveUsers: (await DataEntry.distinct('user', {
          company: companyId,
          createdAt: { $gte: startDate }
        })).length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;