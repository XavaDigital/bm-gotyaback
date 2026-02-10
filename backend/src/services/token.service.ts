import jwt from "jsonwebtoken";
import crypto from "crypto";
import { RefreshToken } from "../models/RefreshToken";

/**
 * Token expiration times
 * Access tokens are short-lived for security
 * Refresh tokens are longer-lived for user convenience
 */
const ACCESS_TOKEN_EXPIRY = "1d"; // 1 day (24 hours)
const REFRESH_TOKEN_EXPIRY_DAYS = 7; // 7 days (standard)
const REFRESH_TOKEN_EXPIRY_DAYS_REMEMBER = 30; // 30 days (remember me)

interface TokenPayload {
  id: string;
}

/**
 * Generate an access token (JWT)
 * Short-lived token for API authentication
 */
export const generateAccessToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET as string, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });
};

/**
 * Generate a refresh token
 * Stored in database for revocation capability
 */
export const generateRefreshToken = async (
  userId: string,
  rememberMe: boolean = false,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  // Generate a secure random token
  const token = crypto.randomBytes(64).toString("hex");

  // Calculate expiration date
  const expiryDays = rememberMe
    ? REFRESH_TOKEN_EXPIRY_DAYS_REMEMBER
    : REFRESH_TOKEN_EXPIRY_DAYS;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + expiryDays);

  // Store in database
  await RefreshToken.create({
    userId,
    token,
    expiresAt,
    rememberMe,
    userAgent,
    ipAddress,
  });

  return token;
};

/**
 * Verify and decode an access token
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired access token");
  }
};

/**
 * Verify a refresh token
 * Checks if token exists, is not revoked, and is not expired
 */
export const verifyRefreshToken = async (
  token: string
): Promise<{ userId: string; rememberMe: boolean }> => {
  const refreshToken = await RefreshToken.findOne({
    token,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  });

  if (!refreshToken) {
    throw new Error("Invalid or expired refresh token");
  }

  return {
    userId: refreshToken.userId.toString(),
    rememberMe: refreshToken.rememberMe,
  };
};

/**
 * Revoke a specific refresh token (logout)
 */
export const revokeRefreshToken = async (token: string): Promise<void> => {
  await RefreshToken.updateOne({ token }, { isRevoked: true });
};

/**
 * Revoke all refresh tokens for a user (logout from all devices)
 */
export const revokeAllUserTokens = async (userId: string): Promise<void> => {
  await RefreshToken.updateMany({ userId }, { isRevoked: true });
};

/**
 * Clean up expired tokens (should be run periodically)
 */
export const cleanupExpiredTokens = async (): Promise<number> => {
  const result = await RefreshToken.deleteMany({
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount || 0;
};

/**
 * Get all active sessions for a user
 */
export const getUserActiveSessions = async (userId: string) => {
  return await RefreshToken.find({
    userId,
    isRevoked: false,
    expiresAt: { $gt: new Date() },
  })
    .select("createdAt userAgent ipAddress rememberMe")
    .sort({ createdAt: -1 });
};

/**
 * Rotate refresh token (generate new one and revoke old one)
 * Used when refreshing access token for added security
 */
export const rotateRefreshToken = async (
  oldToken: string,
  userAgent?: string,
  ipAddress?: string
): Promise<string> => {
  // Verify old token
  const { userId, rememberMe } = await verifyRefreshToken(oldToken);

  // Revoke old token
  await revokeRefreshToken(oldToken);

  // Generate new token
  return await generateRefreshToken(userId, rememberMe, userAgent, ipAddress);
};

