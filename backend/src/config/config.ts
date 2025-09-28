import dotenv from 'dotenv';

dotenv.config();

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5000', 10),
  
  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/kryos_db',
  
  // JWT
  jwtSecret: process.env.JWT_SECRET || 'your_super_secret_jwt_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  
  // API Configuration
  apiKeyLength: parseInt(process.env.API_KEY_LENGTH || '32', 10),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'video/mp4',
    'video/avi',
    'video/mov'
  ],
  
  // Upload paths
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  tempPath: process.env.TEMP_PATH || './temp',
  
  // Rate limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  
  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',
};