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
    layoutStyle: {
      type: String,
      enum: ["grid", "size-ordered", "amount-ordered", "word-cloud"],
      default: "grid",
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

        // For positional pricing (order preference)
        pricingOrder: {
          type: String,
          enum: ["ascending", "descending"],
          default: "ascending",
        },

        // For positional pricing with sections layout (amount-ordered)
        sections: {
          type: {
            top: {
              type: {
                amount: { type: Number },
                slots: { type: Number },
              },
            },
            middle: {
              type: {
                amount: { type: Number },
                slots: { type: Number },
              },
            },
            bottom: {
              type: {
                amount: { type: Number },
                slots: { type: Number },
              },
            },
          },
        },

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
      },
      default: {},
    },

    currency: { type: String, enum: ["NZD", "AUD", "USD"], default: "NZD" },
    startDate: { type: Date },
    endDate: { type: Date },
    isClosed: { type: Boolean, default: false },
    enableStripePayments: { type: Boolean, default: false },
    allowOfflinePayments: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// Indexes for performance optimization
campaignSchema.index({ ownerId: 1, createdAt: -1 }); // For filtering user's campaigns
campaignSchema.index({ slug: 1 }); // Already unique, but explicit for lookups
campaignSchema.index({ isClosed: 1, endDate: 1 }); // For filtering active campaigns
campaignSchema.index({ createdAt: -1 }); // For sorting by creation date

export const Campaign = mongoose.model("Campaign", campaignSchema);
