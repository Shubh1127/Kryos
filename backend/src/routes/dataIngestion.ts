import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission, AuthenticatedRequest } from '../middleware/auth';
import { upload, validateFiles, getFileInfo } from '../utils/fileUpload';
import { dataEntrySchema, userDataSchema } from '../utils/validation';
import { CustomError } from '../middleware/errorHandler';

// Import models
import User from '../models/User';
import DataEntry from '../models/DataEntry';
import MediaFile from '../models/MediaFile';

const router = express.Router();

// Middleware to authenticate all data ingestion routes
router.use(authenticateApiKey);

// Submit user data with optional files
router.post('/users', checkPermission('data:write'), upload.array('files'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = userDataSchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { externalId, name, email, phone, metadata } = value;
    const files = req.files as any[];

    // Validate uploaded files
    if (files) {
      validateFiles(files);
    }

    // Check if user already exists for this company
    let user = await User.findOne({ externalId, company: req.company._id });

    if (user) {
      // Update existing user
      user.name = name;
      user.email = email;
      user.phone = phone;
      user.metadata = { ...user.metadata, ...metadata };
      await user.save();
    } else {
      // Create new user
      user = new User({
        externalId,
        company: req.company._id,
        name,
        email,
        phone,
        metadata,
      });
      await user.save();
    }

    // Handle file uploads
    let uploadedFiles: any[] = [];
    if (files && files.length > 0) {
      if (!req.apiKey.permissions.includes('files:upload')) {
        throw new CustomError('Insufficient permissions to upload files', 403);
      }

      for (const file of files) {
        const fileInfo = getFileInfo(file);
        const mediaFile = new MediaFile({
          ...fileInfo,
          company: req.company._id,
          user: user._id,
          metadata: {
            uploadedBy: 'api',
            relatedTo: 'user_data',
          },
        });
        await mediaFile.save();
        uploadedFiles.push(mediaFile);
      }
    }

    res.status(201).json({
      success: true,
      data: {
        user,
        files: uploadedFiles,
      },
      message: user.isNew ? 'User created successfully' : 'User updated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Submit general data entry with optional files
router.post('/entries', checkPermission('data:write'), upload.array('files'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const { error, value } = dataEntrySchema.validate(req.body);
    if (error) {
      throw new CustomError(error.details[0].message, 400);
    }

    const { externalId, user: userData, dataType, data, tags } = value;
    const files = req.files as any[];

    // Validate uploaded files
    if (files) {
      validateFiles(files);
    }

    let user = null;
    
    // Handle user data if provided
    if (userData) {
      user = await User.findOne({ 
        externalId: userData.externalId, 
        company: req.company._id 
      });

      if (!user) {
        // Create new user
        user = new User({
          externalId: userData.externalId,
          company: req.company._id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          metadata: userData.metadata || {},
        });
        await user.save();
      }
    }

    // Handle file uploads
    let uploadedFiles: any[] = [];
    if (files && files.length > 0) {
      if (!req.apiKey.permissions.includes('files:upload')) {
        throw new CustomError('Insufficient permissions to upload files', 403);
      }

      for (const file of files) {
        const fileInfo = getFileInfo(file);
        const mediaFile = new MediaFile({
          ...fileInfo,
          company: req.company._id,
          user: user?._id,
          metadata: {
            uploadedBy: 'api',
            relatedTo: dataType,
          },
        });
        await mediaFile.save();
        uploadedFiles.push(mediaFile);
      }
    }

    // Create data entry
    const dataEntry = new DataEntry({
      externalId,
      company: req.company._id,
      user: user?._id,
      dataType,
      data,
      files: uploadedFiles.map(f => f._id),
      tags: tags || [],
    });

    await dataEntry.save();

    res.status(201).json({
      success: true,
      data: {
        entry: dataEntry,
        user,
        files: uploadedFiles,
      },
      message: 'Data entry created successfully',
    });
  } catch (error) {
    next(error);
  }
});

// Get user data
router.get('/users', checkPermission('data:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ company: req.company._id })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({ company: req.company._id });

    res.json({
      success: true,
      data: users,
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

// Get data entries
router.get('/entries', checkPermission('data:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { dataType, userId, tags } = req.query;

    // Build query
    const query: any = { company: req.company._id };
    if (dataType) query.dataType = dataType;
    if (userId) query.user = userId;
    if (tags) query.tags = { $in: (tags as string).split(',') };

    const entries = await DataEntry.find(query)
      .populate('user', 'name email externalId')
      .populate('files', 'originalName filename mimetype size')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await DataEntry.countDocuments(query);

    res.json({
      success: true,
      data: entries,
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

// Get files
router.get('/files', checkPermission('files:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const { mimetype, userId } = req.query;

    // Build query
    const query: any = { company: req.company._id };
    if (mimetype) query.mimetype = new RegExp(mimetype as string, 'i');
    if (userId) query.user = userId;

    const files = await MediaFile.find(query)
      .populate('user', 'name email externalId')
      .skip(skip)
      .limit(limit)
      .sort({ uploadedAt: -1 });

    const total = await MediaFile.countDocuments(query);

    res.json({
      success: true,
      data: files,
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

// Health check endpoint for API key validation
router.get('/health', async (req: AuthenticatedRequest, res: Response) => {
  res.json({
    success: true,
    message: 'API key is valid and active',
    company: req.company.name,
    permissions: req.apiKey.permissions,
    timestamp: new Date().toISOString(),
  });
});

export default router;