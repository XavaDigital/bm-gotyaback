import mongoose from "mongoose";

const campaignSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, maxlength: 200 },
    description: { type: String },
    garmentType: {
      type: String,
      enum: ["singlet", "tshirt", "hoodie"],
      required: true,
    },
    campaignType: {
      type: String,
      enum: ["fixed", "placement", "donation"],
      required: true,
    },

    // Pricing Strategy
    pricingStrategy: {
      type: String,
      enum: [
        "fixed", // All positions same price
        "positional", // Position-based (1=$1, 40=$40)
        "sectional", // Section-based (top/middle/bottom)
        "size-based", // Size-based tiers
        "pay-what-you-want", // Flexible pricing
      ],
      default: "fixed",
    },

    // Sponsor Display Type
    sponsorDisplayType: {
      type: String,
      enum: [
        "text-only", // Text sponsors only
        "logo-only", // Logo sponsors only
        "text-and-logo", // Both text and logo sections
        "mixed", // Mixed in same section
      ],
      default: "text-only",
    },

    // Layout Style (for pay-what-you-want and size-based)
    layoutStyle: {
      type: String,
      enum: [
        "grid", // Traditional grid layout
        "word-cloud", // Word cloud style
        "size-ordered", // Ordered by size
        "amount-ordered", // Ordered by amount paid
      ],
      default: "grid",
    },

    currency: { type: String, enum: ["NZD", "AUD", "USD"], default: "NZD" },
    startDate: { type: Date },
    endDate: { type: Date },
    isClosed: { type: Boolean, default: false },
    enableStripePayments: { type: Boolean, default: false },
    allowOfflinePayments: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
