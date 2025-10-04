import MockBlockchainService from '../services/mockBlockchain';
import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  company?: any;
  user?: any;
}

class BlockchainMiddleware {
  private blockchainService: MockBlockchainService;

  constructor() {
    try {
      this.blockchainService = new MockBlockchainService();
      console.log('🔗 Blockchain middleware initialized (Mock Mode)');
    } catch (error) {
      console.error('❌ Failed to initialize blockchain middleware:', error);
      // Continue without blockchain functionality
      this.blockchainService = null as any;
    }
  }

  /**
   * Middleware to hash and store data on blockchain
   */
  async hashAndStoreData(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Skip if blockchain service is not available
      if (!this.blockchainService) {
        console.log('⚠️ Blockchain service not available, skipping hash storage');
        return next();
      }

      // Only process POST, PUT, PATCH requests
      if (!['POST', 'PUT', 'PATCH'].includes(req.method)) {
        return next();
      }

      // Skip certain routes
      const skipRoutes = ['/api/auth/login', '/api/auth/register', '/api/analytics'];
      if (skipRoutes.some(route => req.path.startsWith(route))) {
        return next();
      }

      // Get company ID from request
      const companyId = req.company?._id?.toString() || 'unknown';
      
      // Create external ID
      const externalId = `${req.method.toLowerCase()}_${companyId}_${Date.now()}`;
      
      // Prepare data for hashing
      const dataToHash = {
        method: req.method,
        path: req.path,
        body: req.body,
        query: req.query,
        params: req.params,
        timestamp: new Date().toISOString(),
        companyId,
        userId: req.user?._id?.toString() || 'anonymous'
      };

      // Determine data type based on route
      let dataType = 'custom_data';
      if (req.path.includes('/users')) dataType = 'user_data';
      else if (req.path.includes('/transactions')) dataType = 'transaction_data';
      else if (req.path.includes('/files')) dataType = 'file_data';

      console.log('🔐 Processing blockchain hash for:', externalId);

      // Store hash on blockchain (async, don't wait)
      this.blockchainService.storeDataHash(
        externalId,
        dataType,
        dataToHash,
        companyId
      ).then(result => {
        console.log('✅ Data hash stored on blockchain:', result.txHash);
        
        // Add blockchain info to response headers
        res.set('X-Blockchain-Hash', result.dataHash);
        res.set('X-Blockchain-Tx', result.txHash);
        res.set('X-Blockchain-Block', result.blockNumber.toString());
      }).catch(error => {
        console.error('❌ Failed to store hash on blockchain:', error);
      });

      // Continue with the request
      next();
    } catch (error) {
      console.error('❌ Blockchain middleware error:', error);
      // Continue even if blockchain fails
      next();
    }
  }

  /**
   * Middleware to add blockchain info to responses
   */
  async addBlockchainInfo(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      if (!this.blockchainService) {
        return next();
      }

      // Get blockchain stats
      const totalHashes = await this.blockchainService.getTotalHashes();
      const walletBalance = await this.blockchainService.getWalletBalance();
      const networkInfo = await this.blockchainService.getNetworkInfo();

      // Add blockchain info to response
      res.set('X-Blockchain-Total-Hashes', totalHashes.toString());
      res.set('X-Blockchain-Wallet-Balance', walletBalance);
      res.set('X-Blockchain-Network', networkInfo.chainId.toString());

      next();
    } catch (error) {
      console.error('❌ Failed to add blockchain info:', error);
      next();
    }
  }

  /**
   * Get blockchain service instance
   */
  getBlockchainService(): MockBlockchainService | null {
    return this.blockchainService;
  }
}

export default new BlockchainMiddleware();
