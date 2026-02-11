import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to handle validation errors
 */
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Validation rules for user registration
 */
export const validateRegister = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .toLowerCase()
    .customSanitizer((value) => {
      // Only normalize email in production (removes + aliases in Gmail)
      if (process.env.NODE_ENV === 'production') {
        // Basic normalization: lowercase and trim (already done above)
        // For production, you might want to add more aggressive normalization
        return value;
      }
      // In development, keep the email as-is (after lowercase)
      return value;
    }),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

/**
 * Validation rules for user login
 */
export const validateLogin = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .toLowerCase()
    .customSanitizer((value) => {
      // Only normalize email in production (removes + aliases in Gmail)
      if (process.env.NODE_ENV === 'production') {
        return value;
      }
      return value;
    }),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors,
];

/**
 * Validation rules for password reset request
 */
export const validateForgotPassword = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .toLowerCase()
    .customSanitizer((value) => {
      // Only normalize email in production (removes + aliases in Gmail)
      if (process.env.NODE_ENV === 'production') {
        return value;
      }
      return value;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for password reset
 */
export const validateResetPassword = [
  body('token')
    .trim()
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  handleValidationErrors,
];

/**
 * Validation rules for campaign creation
 */
export const validateCreateCampaign = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters')
    .escape(),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 }).withMessage('Description must not exceed 5000 characters'),
  body('campaignType')
    .notEmpty().withMessage('Campaign type is required')
    .isIn(['fixed', 'positional', 'pay-what-you-want']).withMessage('Invalid campaign type'),
  body('currency')
    .optional()
    .isIn(['NZD', 'AUD', 'USD']).withMessage('Invalid currency'),
  body('endDate')
    .optional()
    .isISO8601().withMessage('Invalid date format')
    .toDate(),
  handleValidationErrors,
];

/**
 * Validation rules for sponsorship creation
 */
export const validateCreateSponsorship = [
  body('name')
    .trim()
    .notEmpty().withMessage('Sponsor name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Must be a valid email address')
    .toLowerCase()
    .customSanitizer((value) => {
      // Only normalize email in production (removes + aliases in Gmail)
      if (process.env.NODE_ENV === 'production') {
        return value;
      }
      return value;
    }),
  body('phone')
    .optional()
    .trim()
    .matches(/^[\d\s\-\+\(\)]+$/).withMessage('Invalid phone number format'),
  body('message')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Message must not exceed 500 characters'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('sponsorType')
    .optional()
    .isIn(['text', 'logo']).withMessage('Invalid sponsor type'),
  handleValidationErrors,
];

/**
 * Validation rules for payment intent creation
 */
export const validateCreatePaymentIntent = [
  body('campaignId')
    .trim()
    .notEmpty().withMessage('Campaign ID is required')
    .isMongoId().withMessage('Invalid campaign ID'),
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('sponsorData.name')
    .trim()
    .notEmpty().withMessage('Sponsor name is required')
    .escape(),
  body('sponsorData.email')
    .trim()
    .notEmpty().withMessage('Sponsor email is required')
    .isEmail().withMessage('Must be a valid email address')
    .toLowerCase()
    .customSanitizer((value) => {
      // Only normalize email in production (removes + aliases in Gmail)
      if (process.env.NODE_ENV === 'production') {
        return value;
      }
      return value;
    }),
  handleValidationErrors,
];

/**
 * Validation rules for MongoDB ObjectId parameters
 */
export const validateMongoId = [
  param('id')
    .trim()
    .isMongoId().withMessage('Invalid ID format'),
  handleValidationErrors,
];

