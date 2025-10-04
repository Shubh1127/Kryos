const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer with dynamic user folders
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Get user ID from the authenticated request
    const userId = req.user ? req.user.userId : 'anonymous';
    const fileType = file.mimetype.startsWith('image/') ? 'images' : 
                    file.mimetype.startsWith('video/') ? 'videos' : 'documents';
    
    return {
      folder: `kryos/users/${userId}/${fileType}`, // Dynamic folder based on user ID and file type
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi', 'pdf', 'doc', 'docx'],
      resource_type: 'auto', // Automatically detect resource type
      public_id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${file.originalname.split('.')[0]}`, // Unique filename
      transformation: [
        { width: 1000, height: 1000, crop: 'limit' }, // Limit max size
        { quality: 'auto' } // Auto optimize quality
      ]
    };
  },
});

// Avatar-specific storage configuration
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const userId = req.user ? req.user.userId : 'anonymous';
    
    return {
      folder: `kryos/users/${userId}/avatar`, // Avatar-specific folder
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      resource_type: 'image',
      public_id: `avatar-${Date.now()}`, // Simple avatar filename
      transformation: [
        { width: 300, height: 300, crop: 'fill', gravity: 'face' }, // Square avatar crop
        { quality: 'auto' }
      ]
    };
  },
});

// Configure multer with Cloudinary storage for general media
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images, videos, and documents
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'video/mp4',
      'video/quicktime',
      'video/x-msvideo',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, videos, and documents are allowed.'), false);
    }
  }
});

// Configure multer with avatar-specific storage
const uploadAvatar = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
  },
  fileFilter: (req, file, cb) => {
    // Only allow images for avatars
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed for avatars.'), false);
    }
  }
});

// Helper function to delete file from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
};

// Helper function to get file details from Cloudinary
const getFileDetails = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId);
    return result;
  } catch (error) {
    throw new Error(`Failed to get file details: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  upload,
  uploadAvatar,
  deleteFromCloudinary,
  getFileDetails
};