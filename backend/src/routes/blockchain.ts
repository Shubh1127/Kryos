import { Router, Request, Response, NextFunction } from 'express';
import { checkPermission } from '../middleware/auth';
import blockchainMiddleware from '../middleware/blockchain';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Get blockchain statistics
router.get('/stats', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blockchainService = blockchainMiddleware.getBlockchainService();
    
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not available'
      });
    }

    const [totalHashes, walletBalance, networkInfo, companyHashes] = await Promise.all([
      blockchainService.getTotalHashes(),
      blockchainService.getWalletBalance(),
      blockchainService.getNetworkInfo(),
      blockchainService.getDataHashesByCompany(req.company._id.toString())
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalHashes,
        walletBalance,
        networkInfo,
        companyHashes: {
          count: companyHashes.externalIds.length,
          hashes: companyHashes.dataHashes.slice(0, 10), // Last 10 hashes
          timestamps: companyHashes.timestamps.slice(0, 10)
        }
      }
    });
  } catch (error) {
    console.error('❌ Blockchain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blockchain statistics',
      error: error.message
    });
  }
});

// Get data hash by external ID
router.get('/hash/:externalId', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { externalId } = req.params;
    const blockchainService = blockchainMiddleware.getBlockchainService();
    
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not available'
      });
    }

    const dataHash = await blockchainService.getDataHash(externalId);
    
    if (!dataHash) {
      return res.status(404).json({
        success: false,
        message: 'Data hash not found'
      });
    }

    res.status(200).json({
      success: true,
      data: dataHash
    });
  } catch (error) {
    console.error('❌ Get data hash error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve data hash',
      error: error.message
    });
  }
});

// Get all data hashes for company
router.get('/company-hashes', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blockchainService = blockchainMiddleware.getBlockchainService();
    
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not available'
      });
    }

    const companyHashes = await blockchainService.getDataHashesByCompany(req.company._id.toString());

    res.status(200).json({
      success: true,
      data: {
        companyId: req.company._id.toString(),
        totalHashes: companyHashes.externalIds.length,
        hashes: companyHashes.externalIds.map((externalId, index) => ({
          externalId,
          dataType: companyHashes.dataTypes[index],
          dataHash: companyHashes.dataHashes[index],
          timestamp: companyHashes.timestamps[index]
        }))
      }
    });
  } catch (error) {
    console.error('❌ Get company hashes error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve company data hashes',
      error: error.message
    });
  }
});

// Verify data integrity
router.post('/verify', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { externalId, data } = req.body;
    
    if (!externalId || !data) {
      return res.status(400).json({
        success: false,
        message: 'External ID and data are required'
      });
    }

    const blockchainService = blockchainMiddleware.getBlockchainService();
    
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not available'
      });
    }

    // Get stored hash from blockchain
    const storedHash = await blockchainService.getDataHash(externalId);
    
    if (!storedHash) {
      return res.status(404).json({
        success: false,
        message: 'Data hash not found on blockchain'
      });
    }

    // Generate hash of provided data
    const currentHash = blockchainService.generateDataHash(data);
    
    // Compare hashes
    const isValid = currentHash === storedHash.dataHash;

    res.status(200).json({
      success: true,
      data: {
        externalId,
        isValid,
        storedHash: storedHash.dataHash,
        currentHash,
        timestamp: storedHash.timestamp,
        storedBy: storedHash.storedBy
      }
    });
  } catch (error) {
    console.error('❌ Verify data integrity error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify data integrity',
      error: error.message
    });
  }
});

// Get blockchain network status
router.get('/status', checkPermission('analytics:read'), async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const blockchainService = blockchainMiddleware.getBlockchainService();
    
    if (!blockchainService) {
      return res.status(503).json({
        success: false,
        message: 'Blockchain service not available'
      });
    }

    const [networkInfo, walletBalance, totalHashes] = await Promise.all([
      blockchainService.getNetworkInfo(),
      blockchainService.getWalletBalance(),
      blockchainService.getTotalHashes()
    ]);

    res.status(200).json({
      success: true,
      data: {
        status: 'connected',
        network: {
          chainId: networkInfo.chainId,
          blockNumber: networkInfo.blockNumber,
          gasPrice: networkInfo.gasPrice
        },
        wallet: {
          balance: walletBalance,
          address: process.env.BLOCKCHAIN_WALLET_ADDRESS || 'unknown'
        },
        contract: {
          address: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || 'unknown',
          totalHashes
        }
      }
    });
  } catch (error) {
    console.error('❌ Blockchain status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get blockchain status',
      error: error.message
    });
  }
});

export default router;
