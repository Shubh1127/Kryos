import express, { Request, Response, NextFunction } from 'express';
import ApiKey from '../models/ApiKey';
import Company from '../models/Company';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Generate new API key for a company
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId, name, description, permissions, expiresAt } = req.body;

    if (!companyId || !name) {
      throw new CustomError('Company ID and name are required', 400);
    }

    // Verify company exists
    const company = await Company.findById(companyId);
    if (!company) {
      throw new CustomError('Company not found', 404);
    }

    // Generate API key
    const { keyId, keySecret, keyHash } = (ApiKey as any).generateApiKey();

    const apiKey = new ApiKey({
      keyId,
      keyHash,
      company: companyId,
      name,
      description,
      permissions: permissions || ['data:write', 'files:upload'],
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    await apiKey.save();

    // Return the API key (only show secret once)
    res.status(201).json({
      success: true,
      data: {
        id: apiKey._id,
        keyId: apiKey.keyId,
        apiKey: `${keyId}.${keySecret}`, // Full API key for client
        name: apiKey.name,
        description: apiKey.description,
        permissions: apiKey.permissions,
        company: company.name,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      },
      message: 'API key generated successfully. Please store it securely as it won\'t be shown again.',
    });
  } catch (error) {
    next(error);
  }
});

// Get all API keys for a company
router.get('/company/:companyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const apiKeys = await ApiKey.find({ company: companyId })
      .select('-keyHash') // Don't expose the hash
      .populate('company', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await ApiKey.countDocuments({ company: companyId });

    res.json({
      success: true,
      data: apiKeys,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get API key details
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id)
      .select('-keyHash')
      .populate('company', 'name email');

    if (!apiKey) {
      throw new CustomError('API key not found', 404);
    }

    res.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
});

// Update API key (permissions, name, description, expiry)
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description, permissions, expiresAt, isActive } = req.body;

    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(permissions && { permissions }),
        ...(expiresAt !== undefined && { expiresAt: expiresAt ? new Date(expiresAt) : null }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, runValidators: true }
    ).select('-keyHash').populate('company', 'name email');

    if (!apiKey) {
      throw new CustomError('API key not found', 404);
    }

    res.json({
      success: true,
      data: apiKey,
    });
  } catch (error) {
    next(error);
  }
});

// Delete API key (deactivate)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!apiKey) {
      throw new CustomError('API key not found', 404);
    }

    res.json({
      success: true,
      message: 'API key deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Validate API key (for testing purposes)
router.post('/validate', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { apiKey: apiKeyValue } = req.body;

    if (!apiKeyValue) {
      throw new CustomError('API key is required', 400);
    }

    const [keyId, keySecret] = apiKeyValue.split('.');
    
    if (!keyId || !keySecret) {
      throw new CustomError('Invalid API key format', 400);
    }

    const apiKey = await ApiKey.findOne({ 
      keyId, 
      isActive: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    }).populate('company', 'name email isActive');

    if (!apiKey || !apiKey.validateKey(keySecret)) {
      throw new CustomError('Invalid or expired API key', 401);
    }

    if (!apiKey.company || !(apiKey.company as any).isActive) {
      throw new CustomError('Company is not active', 401);
    }

    res.json({
      success: true,
      data: {
        valid: true,
        apiKey: {
          id: apiKey._id,
          name: apiKey.name,
          permissions: apiKey.permissions,
          company: apiKey.company,
          usageCount: apiKey.usageCount,
          lastUsed: apiKey.lastUsed,
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;