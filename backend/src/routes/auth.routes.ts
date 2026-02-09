import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  logoutAll,
} from "../controllers/auth.controller";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter.middleware";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middleware/validation.middleware";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

// Apply strict rate limiting and validation to authentication endpoints
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);
router.post("/forgot-password", passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password", passwordResetLimiter, validateResetPassword, resetPassword);

// Token refresh endpoint (no strict rate limiting, but still protected by general API limiter)
router.post("/refresh", refreshToken);

// Logout endpoints
router.post("/logout", logout);
router.post("/logout-all", protect, logoutAll); // Requires authentication

export default router;
