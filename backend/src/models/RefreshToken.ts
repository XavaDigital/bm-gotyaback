import mongoose from "mongoose";

/**
 * RefreshToken Model
 * Stores refresh tokens for JWT authentication
 * Allows for token revocation and session management
 */
const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true, // For efficient cleanup of expired tokens
    },
    isRevoked: {
      type: Boolean,
      default: false,
      index: true,
    },
    // Optional: Track device/browser for security
    userAgent: {
      type: String,
    },
    ipAddress: {
      type: String,
    },
    // Optional: For "remember me" functionality
    rememberMe: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Index for efficient cleanup of expired tokens
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for finding user's active tokens
refreshTokenSchema.index({ userId: 1, isRevoked: 1 });

export const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

