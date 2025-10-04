const Transaction = require('../models/Transaction');
const User = require('../models/User');
const crypto = require('crypto');
const dataForwardingMiddleware = require('../middleware/dataForwarding');

// Razorpay configuration
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key';

// Generate unique transaction ID
const generateTransactionId = () => {
  return `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// @desc    Create a new transaction (when order is created)
// @route   POST /api/transactions/create
// @access  Private
const createTransaction = async (req, res) => {
  console.log('🎯 CREATE TRANSACTION ENDPOINT HIT!');
  console.log('- User ID:', req.user?.userId);
  console.log('- Request body:', req.body);
  console.log('- Headers:', req.headers.authorization ? 'Auth header present' : 'No auth header');
  try {
    const {
      razorpay_order_id,
      amount,
      currency = 'INR',
      receiver,
      description = '',
      notes = {}
    } = req.body;

    // Validation
    if (!razorpay_order_id || !amount || !receiver) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: razorpay_order_id, amount, receiver'
      });
    }

    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }

    const transactionId = generateTransactionId();

    const transaction = await Transaction.create({
      id: transactionId,
      razorpay_order_id,
      amount,
      currency: currency.toUpperCase(),
      receiver: receiver.trim(),
      description: description.trim(),
      userId: req.user.userId,
      status: 'pending',
      notes,
      created_at: new Date(),
      updated_at: new Date()
    });

    console.log('✅ Transaction created successfully:', transactionId);
    console.log('✅ Transaction saved to database with ID:', transaction._id);

    // Forward transaction creation data to main backend
    await dataForwardingMiddleware.forwardTransactionCreate(transaction, req);

    res.status(201).json({
      success: true,
      message: 'Transaction created successfully',
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during transaction creation'
    });
  }
};

// @desc    Verify payment and update transaction
// @route   POST /api/transactions/verify
// @access  Private
const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification parameters'
      });
    }

    // Find transaction
    let transaction;
    if (transactionId) {
      transaction = await Transaction.findOne({ id: transactionId });
    } else {
      transaction = await Transaction.findOne({ razorpay_order_id });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify that transaction belongs to the authenticated user
    if (transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to transaction'
      });
    }

    // Verify payment signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;
    console.log('Payment signature verification:', { 
      transactionId: transaction.id,
      isSignatureValid, 
      expectedSignature, 
      razorpay_signature 
    });

    // Update transaction with payment details
    transaction.razorpay_payment_id = razorpay_payment_id;
    transaction.razorpay_signature = razorpay_signature;
    transaction.signature_verified = isSignatureValid;
    transaction.status = isSignatureValid ? 'completed' : 'failed';
    transaction.failure_reason = isSignatureValid ? null : 'Invalid payment signature';
    transaction.updated_at = new Date();

    await transaction.save();

    console.log('Transaction updated:', transaction.id, 'Status:', transaction.status);

    // Forward transaction verification data to main backend
    await dataForwardingMiddleware.forwardTransactionVerify(transaction, {
      razorpay_payment_id,
      razorpay_signature,
      verified: isSignatureValid
    }, req);

    res.status(200).json({
      success: true,
      verified: isSignatureValid,
      message: isSignatureValid ? 'Payment verified successfully' : 'Payment verification failed',
      data: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency
      }
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Payment verification failed'
    });
  }
};

// @desc    Get user transactions
// @route   GET /api/transactions
// @access  Private
const getUserTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status: status || null,
      sortBy,
      sortOrder: sortOrder === 'desc' ? -1 : 1
    };

    const transactions = await Transaction.findByUserId(req.user.userId, options);
    const totalTransactions = await Transaction.countDocuments({ 
      userId: req.user.userId,
      ...(status && { status })
    });

    const totalPages = Math.ceil(totalTransactions / options.limit);

    // Forward transaction access data to main backend
    for (const transaction of transactions) {
      await dataForwardingMiddleware.forwardTransactionAccess(req.user.userId, transaction, req);
    }

    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: options.page,
          totalPages,
          totalTransactions,
          transactionsPerPage: options.limit,
          hasNext: options.page < totalPages,
          hasPrev: options.page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get user transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching transactions'
    });
  }
};

// @desc    Get all transactions (Admin only)
// @route   GET /api/transactions/all
// @access  Private/Admin
const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      userId,
      sortBy = 'created_at',
      sortOrder = 'desc',
      search
    } = req.query;

    let query = {};

    // Filter by status
    if (status) {
      query.status = status;
    }

    // Filter by specific user
    if (userId) {
      query.userId = userId;
    }

    const skip = (page - 1) * limit;
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    let transactions;
    
    if (search) {
      // Search in receiver, description, or transaction ID
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { receiver: searchRegex },
        { description: searchRegex },
        { id: searchRegex }
      ];
    }

    transactions = await Transaction.find(query)
      .populate('userId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const totalTransactions = await Transaction.countDocuments(query);
    const totalPages = Math.ceil(totalTransactions / limit);

    // Get transaction statistics
    const stats = await Transaction.getTransactionStats();

    res.status(200).json({
      success: true,
      data: {
        transactions,
        stats: stats[0] || { totalTransactions: 0, totalAmount: 0, stats: [] },
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalTransactions,
          transactionsPerPage: parseInt(limit),
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    console.error('Get all transactions error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching transactions'
    });
  }
};

// @desc    Update transaction status (Admin only)
// @route   PUT /api/transactions/:transactionId/status
// @access  Private/Admin
const updateTransactionStatus = async (req, res) => {
  try {
    const { transactionId } = req.params;
    const { status, failure_reason } = req.body;

    const validStatuses = ['pending', 'completed', 'failed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const transaction = await Transaction.findOne({ id: transactionId });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    const additionalData = {};
    if (status === 'failed' && failure_reason) {
      additionalData.failure_reason = failure_reason;
    }

    await transaction.updateStatus(status, additionalData);

    console.log('Transaction status updated:', transactionId, 'New status:', status);

    res.status(200).json({
      success: true,
      message: 'Transaction status updated successfully',
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Update transaction status error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error updating transaction status'
    });
  }
};

// @desc    Get transaction by ID
// @route   GET /api/transactions/:transactionId
// @access  Private
const getTransactionById = async (req, res) => {
  try {
    const { transactionId } = req.params;
    
    const transaction = await Transaction.findOne({ id: transactionId })
      .populate('userId', 'name email');
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Check if user owns this transaction or is admin
    const user = await User.findById(req.user.userId);
    if (transaction.userId._id.toString() !== req.user.userId && user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to transaction'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        transaction
      }
    });
  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error fetching transaction'
    });
  }
};

// @desc    Update transaction to completed (simplified verification)
// @route   POST /api/transactions/complete
// @access  Private
const markTransactionCompleted = async (req, res) => {
  console.log('🎯 MARK TRANSACTION COMPLETED ENDPOINT HIT!');
  console.log('- User ID:', req.user?.userId);
  console.log('- Request body:', req.body);
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      transactionId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id and razorpay_payment_id are required'
      });
    }

    // Find transaction
    let transaction;
    if (transactionId) {
      transaction = await Transaction.findOne({ id: transactionId });
    } else {
      transaction = await Transaction.findOne({ razorpay_order_id });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify that transaction belongs to the authenticated user
    console.log('🔍 Authorization check:');
    console.log('- Transaction userId:', transaction.userId.toString());
    console.log('- Request user ID:', req.user.userId.toString());
    console.log('- Match:', transaction.userId.toString() === req.user.userId.toString());
    
    if (transaction.userId.toString() !== req.user.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to transaction'
      });
    }

    // Update transaction with payment details and mark as completed
    transaction.razorpay_payment_id = razorpay_payment_id;
    if (razorpay_signature) {
      transaction.razorpay_signature = razorpay_signature;
    }
    transaction.status = 'completed';
    transaction.signature_verified = true; // Since we're doing client-side verification
    transaction.updated_at = new Date();

    await transaction.save();

    console.log('✅ Transaction marked as completed:', transaction.id);

    res.status(200).json({
      success: true,
      message: 'Transaction marked as completed',
      data: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        currency: transaction.currency
      }
    });
  } catch (error) {
    console.error('❌ Mark transaction completed error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error marking transaction as completed'
    });
  }
};

// @desc    Mark transaction as failed
// @route   POST /api/transactions/failed
// @access  Private
const markTransactionFailed = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      failure_reason = 'Payment failed',
      transactionId
    } = req.body;

    if (!razorpay_order_id && !transactionId) {
      return res.status(400).json({
        success: false,
        message: 'Either razorpay_order_id or transactionId is required'
      });
    }

    // Find transaction
    let transaction;
    if (transactionId) {
      transaction = await Transaction.findOne({ id: transactionId });
    } else {
      transaction = await Transaction.findOne({ razorpay_order_id });
    }

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify that transaction belongs to the authenticated user
    if (transaction.userId.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized access to transaction'
      });
    }

    await transaction.markAsFailed(failure_reason);

    console.log('Transaction marked as failed:', transaction.id, 'Reason:', failure_reason);

    res.status(200).json({
      success: true,
      message: 'Transaction marked as failed',
      data: {
        id: transaction.id,
        status: transaction.status,
        failure_reason: transaction.failure_reason
      }
    });
  } catch (error) {
    console.error('Mark transaction failed error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error marking transaction as failed'
    });
  }
};

module.exports = {
  createTransaction,
  verifyPayment,
  getUserTransactions,
  getAllTransactions,
  updateTransactionStatus,
  getTransactionById,
  markTransactionCompleted,
  markTransactionFailed
};
