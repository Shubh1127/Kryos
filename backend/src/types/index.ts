import { Request } from 'express';
import { Document } from 'mongoose';

export interface AuthenticatedRequest extends Request {
  company?: {
    _id: string;
    name: string;
    email: string;
    description?: string;
    website?: string;
    contactPerson: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  user?: {
    _id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    avatar?: {
      public_id: string;
      url: string;
    };
    isActive: 'active' | 'inactive' | 'suspended';
    lastLogin?: string;
    createdAt: string;
    updatedAt: string;
  };
  apiKey?: Document & {
    _id: string;
    keyId: string;
    keyHash: string;
    keySecretEncrypted?: string;
    company: string;
    name: string;
    description?: string;
    isActive: boolean;
    permissions: string[];
    usageCount: number;
    lastUsed?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    save(): Promise<Document>;
    validateKey(keySecret: string): boolean;
    getDecryptedSecret(): string | null;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
