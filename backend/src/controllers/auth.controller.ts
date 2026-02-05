import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { logAuthEvent, getClientIp, AuditAction } from "../utils/auditLogger";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const user = await userService.registerUser(name, email, password);

    // Log successful registration
    logAuthEvent(
      AuditAction.USER_REGISTER,
      true,
      user._id?.toString(),
      email,
      getClientIp(req)
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
  const { email, password } = req.body;

  try {
    const user = await userService.loginUser(email, password);

    // Log successful login
    logAuthEvent(
      AuditAction.USER_LOGIN,
      true,
      user._id?.toString(),
      email,
      getClientIp(req)
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
