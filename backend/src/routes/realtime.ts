import express, { Response, NextFunction } from 'express';
import { authenticateApiKey, checkPermission, AuthenticatedRequest } from '../middleware/auth';
import { webSocketService } from '../services/websocket';

const router = express.Router();

// Server-Sent Events endpoint for real-time dashboard updates
router.get('/stream', authenticateApiKey, checkPermission('dashboard:read'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = req.company._id.toString();
    const connectionId = webSocketService.setupSSE(companyId, res, req);
    
    console.log(`🔴 SSE connection established: ${connectionId} for company: ${companyId}`);
  } catch (error) {
    next(error);
  }
});

// Endpoint to get current connection stats (for debugging)
router.get('/stats', authenticateApiKey, checkPermission('dashboard:read'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const stats = webSocketService.getConnectionStats();
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint to manually trigger an event broadcast (for testing)
router.post('/broadcast', authenticateApiKey, checkPermission('dashboard:write'), (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { event, data } = req.body;
    const companyId = req.company._id.toString();
    
    webSocketService.broadcastToCompany(companyId, event, data);
    
    res.json({
      success: true,
      message: `Event '${event}' broadcasted to company ${companyId}`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;