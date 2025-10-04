import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission } from '../middleware/auth';
import { AuthenticatedRequest } from '../types';
import { CustomError } from '../middleware/errorHandler';

// Import models
import User from '../models/User';
import DataEntry from '../models/DataEntry';
import MediaFile from '../models/MediaFile';
import ApiKey from '../models/ApiKey';

const router = express.Router();

// Middleware to authenticate all analytics routes
router.use(authenticateApiKey);

// Simple counts endpoint for dashboard
router.get('/counts', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company._id;
    console.log('📊 Getting counts for company:', companyId);

    // Get basic counts for the company
    const [totalUsers, totalEntries, totalFiles, totalApiKeys] = await Promise.all([
      User.countDocuments({ company: companyId }),
      DataEntry.countDocuments({ company: companyId }),
      MediaFile.countDocuments({ company: companyId }),
      ApiKey.countDocuments({ company: companyId }),
    ]);

    console.log('📊 Company Counts - Users:', totalUsers, 'Entries:', totalEntries, 'Files:', totalFiles, 'API Keys:', totalApiKeys);

    // Also get global counts (all companies) for admin users
    let globalCounts = null;
    if (req.company.name === 'admin' || req.user?.role === 'admin') {
      const [globalUsers, globalEntries, globalFiles, globalApiKeys] = await Promise.all([
        User.countDocuments({}),
        DataEntry.countDocuments({}),
        MediaFile.countDocuments({}),
        ApiKey.countDocuments({}),
      ]);

      globalCounts = {
        totalUsers: globalUsers,
        totalEntries: globalEntries,
        totalFiles: globalFiles,
        totalApiKeys: globalApiKeys
      };

      console.log('📊 Global Counts - Users:', globalUsers, 'Entries:', globalEntries, 'Files:', globalFiles, 'API Keys:', globalApiKeys);
    }

    const response = {
      success: true,
      data: {
        company: {
          totalUsers,
          totalEntries,
          totalFiles,
          totalApiKeys
        },
        global: globalCounts,
        companyId: companyId.toString(),
        companyName: req.company.name
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('❌ Analytics counts error:', error);
    next(new CustomError('Failed to fetch analytics counts', 500));
  }
});

// Detailed analytics endpoint (existing dashboard endpoint)
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

    // Get recent activity (last 10 entries)
    const recentActivity = await DataEntry.find({ company: companyId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('externalId dataType createdAt')
      .lean();

    // Get traffic by day for the last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const trafficByDay = await DataEntry.aggregate([
      {
        $match: {
          company: companyId,
          createdAt: { $gte: sevenDaysAgo }
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
          users: { $addToSet: '$user' }
        }
      },
      {
        $project: {
          date: '$_id',
          requests: 1,
          users: { $size: '$users' }
        }
      },
      { $sort: { date: 1 } }
    ]);

    // Fill in missing days with zero values
    const trafficByDayMap = new Map();
    trafficByDay.forEach(day => {
      trafficByDayMap.set(day.date, day);
    });

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      if (trafficByDayMap.has(dateStr)) {
        last7Days.push(trafficByDayMap.get(dateStr));
      } else {
        last7Days.push({
          date: dateStr,
          requests: 0,
          users: 0
        });
      }
    }

    // Get event types distribution
    const eventTypes = await DataEntry.aggregate([
      { $match: { company: companyId } },
      { $group: { _id: '$dataType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Mock security alerts (you can implement real security monitoring later)
    const securityAlerts = [
      {
        _id: 'mock-1',
        type: 'suspicious_ip',
        severity: 'medium',
        source: {
          ip: '192.168.1.100',
          location: 'Unknown'
        },
        details: {
          attempts: 5,
          timeWindow: '5 minutes'
        },
        status: 'new',
        createdAt: new Date().toISOString()
      },
      {
        _id: 'mock-2',
        type: 'brute_force',
        severity: 'high',
        source: {
          ip: '10.0.0.55',
          userAgent: 'curl/7.68.0'
        },
        details: {
          endpoint: '/api/data/users',
          attempts: 15
        },
        status: 'investigating',
        createdAt: new Date().toISOString()
      }
    ];

    const dashboardData = {
      totalUsers,
      totalEntries,
      totalFiles,
      totalApiKeys,
      recentActivity,
      trafficByDay: last7Days,
      eventTypes,
      securityAlerts
    };

    console.log('✅ Dashboard data prepared successfully');

    res.status(200).json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    console.error('❌ Analytics dashboard error:', error);
    next(new CustomError('Failed to fetch dashboard analytics', 500));
  }
});

export default router;