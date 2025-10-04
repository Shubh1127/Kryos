const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { upload, uploadAvatar: avatarUploadMiddleware, deleteFromCloudinary } = require('../config/cloudinary');
const dataForwardingMiddleware = require('../middleware/dataForwarding');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your-secret-key', {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      password
    });

    // Generate token
    const token = generateToken(user._id);

    // Forward user registration data to main backend
    await dataForwardingMiddleware.forwardUserRegister(user, req);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: user.toAuthJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during registration'
    });
  }
};

// @desc    Login user
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    console.log("requesting is coming",req.body)
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Authenticate user
    const user = await User.getAuthenticated(email, password);

    // Generate token
    const token = generateToken(user._id);

    // Forward user login data to main backend
    await dataForwardingMiddleware.forwardUserLogin(user, req);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: user.toAuthJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Invalid credentials'
    });
  }
};

// @desc    Get current user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).populate('media');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: user.toAuthJSON(),
        mediaCount: user.media.length
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const user = await User.findById(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email is already taken'
        });
      }
      user.email = email;
    }

    // Update fields
    const updateData = {};
    if (name) {
      user.name = name;
      updateData.name = name;
    }
    if (password) {
      user.password = password; // Will be hashed by pre-save middleware
      updateData.password = '***'; // Don't log actual password
    }
    if (email && email !== user.email) {
      updateData.email = email;
    }

    await user.save();

    // Forward profile update data to main backend
    await dataForwardingMiddleware.forwardUserProfileUpdate(user._id, updateData, req);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: user.toAuthJSON()
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
    });
  }
};

// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Forward user logout data to main backend
    await dataForwardingMiddleware.forwardUserLogout(user, req);

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error during logout'
    });
  }
};

// @desc    Upload avatar
// @route   POST /api/users/avatar
// @access  Private
const uploadAvatar = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    // Delete old avatar if exists
    if (user.avatar && user.avatar.public_id) {
      try {
        await deleteFromCloudinary(user.avatar.public_id);
      } catch (error) {
        console.warn('Failed to delete old avatar:', error.message);
      }
    }

    console.log('🖼️ Processing avatar upload:', JSON.stringify(req.file, null, 2));
    console.log('🖼️ File keys:', Object.keys(req.file));

    // Update avatar
    const avatarData = {
      public_id: req.file.filename || req.file.publicId || req.file.public_id, // Cloudinary public_id
      url: req.file.path || req.file.url || req.file.secure_url // Cloudinary secure URL
    };
    
    console.log('💾 Avatar data to save:', avatarData);

    await user.updateAvatar(avatarData);

    // Forward avatar upload data to main backend
    await dataForwardingMiddleware.forwardFileUpload(
      user._id, 
      req.file, 
      dataForwardingMiddleware.operationTypes.USER_AVATAR_UPLOAD, 
      req
    );

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: avatarData,
        url: avatarData.url
      }
    });
  } catch (error) {
    console.error('Upload avatar error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during avatar upload'
    });
  }
};

// @desc    Upload media files
// @route   POST /api/users/media
// @access  Private
const uploadMedia = async (req, res) => {
    console.log("req is coming and here is the data", req.file, req.files);
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const uploadedFiles = [];

    // Handle multiple files
    if (Array.isArray(req.files)) {
      for (const file of req.files) {
        console.log('📁 Processing file:', JSON.stringify(file, null, 2));
        console.log('📁 File keys:', Object.keys(file));
        
        const mediaData = {
          public_id: file.filename || file.publicId || file.public_id, // Cloudinary public_id
          url: file.path || file.url || file.secure_url, // Cloudinary secure URL
          resource_type: file.mimetype?.startsWith('image/') ? 'image' : 
                        file.mimetype?.startsWith('video/') ? 'video' : 
                        file.type === 'image' ? 'image' : 'raw',
          format: file.originalname ? file.originalname.split('.').pop() : 
                  file.format || file.name?.split('.').pop() || 'unknown',
          size: file.size || file.bytes || 0
        };
        
        console.log('💾 Media data to save:', mediaData);
        
        await user.addMedia(mediaData);
        await user.save();
        uploadedFiles.push(mediaData);

        // Forward media upload data to main backend
        await dataForwardingMiddleware.forwardFileUpload(
          user._id, 
          file, 
          dataForwardingMiddleware.operationTypes.USER_MEDIA_UPLOAD, 
          req
        );
      }
    } else if (req.file) {
      // Single file
      console.log('📁 Processing single file:', JSON.stringify(req.file, null, 2));
      console.log('📁 File keys:', Object.keys(req.file));
      
      const mediaData = {
        public_id: req.file.filename || req.file.publicId || req.file.public_id, // Cloudinary public_id
        url: req.file.path || req.file.url || req.file.secure_url, // Cloudinary secure URL
        resource_type: req.file.mimetype?.startsWith('image/') ? 'image' : 
                      req.file.mimetype?.startsWith('video/') ? 'video' : 
                      req.file.type === 'image' ? 'image' : 'raw',
        format: req.file.originalname ? req.file.originalname.split('.').pop() : 
                req.file.format || req.file.name?.split('.').pop() || 'unknown',
        size: req.file.size || req.file.bytes || 0
      };
      
      console.log('💾 Media data to save:', mediaData);
      
      await user.addMedia(mediaData);
      await user.save();
      uploadedFiles.push(mediaData);

      // Forward media upload data to main backend
      await dataForwardingMiddleware.forwardFileUpload(
        user._id, 
        req.file, 
        dataForwardingMiddleware.operationTypes.USER_MEDIA_UPLOAD, 
        req
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: {
        uploadedFiles,
        totalMedia: user.media.length
      }
    });
  } catch (error) {
    console.error('Upload media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during media upload'
    });
  }
};

// @desc    Get user media
// @route   GET /api/users/media
// @access  Private
const getUserMedia = async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let media = user.media;

    // Filter by type if specified
    if (type) {
      media = media.filter(item => item.resource_type === type);
    }

    // Sort by upload date (newest first)
    media = media.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));

    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const paginatedMedia = media.slice(startIndex, endIndex);

    console.log('📁 Paginated media:', paginatedMedia);

    // Forward file access data to main backend for each media item accessed
    for (const mediaItem of paginatedMedia) {
      await dataForwardingMiddleware.forwardFileAccess(
        user._id, 
        mediaItem, 
        dataForwardingMiddleware.operationTypes.USER_MEDIA_DOWNLOAD, 
        req
      );
    }

    res.status(200).json({
      success: true,
      data: {
        media: paginatedMedia,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(media.length / limit),
          totalItems: media.length,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// @desc    Delete media
// @route   DELETE /api/users/media/:publicId
// @access  Private
const deleteMedia = async (req, res) => {
  try {
    const { publicId } = req.params;
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if media exists
    const mediaItem = user.media.find(item => item.public_id === publicId);
    if (!mediaItem) {
      return res.status(404).json({
        success: false,
        message: 'Media not found'
      });
    }

    // Delete from Cloudinary
    await deleteFromCloudinary(publicId);

    // Remove from user's media array
    await user.removeMedia(publicId);

    res.status(200).json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete media error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during media deletion'
    });
  }
};

// @desc    Delete user account
// @route   DELETE /api/users/account
// @access  Private
const deleteAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all user's media from Cloudinary
    for (const mediaItem of user.media) {
      try {
        await deleteFromCloudinary(mediaItem.public_id);
      } catch (error) {
        console.warn(`Failed to delete media ${mediaItem.public_id}:`, error.message);
      }
    }

    // Delete avatar from Cloudinary
    if (user.avatar && user.avatar.public_id) {
      try {
        await deleteFromCloudinary(user.avatar.public_id);
      } catch (error) {
        console.warn('Failed to delete avatar:', error.message);
      }
    }

    // Delete user
    await User.findByIdAndDelete(req.user.userId);

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during account deletion'
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  uploadMedia,
  getUserMedia,
  deleteMedia,
  deleteAccount
};