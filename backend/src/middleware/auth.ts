import { Request, Response, NextFunction } from 'express';
import ApiKey, { IApiKey } from '../models/ApiKey';
import Company, { ICompany } from '../models/Company';
import { CustomError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  company?: ICompany;
  apiKey?: IApiKey;
}

export const authenticateApiKey = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new CustomError('No API key provided', 401);
    }

    // Extract API key from Bearer token
    const apiKeyValue = authHeader.substring(7);
    
    // API key format: keyId.keySecret
    const [keyId, keySecret] = apiKeyValue.split('.');
    
    if (!keyId || !keySecret) {
      throw new CustomError('Invalid API key format', 401);
    }

    // Find API key in database
    const apiKey = await ApiKey.findOne({ 
      keyId, 
      isActive: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    }).populate('company');

    if (!apiKey) {
      throw new CustomError('Invalid or expired API key', 401);
    }

    // Validate the secret
    if (!apiKey.validateKey(keySecret)) {
      throw new CustomError('Invalid API key', 401);
    }

    // Check if company is active
    const company = await Company.findById(apiKey.company);
    if (!company || !company.isActive) {
      throw new CustomError('Company is not active', 401);
    }

    // Update usage statistics
    apiKey.usageCount += 1;
    apiKey.lastUsed = new Date();
    await apiKey.save();

    // Attach to request
    req.company = company;
    req.apiKey = apiKey;

    next();
  } catch (error) {
    next(error);
  }
};

export const checkPermission = (permission: string) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.apiKey || !req.apiKey.permissions.includes(permission)) {
      return next(new CustomError('Insufficient permissions', 403));
    }
    next();
  };
};