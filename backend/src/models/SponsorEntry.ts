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
    message: { type: String },
    amount: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["card", "cash"], required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed"],
      default: "pending",
    },

    // Sponsor type and display
    sponsorType: { type: String, enum: ["text", "logo"], default: "text" },
    logoUrl: { type: String }, // For logo sponsors
    displaySize: {
      type: String,
      enum: ["small", "medium", "large", "xlarge"],
      default: "medium",
    }, // Calculated based on amount/pricing
  },
  { timestamps: true }
);

export const SponsorEntry = mongoose.model("SponsorEntry", sponsorEntrySchema);
