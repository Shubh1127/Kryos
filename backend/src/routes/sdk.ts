import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission, AuthenticatedRequest } from '../middleware/auth';
import { CustomError } from '../middleware/errorHandler';
import DataEntry from '../models/DataEntry';

const router = express.Router();

// Middleware to authenticate all SDK routes
router.use(authenticateApiKey);

// General SDK request logging endpoint - receives all demo backend requests
router.post('/requests', checkPermission('data:write'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const requestData = req.body;

    // Validate basic structure
    if (!requestData || typeof requestData !== 'object') {
      throw new CustomError('Invalid request data format', 400);
    }

    // Create a data entry for the SDK request
    const dataEntry = new DataEntry({
      company: req.company._id,
      type: requestData.type || 'api_request',
      source: requestData.source || 'demo-backend',
      data: requestData,
      metadata: {
        apiKeyId: req.apiKey._id,
        receivedAt: new Date(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        contentLength: JSON.stringify(requestData).length
      }
    });

    await dataEntry.save();

    // Update API key usage
    req.apiKey.usageCount += 1;
    req.apiKey.lastUsed = new Date();
    await req.apiKey.save();

    console.log(`📡 Received SDK request from ${requestData.source}:`, {
      type: requestData.type,
      method: requestData.data?.method,
      path: requestData.data?.path,
      company: req.company.name
    });

    res.status(200).json({
      success: true,
      message: 'Request data received successfully',
      data: {
        id: dataEntry._id,
        receivedAt: dataEntry.createdAt,
        company: req.company.name
      }
    });

  } catch (error) {
    next(error);
  }
});

// Batch SDK requests endpoint - for multiple requests at once
router.post('/requests/batch', checkPermission('data:write'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { requests } = req.body;

    if (!Array.isArray(requests) || requests.length === 0) {
      throw new CustomError('Requests array is required and cannot be empty', 400);
    }

    if (requests.length > 100) {
      throw new CustomError('Maximum 100 requests allowed per batch', 400);
    }

    const dataEntries = requests.map((requestData: any) => ({
      company: req.company._id,
      type: requestData.type || 'api_request',
      source: requestData.source || 'demo-backend',
      data: requestData,
      metadata: {
        apiKeyId: req.apiKey._id,
        receivedAt: new Date(),
        userAgent: req.get('User-Agent'),
        ipAddress: req.ip,
        batchSize: requests.length
      }
    }));

    const savedEntries = await DataEntry.insertMany(dataEntries);

    // Update API key usage
    req.apiKey.usageCount += requests.length;
    req.apiKey.lastUsed = new Date();
    await req.apiKey.save();

    console.log(`📡 Received ${requests.length} SDK requests from batch:`, {
      company: req.company.name,
      requestTypes: [...new Set(requests.map(r => r.type))]
    });

    res.status(200).json({
      success: true,
      message: `${requests.length} requests processed successfully`,
      data: {
        processed: savedEntries.length,
        company: req.company.name,
        receivedAt: new Date()
      }
    });

  } catch (error) {
    next(error);
  }
});

// Health check for SDK connectivity
router.get('/health', checkPermission('data:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    res.status(200).json({
      success: true,
      message: 'SDK endpoint is healthy',
      data: {
        company: req.company.name,
        apiKeyId: req.apiKey.keyId,
        timestamp: new Date(),
        permissions: req.apiKey.permissions
      }
    });
  } catch (error) {
    next(error);
  }
});

export default router;