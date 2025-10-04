const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');
const { upload, uploadAvatar: avatarUpload } = require('../config/cloudinary');

// Public routes
router.post('/register', (req, res, next) => {
  console.log('🚀 REGISTER REQUEST RECEIVED!');
  console.log('🚀 Body:', req.body);
  console.log('🚀 Headers:', req.headers);
  next();
}, registerUser);
router.post('/login', (req, res, next) => {
  console.log('🔑 LOGIN REQUEST RECEIVED!');
  console.log('🔑 Body:', req.body);
  console.log('🔑 Headers:', req.headers);
  next();
}, loginUser);

// Protected routes (require authentication)
router.use(protect); // All routes below require authentication

// Authentication routes
router.post('/logout', logoutUser);

// Profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.delete('/account', deleteAccount);

// Avatar routes
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

// Media routes
router.post('/media', (req, res, next) => {
  console.log('🔥 Media upload route hit!');
  console.log('🔥 Request headers:', req.headers);
  console.log('🔥 Content-Type:', req.get('Content-Type'));
  next();
}, upload.array('files', 10), (req, res, next) => {
  console.log('🔥 After multer middleware - files:', req.files);
  console.log('🔥 After multer middleware - file:', req.file);
  next();
}, uploadMedia); // Allow up to 10 files
router.get('/media', getUserMedia);
router.delete('/media/:publicId', deleteMedia);

// Admin only routes
router.get('/all', authorize('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status } = req.query;
    
    // Build query
    let query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      query.isActive = status;
    }

    // Execute query with pagination
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          usersPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin route to update user status
router.put('/:userId/status', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;
    
    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be active, inactive, or suspended'
      });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: status },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: `User status updated to ${status}`,
      data: { user }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Admin route to get user details
router.get('/:userId', authorize('admin'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;