import mongoose, { Document, Schema, Model } from 'mongoose';
import crypto from 'crypto';

// Interface for the document methods
export interface IApiKeyMethods {
  validateKey(keySecret: string): boolean;
}

// Interface for static methods
export interface IApiKeyStatics {
  generateApiKey(): { keyId: string; keySecret: string; keyHash: string };
}

// Interface for the document
export interface IApiKey extends Document, IApiKeyMethods {
  keyId: string;
  keyHash: string;
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
      enum: ['data:write', 'data:read', 'files:upload', 'files:read'],
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
ApiKeySchema.statics.generateApiKey = function(): { keyId: string; keySecret: string; keyHash: string } {
  const keyId = crypto.randomBytes(16).toString('hex');
  const keySecret = crypto.randomBytes(32).toString('hex');
  const keyHash = crypto.createHash('sha256').update(keySecret).digest('hex');
  
  return { keyId, keySecret, keyHash };
};

// Method to validate API key
ApiKeySchema.methods.validateKey = function(keySecret: string): boolean {
  const keyHash = crypto.createHash('sha256').update(keySecret).digest('hex');
  return this.keyHash === keyHash;
};

export default mongoose.model<IApiKey, IApiKeyModel>('ApiKey', ApiKeySchema);