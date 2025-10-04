/**
 * Data Forwarding Middleware for Kryos SDK
 * 
 * This middleware captures all database operations and forwards them to the main backend
 * through the Kryos SDK. It handles:
 * - User operations (register, login, profile updates, file uploads)
 * - Transaction operations (create, verify, update status)
 * - File operations (upload, download, delete)
 */

const { sendEntry, sendEvent, sendError } = require('../kryosSdk');

class DataForwardingMiddleware {
  constructor() {
    this.operationTypes = {
      // User operations
      USER_REGISTER: 'user_register',
      USER_LOGIN: 'user_login',
      USER_LOGOUT: 'user_logout',
      USER_PROFILE_UPDATE: 'user_profile_update',
      USER_PASSWORD_CHANGE: 'user_password_change',
      USER_AVATAR_UPLOAD: 'user_avatar_upload',
      USER_MEDIA_UPLOAD: 'user_media_upload',
      USER_MEDIA_DOWNLOAD: 'user_media_download',
      USER_MEDIA_DELETE: 'user_media_delete',
      USER_ACCOUNT_DELETE: 'user_account_delete',
      
      // Transaction operations
      TRANSACTION_CREATE: 'transaction_create',
      TRANSACTION_VERIFY: 'transaction_verify',
      TRANSACTION_COMPLETE: 'transaction_complete',
      TRANSACTION_FAILED: 'transaction_failed',
      TRANSACTION_STATUS_UPDATE: 'transaction_status_update',
      TRANSACTION_ACCESS: 'transaction_access',
      
      // File operations
      FILE_UPLOAD: 'file_upload',
      FILE_DOWNLOAD: 'file_download',
      FILE_DELETE: 'file_delete',
      
      // Admin operations
      ADMIN_USER_STATUS_UPDATE: 'admin_user_status_update',
      ADMIN_TRANSACTION_UPDATE: 'admin_transaction_update'
    };
  }

  /**
   * Forward user registration data
   */
  async forwardUserRegister(userData, req) {
    try {
      const payload = {
        externalId: `user_${userData._id}`,
        dataType: 'user_data',
        data: {
          operation: this.operationTypes.USER_REGISTER,
          user: {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role,
            isActive: userData.isActive,
            createdAt: userData.createdAt
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['user', 'register', 'authentication']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] User registration forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward user registration:', error.message);
    }
  }

  /**
   * Forward user login data
   */
  async forwardUserLogin(userData, req) {
    try {
      const payload = {
        externalId: `login_${userData._id}_${Date.now()}`,
        dataType: 'user_data',
        data: {
          operation: this.operationTypes.USER_LOGIN,
          user: {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['user', 'login', 'authentication']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] User login forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward user login:', error.message);
    }
  }

  /**
   * Forward user logout data
   */
  async forwardUserLogout(userData, req) {
    try {
      const payload = {
        externalId: `logout_${userData._id}_${Date.now()}`,
        dataType: 'user_data',
        data: {
          operation: this.operationTypes.USER_LOGOUT,
          user: {
            id: userData._id,
            name: userData.name,
            email: userData.email,
            role: userData.role
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['user', 'logout', 'authentication']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] User logout forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward user logout:', error.message);
    }
  }

  /**
   * Forward user profile update data
   */
  async forwardUserProfileUpdate(userId, updateData, req) {
    try {
      const payload = {
        externalId: `profile_update_${userId}_${Date.now()}`,
        dataType: 'user_data',
        data: {
          operation: this.operationTypes.USER_PROFILE_UPDATE,
          user: {
            id: userId,
            updates: updateData
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['user', 'profile', 'update']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] User profile update forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward profile update:', error.message);
    }
  }

  /**
   * Forward password change data
   */
  async forwardPasswordChange(userId, req) {
    try {
      const payload = {
        externalId: `password_change_${userId}_${Date.now()}`,
        dataType: 'user_data',
        data: {
          operation: this.operationTypes.USER_PASSWORD_CHANGE,
          user: {
            id: userId
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['user', 'password', 'security']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] Password change forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward password change:', error.message);
    }
  }

  /**
   * Forward file upload data
   */
  async forwardFileUpload(userId, fileData, operationType, req) {
    try {
      const payload = {
        externalId: `file_${operationType}_${userId}_${Date.now()}`,
        dataType: 'custom_data', // Changed from 'file_data' to 'custom_data'
        data: {
          operation: operationType,
          user: {
            id: userId
          },
          file: {
            filename: fileData.filename || fileData.originalname,
            mimetype: fileData.mimetype,
            size: fileData.size,
            url: fileData.url || fileData.secure_url,
            publicId: fileData.public_id
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['file', 'upload', operationType.includes('avatar') ? 'avatar' : 'media']
      };

      await sendEntry(payload);
      console.log(`📤 [DataForwarding] File ${operationType} forwarded to main backend`);
    } catch (error) {
      console.error(`❌ [DataForwarding] Failed to forward file ${operationType}:`, error.message);
    }
  }

  /**
   * Forward file download/access data
   */
  async forwardFileAccess(userId, fileData, operationType, req) {
    try {
      const payload = {
        externalId: `file_${operationType}_${userId}_${Date.now()}`,
        dataType: 'custom_data', // Changed from 'file_data' to 'custom_data'
        data: {
          operation: operationType,
          user: {
            id: userId
          },
          file: {
            filename: fileData.filename,
            mimetype: fileData.mimetype,
            size: fileData.size,
            url: fileData.url
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['file', 'access', operationType]
      };

      await sendEntry(payload);
      console.log(`📤 [DataForwarding] File ${operationType} forwarded to main backend`);
    } catch (error) {
      console.error(`❌ [DataForwarding] Failed to forward file ${operationType}:`, error.message);
    }
  }

  /**
   * Forward transaction creation data
   */
  async forwardTransactionCreate(transactionData, req) {
    try {
      const payload = {
        externalId: `transaction_create_${transactionData._id}`,
        dataType: 'custom_data', // Changed from 'transaction_data' to 'custom_data'
        data: {
          operation: this.operationTypes.TRANSACTION_CREATE,
          transaction: {
            id: transactionData.id,
            razorpay_order_id: transactionData.razorpay_order_id,
            amount: transactionData.amount,
            currency: transactionData.currency,
            receiver: transactionData.receiver,
            description: transactionData.description,
            status: transactionData.status,
            userId: transactionData.userId,
            createdAt: transactionData.created_at
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['transaction', 'create', 'payment']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] Transaction creation forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward transaction creation:', error.message);
    }
  }

  /**
   * Forward transaction verification data
   */
  async forwardTransactionVerify(transactionData, verificationData, req) {
    try {
      const payload = {
        externalId: `transaction_verify_${transactionData._id}`,
        dataType: 'custom_data', // Changed from 'transaction_data' to 'custom_data'
        data: {
          operation: this.operationTypes.TRANSACTION_VERIFY,
          transaction: {
            id: transactionData.id,
            razorpay_order_id: transactionData.razorpay_order_id,
            razorpay_payment_id: verificationData.razorpay_payment_id,
            amount: transactionData.amount,
            currency: transactionData.currency,
            status: transactionData.status,
            userId: transactionData.userId
          },
          verification: {
            signature: verificationData.razorpay_signature,
            verified: verificationData.verified
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['transaction', 'verify', 'payment']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] Transaction verification forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward transaction verification:', error.message);
    }
  }

  /**
   * Forward transaction status update data
   */
  async forwardTransactionStatusUpdate(transactionData, newStatus, req) {
    try {
      const payload = {
        externalId: `transaction_status_${transactionData._id}_${Date.now()}`,
        dataType: 'custom_data', // Changed from 'transaction_data' to 'custom_data'
        data: {
          operation: this.operationTypes.TRANSACTION_STATUS_UPDATE,
          transaction: {
            id: transactionData.id,
            razorpay_order_id: transactionData.razorpay_order_id,
            amount: transactionData.amount,
            currency: transactionData.currency,
            userId: transactionData.userId,
            previousStatus: transactionData.status,
            newStatus: newStatus
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['transaction', 'status', 'update']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] Transaction status update forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward transaction status update:', error.message);
    }
  }

  /**
   * Forward transaction access data
   */
  async forwardTransactionAccess(userId, transactionData, req) {
    try {
      const payload = {
        externalId: `transaction_access_${transactionData._id}_${Date.now()}`,
        dataType: 'custom_data', // Changed from 'transaction_data' to 'custom_data'
        data: {
          operation: this.operationTypes.TRANSACTION_ACCESS,
          transaction: {
            id: transactionData.id,
            razorpay_order_id: transactionData.razorpay_order_id,
            amount: transactionData.amount,
            currency: transactionData.currency,
            status: transactionData.status,
            userId: transactionData.userId
          },
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['transaction', 'access', 'view']
      };

      await sendEntry(payload);
      console.log('📤 [DataForwarding] Transaction access forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward transaction access:', error.message);
    }
  }

  /**
   * Forward admin operations
   */
  async forwardAdminOperation(operationType, targetId, adminUserId, operationData, req) {
    try {
      const payload = {
        externalId: `admin_${operationType}_${targetId}_${Date.now()}`,
        dataType: 'custom_data', // Changed from 'admin_data' to 'custom_data'
        data: {
          operation: operationType,
          admin: {
            id: adminUserId
          },
          target: {
            id: targetId,
            type: operationData.targetType || 'unknown'
          },
          changes: operationData.changes || {},
          metadata: {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            timestamp: new Date().toISOString()
          }
        },
        tags: ['admin', 'operation', operationType]
      };

      await sendEntry(payload);
      console.log(`📤 [DataForwarding] Admin ${operationType} forwarded to main backend`);
    } catch (error) {
      console.error(`❌ [DataForwarding] Failed to forward admin ${operationType}:`, error.message);
    }
  }

  /**
   * Forward error data
   */
  async forwardError(errorData, req) {
    try {
      await sendError({
        message: errorData.message,
        stack: errorData.stack,
        code: errorData.code,
        severity: errorData.severity || 'error',
        context: {
          url: req.originalUrl,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          userId: req.user?.userId
        }
      });
      console.log('📤 [DataForwarding] Error forwarded to main backend');
    } catch (error) {
      console.error('❌ [DataForwarding] Failed to forward error:', error.message);
    }
  }
}

// Create singleton instance
const dataForwardingMiddleware = new DataForwardingMiddleware();

module.exports = dataForwardingMiddleware;
