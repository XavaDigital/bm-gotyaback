import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    organizerProfile: {
      displayName: { type: String },
      slug: { type: String, unique: true, sparse: true },
      logoUrl: { type: String },
      coverImageUrl: { type: String },
      bio: { type: String },
      websiteUrl: { type: String },
      socialLinks: {
        facebook: String,
        twitter: String,
        instagram: String,
      },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

// Indexes for performance optimization
userSchema.index({ email: 1 }); // Already unique, but explicit for lookups
userSchema.index({ 'organizerProfile.slug': 1 }); // For organizer profile lookups

export const User = mongoose.model("User", userSchema);
