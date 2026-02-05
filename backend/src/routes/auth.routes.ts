import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { authLimiter, passwordResetLimiter } from "../middleware/rateLimiter.middleware";
import {
  validateRegister,
  validateLogin,
  validateForgotPassword,
  validateResetPassword,
} from "../middleware/validation.middleware";

const router = express.Router();

// Apply strict rate limiting and validation to authentication endpoints
router.post("/register", authLimiter, validateRegister, register);
router.post("/login", authLimiter, validateLogin, login);
router.post("/forgot-password", passwordResetLimiter, validateForgotPassword, forgotPassword);
router.post("/reset-password", passwordResetLimiter, validateResetPassword, resetPassword);

export default router;
