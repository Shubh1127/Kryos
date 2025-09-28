import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { config } from '../config/config';
import { CustomError } from '../middleware/errorHandler';

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${extension}`);
  },
});

// File filter function
const fileFilter = (req: any, file: any, cb: any) => {
  // Check file type
  if (!config.allowedFileTypes.includes(file.mimetype)) {
    return cb(new CustomError(`File type ${file.mimetype} is not allowed`, 400));
  }
  cb(null, true);
};

// Configure multer
export const upload = multer({
  storage,
  limits: {
    fileSize: config.maxFileSize,
    files: 10, // Maximum 10 files per request
  },
  fileFilter,
});

// Utility function to validate uploaded files
export const validateFiles = (files: any[]): void => {
  if (!files || files.length === 0) {
    return;
  }

  for (const file of files) {
    // Additional validation if needed
    if (file.size > config.maxFileSize) {
      throw new CustomError(`File ${file.originalname} exceeds size limit`, 400);
    }

    if (!config.allowedFileTypes.includes(file.mimetype)) {
      throw new CustomError(`File type ${file.mimetype} is not allowed`, 400);
    }
  }
};

// Utility function to get file info
export const getFileInfo = (file: any) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
  };
};