const express = require('express');
const router = express.Router();
const {
  createTransaction,
  verifyPayment,
  getUserTransactions,
  getAllTransactions,
  updateTransactionStatus,
  getTransactionById,
  markTransactionCompleted,
  markTransactionFailed
} = require('../controllers/transactionController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// User transaction routes
router.post('/create', createTransaction);
router.post('/verify', verifyPayment);
router.post('/complete', markTransactionCompleted);
router.post('/failed', markTransactionFailed);
router.get('/', getUserTransactions);
router.get('/:transactionId', getTransactionById);

// Admin-only routes
router.get('/admin/all', authorize('admin'), getAllTransactions);
router.put('/:transactionId/status', authorize('admin'), updateTransactionStatus);

module.exports = router;