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
    headerImageUrl: { type: String },
    garmentType: {
      type: String,
      enum: ["singlet", "tshirt", "hoodie"],
      required: true,
    },
    // Campaign Type (Pricing Strategy)
    campaignType: {
      type: String,
      enum: ["fixed", "positional", "pay-what-you-want"],
      required: true,
    },

    // Sponsor Display Type
    sponsorDisplayType: {
      type: String,
      enum: ["text-only", "logo-only", "both"],
      default: "text-only",
    },

    // Layout Style
    // Positional: "ordered", "sections", "cloud"
    // Fixed: "cloud", "list"
    // Pay-what-you-want: "word-cloud", "list"
    layoutStyle: {
      type: String,
      enum: ["ordered", "sections", "cloud", "list", "word-cloud"],
      default: "ordered",
    },

    // Layout Order (for ordered and list layouts)
    layoutOrder: {
      type: String,
      enum: ["asc", "desc"],
      default: "asc",
    },

    // Pricing Configuration (varies by campaign type)
    pricingConfig: {
      type: {
        // For fixed pricing
        fixedPrice: { type: Number },

        // For positional pricing (additive: basePrice + position * pricePerPosition)
        basePrice: { type: Number },
        pricePerPosition: { type: Number },

        // For positional pricing (multiplicative: position * priceMultiplier)
        priceMultiplier: { type: Number },

        // For pay-what-you-want
        minimumAmount: { type: Number },
        suggestedAmounts: [{ type: Number }],

        // Size tiers for pay-what-you-want
        sizeTiers: [
          {
            size: {
              type: String,
              enum: ["small", "medium", "large", "xlarge"],
            },
            minAmount: { type: Number },
            maxAmount: { type: Number }, // null for highest tier
            textFontSize: { type: Number }, // px for text sponsors
            logoWidth: { type: Number }, // px for logo sponsors
          },
        ],

        // Price tiers for "sections" layout style (positional pricing)
        priceTiers: [
          {
            tierNumber: { type: Number, required: true },
            price: { type: Number, required: true },
            sponsorDisplayType: {
              type: String,
              enum: ["text-only", "logo-only", "both"],
              required: true,
            },
          },
        ],
      },
      default: {},
    },

    currency: { type: String, enum: ["NZD", "AUD", "USD"], default: "NZD" },
    startDate: { type: Date },
    endDate: { type: Date },
    status: {
      type: String,
      enum: ["draft", "active", "closed"],
      default: "active",
    },
    isClosed: { type: Boolean, default: false },
    enableStripePayments: { type: Boolean, default: false },
    allowOfflinePayments: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Campaign = mongoose.model("Campaign", campaignSchema);
