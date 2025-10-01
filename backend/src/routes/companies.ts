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

export default router;