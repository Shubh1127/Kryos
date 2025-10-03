import express, { Request, Response, NextFunction } from 'express';
import Company from '../models/Company';
import { CustomError } from '../middleware/errorHandler';

const router = express.Router();

// Create a new company
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, email, description, website, contactPerson, phone } = req.body;

    const company = new Company({
      name,
      email,
      description,
      website,
      contactPerson,
      phone,
    });

    await company.save();

    res.status(201).json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

// Get all companies
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const companies = await Company.find({ isActive: true })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Company.countDocuments({ isActive: true });

    res.json({
      success: true,
      data: companies,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Logout (stateless placeholder – clears client-side only)
router.post('/logout', async (req: Request, res: Response) => {
  // If you later add server-issued sessions or refresh tokens, revoke them here.
  return res.json({ success: true, message: 'Logged out successfully' });
});

// Get company by ID
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      throw new CustomError('Company not found', 404);
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

// Update company
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!company) {
      throw new CustomError('Company not found', 404);
    }

    res.json({
      success: true,
      data: company,
    });
  } catch (error) {
    next(error);
  }
});

// Delete company (soft delete)
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!company) {
      throw new CustomError('Company not found', 404);
    }

    res.json({
      success: true,
      message: 'Company deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});



// Send OTP for login
router.post('/send-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      throw new CustomError("Email is required", 400);
    }

    // Find company by email
    const company = await Company.findOne({ email, isActive: true });
    if (!company) {
      throw new CustomError("Company not found", 404);
    }

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update company with OTP
    await Company.findByIdAndUpdate(company._id, {
      otpCode,
      otpExpiry
    });

    // Import email service (CommonJS require)
    const { sendOtpLoginEmail } = require('../mailTrap/Email.js');
    
    // Send OTP email
    await sendOtpLoginEmail(email, company.name, otpCode);

    res.json({
      success: true,
      message: 'OTP sent to your email successfully',
      data: {
        email,
        expiresIn: '10 minutes'
      }
    });

  } catch (error) {
    next(error);
  }
});

// Verify OTP and login
router.post('/verify-otp', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otpCode } = req.body;
    
    if (!email || !otpCode) {
      throw new CustomError("Email and OTP code are required", 400);
    }

    // Find company with OTP fields
    const company = await Company.findOne({ 
      email, 
      isActive: true 
    }).select('+otpCode +otpExpiry');

    if (!company) {
      throw new CustomError("Company not found", 404);
    }

    // Check if OTP exists and is not expired
    if (!company.otpCode || !company.otpExpiry) {
      throw new CustomError("No OTP found. Please request a new OTP", 400);
    }

    if (company.otpExpiry < new Date()) {
      throw new CustomError("OTP has expired. Please request a new OTP", 400);
    }

    if (company.otpCode !== otpCode) {
      throw new CustomError("Invalid OTP code", 400);
    }

    // Clear OTP and update last login
    await Company.findByIdAndUpdate(company._id, {
      $unset: { otpCode: 1, otpExpiry: 1 },
      lastLogin: new Date()
    });

    // Import email service and send success notification
    const { sendLoginSuccessEmail } = require('../mailTrap/Email.js');
    await sendLoginSuccessEmail(email, company.name);

    // Return company data (without sensitive fields)
    const companyData = await Company.findById(company._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        company: companyData,
        token: `company_${company._id}` // Simple token for now
      }
    });

  } catch (error) {
    next(error);
  }
});
export default router;