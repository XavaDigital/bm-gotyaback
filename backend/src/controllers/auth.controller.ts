import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { logAuthEvent, getClientIp, AuditAction } from "../utils/auditLogger";

export const register = async (req: Request, res: Response) => {
  const { name, email, password, rememberMe } = req.body;

  try {
    const userAgent = req.get("user-agent");
    const ipAddress = getClientIp(req);

    const user = await userService.registerUser(
      name,
      email,
      password,
      rememberMe || false,
      userAgent,
      ipAddress
    );

    // Log successful registration
    logAuthEvent(
      AuditAction.USER_REGISTER,
      true,
      user._id?.toString(),
      email,
      ipAddress
    );

    res.status(201).json(user);
  } catch (error) {
    // Log failed registration
    logAuthEvent(
      AuditAction.USER_REGISTER,
      false,
      undefined,
      email,
      getClientIp(req),
      (error as Error).message
    );

    res.status(400).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  try {
    const userAgent = req.get("user-agent");
    const ipAddress = getClientIp(req);

    const user = await userService.loginUser(
      email,
      password,
      rememberMe || false,
      userAgent,
      ipAddress
    );

    // Log successful login
    logAuthEvent(
      AuditAction.USER_LOGIN,
      true,
      user._id?.toString(),
      email,
      ipAddress
    );

    res.json(user);
  } catch (error) {
    // Log failed login
    logAuthEvent(
      AuditAction.USER_LOGIN,
      false,
      undefined,
      email,
      getClientIp(req),
      (error as Error).message
    );

    res.status(401).json({ message: (error as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const result = await userService.requestPasswordReset(email);

    // Log password reset request
    logAuthEvent(
      AuditAction.PASSWORD_RESET_REQUEST,
      true,
      undefined,
      email,
      getClientIp(req)
    );

    res.json(result);
  } catch (error) {
    // Log failed password reset request
    logAuthEvent(
      AuditAction.PASSWORD_RESET_REQUEST,
      false,
      undefined,
      email,
      getClientIp(req),
      (error as Error).message
    );

    // Always return 200 to prevent email enumeration
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token, password } = req.body;

  try {
    const result = await userService.resetPassword(token, password);

    // Log successful password reset
    logAuthEvent(
      AuditAction.PASSWORD_RESET_COMPLETE,
      true,
      undefined,
      undefined,
      getClientIp(req)
    );

    res.json(result);
  } catch (error) {
    // Log failed password reset
    logAuthEvent(
      AuditAction.PASSWORD_RESET_COMPLETE,
      false,
      undefined,
      undefined,
      getClientIp(req),
      (error as Error).message
    );

    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * Refresh access token using refresh token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const userAgent = req.get("user-agent");
    const ipAddress = getClientIp(req);

    const result = await userService.refreshAccessToken(
      refreshToken,
      userAgent,
      ipAddress
    );

    res.json(result);
  } catch (error) {
    res.status(401).json({ message: (error as Error).message });
  }
};

/**
 * Logout user by revoking refresh token
 * POST /api/auth/logout
 */
export const logout = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ message: "Refresh token is required" });
  }

  try {
    const result = await userService.logoutUser(refreshToken);

    // Log logout
    logAuthEvent(
      AuditAction.USER_LOGOUT,
      true,
      req.user?._id?.toString(),
      req.user?.email,
      getClientIp(req)
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

/**
 * Logout from all devices
 * POST /api/auth/logout-all
 * Requires authentication
 */
export const logoutAll = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const result = await userService.logoutAllDevices(userId.toString());

    // Log logout from all devices
    logAuthEvent(
      AuditAction.USER_LOGOUT,
      true,
      userId.toString(),
      req.user?.email,
      getClientIp(req),
      "Logged out from all devices"
    );

    res.json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
