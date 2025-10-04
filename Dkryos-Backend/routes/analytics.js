const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

// Dashboard analytics endpoint
router.get('/dashboard', protect, async (req, res) => {
  try {
    console.log('📊 Dashboard analytics requested by user:', req.user.userId);

    // Get media count (from user's media array)
    const user = await User.findById(req.user.userId);
    const mediaCount = user ? user.media.length : 0;

    // Get transaction count
    const transactionCount = await Transaction.countDocuments({ 
      userId: req.user.userId 
    });

    // Get total users count (for admin users)
    let totalUsers = 0;
    if (req.user.role === 'admin') {
      totalUsers = await User.countDocuments({});
    }

    const analytics = {
      totalUsers: req.user.role === 'admin' ? totalUsers : 1, // Show 1 for regular users
      totalMedia: mediaCount,
      totalTransactions: transactionCount,
      totalApiKeys: 0, // Not applicable for Dkryos-Backend
    };

    console.log('📊 Analytics data:', analytics);

    res.status(200).json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('❌ Dashboard analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard analytics',
      error: error.message
    });
  }
});

// Get media statistics
router.get('/media-stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const mediaStats = {
      totalMedia: user.media.length,
      mediaByType: {},
      totalSize: 0
    };

    // Calculate media by type and total size
    user.media.forEach(media => {
      const type = media.resource_type || 'unknown';
      mediaStats.mediaByType[type] = (mediaStats.mediaByType[type] || 0) + 1;
      mediaStats.totalSize += media.bytes || 0;
    });

    res.status(200).json({
      success: true,
      data: mediaStats
    });
  } catch (error) {
    console.error('❌ Media stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch media statistics',
      error: error.message
    });
  }
});

// Get transaction statistics
router.get('/transaction-stats', protect, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.userId });
    
    const transactionStats = {
      totalTransactions: transactions.length,
      successfulTransactions: transactions.filter(t => t.status === 'completed').length,
      failedTransactions: transactions.filter(t => t.status === 'failed').length,
      pendingTransactions: transactions.filter(t => t.status === 'pending').length,
      totalAmount: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
      transactionsByStatus: {}
    };

    // Calculate transactions by status
    transactions.forEach(transaction => {
      const status = transaction.status || 'unknown';
      transactionStats.transactionsByStatus[status] = (transactionStats.transactionsByStatus[status] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      data: transactionStats
    });
  } catch (error) {
    console.error('❌ Transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction statistics',
      error: error.message
    });
  }
});

module.exports = router;
