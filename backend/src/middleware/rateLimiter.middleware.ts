import rateLimit from "express-rate-limit";

const isProduction = process.env.NODE_ENV === "production";

/**
 * General API rate limiter
 * Applies to all API routes
 */
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 100 : 10000, // Limit each IP to 100 requests per windowMs (10000 in dev)
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Strict rate limiter for authentication endpoints
 * Prevents brute force attacks
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 5 : 100, // Limit each IP to 5 login/register attempts per windowMs (100 in dev)
  message:
    "Too many authentication attempts, please try again after 15 minutes.",
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

/**
 * Rate limiter for password reset requests
 * Prevents abuse of password reset functionality
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProduction ? 3 : 100, // Limit each IP to 3 password reset requests per hour (100 in dev)
  message: "Too many password reset requests, please try again after an hour.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for payment endpoints
 * Prevents payment spam and fraud attempts
 */
export const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 10 : 1000, // Limit each IP to 10 payment attempts per 15 minutes (1000 in dev)
  message: "Too many payment requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for file upload endpoints
 * Prevents abuse of file upload functionality
 */
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 20 : 1000, // Limit each IP to 20 uploads per 15 minutes (1000 in dev)
  message: "Too many file uploads, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Rate limiter for sponsor creation
 * Prevents spam sponsorships
 */
export const sponsorLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProduction ? 10 : 100, // Limit each IP to 10 sponsorships per hour (100 in dev)
  message: "Too many sponsorship submissions, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Lenient rate limiter for public read-only endpoints
 * Allows more requests for viewing campaigns, sponsors, etc.
 */
export const publicReadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProduction ? 200 : 10000, // Limit each IP to 200 requests per 15 minutes (10000 in dev)
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
