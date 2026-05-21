import { User } from "../models/User";
import { Campaign } from "../models/Campaign";
import { SponsorEntry } from "../models/SponsorEntry";
import { ShirtLayout } from "../models/ShirtLayout";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { sendPasswordResetEmail } from "./email.service";
import * as tokenService from "./token.service";

export const registerUser = async (
  name: string,
  email: string,
  password: string,
  rememberMe: boolean = false,
  userAgent?: string,
  ipAddress?: string
) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new Error("User already exists");
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const user = await User.create({
    name,
    email,
    passwordHash,
  });

  // Generate both access and refresh tokens
  const accessToken = tokenService.generateAccessToken(user._id.toString());
  const refreshToken = await tokenService.generateRefreshToken(
    user._id.toString(),
    rememberMe,
    userAgent,
    ipAddress
  );

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizerProfile: user.organizerProfile,
    token: accessToken, // Keep for backward compatibility
    accessToken,
    refreshToken,
  };
};

export const loginUser = async (
  email: string,
  password: string,
  rememberMe: boolean = false,
  userAgent?: string,
  ipAddress?: string
) => {
  const user = await User.findOne({ email });

  if (user && (await bcrypt.compare(password, user.passwordHash))) {
    // Generate both access and refresh tokens
    const accessToken = tokenService.generateAccessToken(user._id.toString());
    const refreshToken = await tokenService.generateRefreshToken(
      user._id.toString(),
      rememberMe,
      userAgent,
      ipAddress
    );

    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      organizerProfile: user.organizerProfile,
      token: accessToken, // Keep for backward compatibility
      accessToken,
      refreshToken,
    };
  } else {
    throw new Error("Invalid credentials");
  }
};

export const updateProfile = async (userId: string, profileData: any) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Extract organizerProfile if it's wrapped
  const profileFields = profileData.organizerProfile || profileData;

  // Check if slug is being changed and if it's already taken
  if (profileFields.slug && profileFields.slug !== user.organizerProfile?.slug) {
    const existingSlug = await User.findOne({
      "organizerProfile.slug": profileFields.slug,
    });
    if (existingSlug) {
      throw new Error("Slug already taken");
    }
  }

  // Merge the profile fields, ensuring socialLinks is properly handled
  user.organizerProfile = {
    ...user.organizerProfile,
    ...profileFields,
    socialLinks: {
      ...user.organizerProfile?.socialLinks,
      ...profileFields.socialLinks,
    },
  };

  await user.save();
  return user;
};

export const getPublicProfile = async (slug: string) => {
  const user = await User.findOne({ "organizerProfile.slug": slug });
  if (!user) {
    throw new Error("Organizer not found");
  }

  const now = new Date();

  // Single aggregation replaces the previous Campaign.find() + per-campaign
  // SponsorEntry.countDocuments() + ShirtLayout.findOne() loop (N+1 queries).
  const campaignsWithStats = await Campaign.aggregate([
    {
      $match: {
        ownerId: user._id,
        isClosed: false,
        $or: [{ endDate: { $gt: now } }, { endDate: null }],
      },
    },
    {
      $lookup: {
        from: "sponsorentries",
        let: { campaignId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$campaignId", "$$campaignId"] },
                  { $eq: ["$paymentStatus", "paid"] },
                ],
              },
            },
          },
          { $count: "count" },
        ],
        as: "sponsorStats",
      },
    },
    {
      $lookup: {
        from: "shirtlayouts",
        localField: "_id",
        foreignField: "campaignId",
        as: "layout",
      },
    },
    {
      $addFields: {
        stats: {
          sponsorCount: {
            $ifNull: [{ $arrayElemAt: ["$sponsorStats.count", 0] }, 0],
          },
          totalPositions: {
            $let: {
              vars: { layoutDoc: { $arrayElemAt: ["$layout", 0] } },
              in: { $size: { $ifNull: ["$$layoutDoc.placements", []] } },
            },
          },
          claimedPositions: {
            $let: {
              vars: { layoutDoc: { $arrayElemAt: ["$layout", 0] } },
              in: {
                $size: {
                  $filter: {
                    input: { $ifNull: ["$$layoutDoc.placements", []] },
                    as: "p",
                    cond: { $eq: ["$$p.isTaken", true] },
                  },
                },
              },
            },
          },
        },
      },
    },
    {
      $addFields: {
        "stats.remainingPositions": {
          $subtract: ["$stats.totalPositions", "$stats.claimedPositions"],
        },
      },
    },
    { $project: { sponsorStats: 0, layout: 0 } },
  ]);

  return {
    profile: user.organizerProfile,
    campaigns: campaignsWithStats,
  };
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (
  refreshToken: string,
  userAgent?: string,
  ipAddress?: string
) => {
  // Verify refresh token and get user ID
  const { userId } = await tokenService.verifyRefreshToken(refreshToken);

  // Get user details
  const user = await User.findById(userId).select(
    "_id name email role organizerProfile"
  );

  if (!user) {
    throw new Error("User not found");
  }

  // Generate new access token
  const accessToken = tokenService.generateAccessToken(userId);

  // Rotate refresh token for added security
  const newRefreshToken = await tokenService.rotateRefreshToken(
    refreshToken,
    userAgent,
    ipAddress
  );

  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    organizerProfile: user.organizerProfile,
    accessToken,
    refreshToken: newRefreshToken,
    token: accessToken, // Keep for backward compatibility
  };
};

/**
 * Logout user by revoking refresh token
 */
export const logoutUser = async (refreshToken: string) => {
  await tokenService.revokeRefreshToken(refreshToken);
  return { message: "Logged out successfully" };
};

/**
 * Logout from all devices by revoking all user's refresh tokens
 */
export const logoutAllDevices = async (userId: string) => {
  await tokenService.revokeAllUserTokens(userId);
  return { message: "Logged out from all devices successfully" };
};

export const requestPasswordReset = async (email: string) => {
  const user = await User.findOne({ email });

  if (!user) {
    // Don't reveal if user exists or not for security
    throw new Error(
      "If an account with that email exists, a password reset link has been sent."
    );
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString("hex");

  // Hash token before saving to database
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  // Save hashed token and expiry to user
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour from now
  await user.save();

  // Send email with unhashed token
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  await sendPasswordResetEmail(user.email, resetToken, frontendUrl);

  return {
    message: "Password reset email sent successfully",
  };
};

export const resetPassword = async (token: string, newPassword: string) => {
  // Hash the token from URL to compare with database
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid token that hasn't expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  });

  if (!user) {
    throw new Error("Password reset token is invalid or has expired");
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.passwordHash = await bcrypt.hash(newPassword, salt);

  // Clear reset token fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  return {
    message: "Password has been reset successfully",
  };
};
