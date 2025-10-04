const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  razorpay_order_id: {
    type: String,
    required: true,
    index: true
  },
  razorpay_payment_id: {
    type: String,
    required: false,
    index: true
  },
  razorpay_signature: {
    type: String,
    required: false
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    uppercase: true
  },
  receiver: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true,
    default: ''
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'completed', 'failed', 'cancelled'],
    default: 'pending',
    index: true
  },
  signature_verified: {
    type: Boolean,
    required: false,
    default: false
  },
  failure_reason: {
    type: String,
    required: false,
    trim: true
  },
  notes: {
    type: Object,
    required: false,
    default: {}
  },
  // Additional metadata
  payment_method: {
    type: String,
    required: false
  },
  bank: {
    type: String,
    required: false
  },
  wallet: {
    type: String,
    required: false
  },
  created_at: {
    type: Date,
    default: Date.now,
    index: true
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Create compound indexes for efficient queries
transactionSchema.index({ userId: 1, created_at: -1 });
transactionSchema.index({ status: 1, created_at: -1 });
transactionSchema.index({ razorpay_order_id: 1, razorpay_payment_id: 1 });

// Instance methods
transactionSchema.methods.markAsCompleted = function() {
  this.status = 'completed';
  this.signature_verified = true;
  this.updated_at = new Date();
  return this.save();
};

transactionSchema.methods.markAsFailed = function(reason) {
  this.status = 'failed';
  this.failure_reason = reason;
  this.signature_verified = false;
  this.updated_at = new Date();
  return this.save();
};

transactionSchema.methods.updateStatus = function(status, additionalData = {}) {
  this.status = status;
  this.updated_at = new Date();
  
  // Update additional fields based on status
  Object.assign(this, additionalData);
  
  return this.save();
};

// Static methods
transactionSchema.statics.findByUserId = function(userId, options = {}) {
  const {
    page = 1,
    limit = 10,
    status = null,
    sortBy = 'created_at',
    sortOrder = -1
  } = options;

  let query = { userId };
  
  if (status) {
    query.status = status;
  }

  const skip = (page - 1) * limit;
  const sort = { [sortBy]: sortOrder };

  return this.find(query)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate('userId', 'name email');
};

transactionSchema.statics.getTransactionStats = function(userId = null) {
  const matchQuery = userId ? { userId: new mongoose.Types.ObjectId(userId) } : {};
  
  return this.aggregate([
    { $match: matchQuery },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $group: {
        _id: null,
        stats: {
          $push: {
            status: '$_id',
            count: '$count',
            totalAmount: '$totalAmount'
          }
        },
        totalTransactions: { $sum: '$count' },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);
};

module.exports = mongoose.model('Transaction', transactionSchema);