import mongoose from "mongoose";

const sponsorEntrySchema = new mongoose.Schema(
  {
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    positionId: { type: String },
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: false },
    message: { type: String },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["card", "cash", "afterpay"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Sponsor type and display
    sponsorType: { type: String, enum: ["text", "logo"], default: "text" },
    logoUrl: { type: String }, // For logo sponsors
    displayName: { type: String }, // For logo sponsors with name+logo display (different from sponsor name)

    // Logo approval workflow
    logoApprovalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    logoRejectionReason: { type: String },

    // Display size (calculated based on amount/tier)
    displaySize: {
      type: String,
      enum: ["small", "medium", "large", "xlarge"],
      default: "medium",
    },

    // Calculated pixel sizes for rendering
    calculatedFontSize: { type: Number }, // for text sponsors
    calculatedLogoWidth: { type: Number }, // for logo sponsors
  },
  { timestamps: true },
);

export const SponsorEntry = mongoose.model("SponsorEntry", sponsorEntrySchema);
