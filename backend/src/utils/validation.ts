import Joi from 'joi';

// Validation schema for user data
export const userDataSchema = Joi.object({
  externalId: Joi.string().required().max(100),
  name: Joi.string().required().max(100),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
  metadata: Joi.object().optional(),
});

// Validation schema for data entry
export const dataEntrySchema = Joi.object({
  externalId: Joi.string().required().max(100),
  user: Joi.object({
    externalId: Joi.string().required().max(100),
    name: Joi.string().required().max(100),
    email: Joi.string().email().required(),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
    metadata: Joi.object().optional(),
  }).optional(),
  dataType: Joi.string().valid('user_data', 'event_data', 'custom_data').required(),
  data: Joi.object().required(),
  tags: Joi.array().items(Joi.string().max(50)).optional(),
});

// Validation schema for company registration
export const companySchema = Joi.object({
  name: Joi.string().required().max(100),
  email: Joi.string().email().required(),
  description: Joi.string().max(500).optional(),
  website: Joi.string().uri().optional(),
  contactPerson: Joi.string().required().max(100),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional(),
});

// Validation schema for API key creation
export const apiKeySchema = Joi.object({
  companyId: Joi.string().required(),
  name: Joi.string().required().max(100),
  description: Joi.string().max(200).optional(),
  permissions: Joi.array().items(
    Joi.string().valid('data:write', 'data:read', 'files:upload', 'files:read')
  ).optional(),
  expiresAt: Joi.date().greater('now').optional(),
});