import { Request, Response } from "express";
import * as userService from "../services/user.service";

export const register = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;

  try {
    const user = await userService.registerUser(name, email, password);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await userService.loginUser(email, password);
    res.json(user);
  } catch (error) {
    res.status(401).json({ message: (error as Error).message });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const result = await userService.requestPasswordReset(email);
    res.json(result);
  } catch (error) {
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
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
