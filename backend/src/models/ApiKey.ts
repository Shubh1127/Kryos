import mongoose, { Document, Schema, Model } from 'mongoose';
import crypto from 'crypto';

// Encryption key for API key secrets (in production, use environment variable)
const ENCRYPTION_KEY = process.env.API_SECRET_ENCRYPTION_KEY || 'your-32-character-secret-key-here';

// Interface for the document methods
export interface IApiKeyMethods {
  validateKey(keySecret: string): boolean;
  getDecryptedSecret(): string | null;
}

// Interface for static methods
export interface IApiKeyStatics {
  generateApiKey(): { keyId: string; keySecret: string; keyHash: string; keySecretEncrypted: string };
}

// Interface for the document
export interface IApiKey extends Document, IApiKeyMethods {
  keyId: string;
  keyHash: string;
  keySecretEncrypted?: string; // Encrypted secret for retrieval
  company: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  permissions: string[];
  usageCount: number;
  lastUsed?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interface for the model
export interface IApiKeyModel extends Model<IApiKey>, IApiKeyStatics {}

const ApiKeySchema: Schema = new Schema(
  {
    keyId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keyHash: {
      type: String,
      required: true,
    },
    keySecretEncrypted: {
      type: String,
      select: false, // Don't include by default for security
    },
    company: {
      type: Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company is required'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'API key name is required'],
      trim: true,
      maxlength: [100, 'API key name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    permissions: [{
      type: String,
      enum: [
        'data:write', 'data:read', 'files:upload', 'files:read',
        'analytics:read', 'security:read', 'security:write', 
        'dashboard:read', 'watchlist:read', 'companies:read',
        'companies:write', 'api-keys:read', 'api-keys:write'
      ],
      default: ['data:write', 'files:upload'],
    }],
    usageCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: Date,
    },
    expiresAt: {
      type: Date,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient API key validation
ApiKeySchema.index({ keyId: 1, isActive: 1 });
ApiKeySchema.index({ company: 1, isActive: 1 });

// Static method to generate API key
ApiKeySchema.statics.generateApiKey = function(): { keyId: string; keySecret: string; keyHash: string, keySecretEncrypted: string } {
  const keyId = crypto.randomBytes(16).toString('hex');
  const keySecret = crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(keySecret).digest('hex');
  
  // Encrypt the secret for storage
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
  let keySecretEncrypted = cipher.update(keySecret, 'utf8', 'hex');
  keySecretEncrypted += cipher.final('hex');
  keySecretEncrypted = iv.toString('hex') + ':' + keySecretEncrypted;
  
  return { keyId, keySecret, keyHash, keySecretEncrypted };
};

// Method to validate API key
ApiKeySchema.methods.validateKey = function(keySecret: string): boolean {
  const keyHash = crypto.createHash('sha256').update(keySecret).digest('hex');
  return this.keyHash === keyHash;
};

// Method to decrypt and get the secret
ApiKeySchema.methods.getDecryptedSecret = function(): string | null {
  if (!this.keySecretEncrypted) return null;
  
  try {
    const parts = this.keySecretEncrypted.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const encryptedData = parts[1];
    
    const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Error decrypting API key secret:', error);
    return null;
  }
};

export default mongoose.model<IApiKey, IApiKeyModel>('ApiKey', ApiKeySchema);