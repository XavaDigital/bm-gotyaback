import { Campaign } from "../models/Campaign";
import mongoose from "mongoose";
import { validatePricingConfig, getDefaultSizeTiers } from "./pricing.service";
import { PricingConfig } from "../types/campaign.types";

// Helper function to generate URL-friendly slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
};

// Ensure slug uniqueness
const generateUniqueSlug = async (title: string): Promise<string> => {
  let slug = generateSlug(title);
  let counter = 1;

  while (await Campaign.findOne({ slug })) {
    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }

  return slug;
};

export const createCampaign = async (userId: string, campaignData: any) => {
  // Validate Stripe configuration if enableStripePayments is true
  if (campaignData.enableStripePayments && !process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Cannot enable Stripe payments: Stripe is not configured on this server",
    );
  }

  // Validate at least one payment method is enabled
  if (
    !campaignData.enableStripePayments &&
    !campaignData.allowOfflinePayments
  ) {
    throw new Error("At least one payment method must be enabled");
  }

  // Validate pricing config if provided
  if (campaignData.pricingConfig && campaignData.campaignType) {
    validatePricingConfig(
      campaignData.campaignType,
      campaignData.pricingConfig,
    );
  }

  // For PWYW campaigns, add default size tiers if not provided
  if (
    campaignData.campaignType === "pay-what-you-want" &&
    campaignData.pricingConfig &&
    (!campaignData.pricingConfig.sizeTiers ||
      campaignData.pricingConfig.sizeTiers.length === 0)
  ) {
    campaignData.pricingConfig.sizeTiers = getDefaultSizeTiers();
  }

  // Generate unique slug from title
  const slug = await generateUniqueSlug(campaignData.title);

  const campaign = await Campaign.create({
    ...campaignData,
    slug,
    ownerId: userId,
  });

  return campaign;
};

export const getCampaignById = async (campaignId: string) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const campaign = await Campaign.findById(campaignId).populate(
    "ownerId",
    "name email",
  );

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
};

export const getCampaignBySlug = async (slug: string) => {
  const campaign = await Campaign.findOne({ slug }).populate(
    "ownerId",
    "name email",
  );

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
};

export const updateCampaign = async (
  campaignId: string,
  userId: string,
  updates: any,
) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Verify ownership - handle populated ownerId
  const ownerId =
    typeof campaign.ownerId === "object" && campaign.ownerId._id
      ? campaign.ownerId._id.toString()
      : campaign.ownerId.toString();

  if (ownerId !== userId) {
    throw new Error("Not authorized to update this campaign");
  }

  // Don't allow updating certain fields if campaign is closed
  if (campaign.isClosed) {
    throw new Error("Cannot update a closed campaign");
  }

  // Validate Stripe configuration if trying to enable Stripe payments
  if (updates.enableStripePayments && !process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "Cannot enable Stripe payments: Stripe is not configured on this server",
    );
  }

  // Validate at least one payment method is enabled
  const finalEnableStripe =
    updates.enableStripePayments !== undefined
      ? updates.enableStripePayments
      : campaign.enableStripePayments;
  const finalAllowOffline =
    updates.allowOfflinePayments !== undefined
      ? updates.allowOfflinePayments
      : campaign.allowOfflinePayments;

  if (!finalEnableStripe && !finalAllowOffline) {
    throw new Error("At least one payment method must be enabled");
  }

  // Validate pricing config if being updated
  if (updates.pricingConfig) {
    const campaignType = updates.campaignType || campaign.campaignType;
    validatePricingConfig(campaignType, updates.pricingConfig);
  }

  // Prevent changing ownerId
  delete updates.ownerId;
  delete updates.slug;

  Object.assign(campaign, updates);
  await campaign.save();

  return campaign;
};

export const closeCampaign = async (campaignId: string, userId: string) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Verify ownership - handle populated ownerId
  const ownerId =
    typeof campaign.ownerId === "object" && campaign.ownerId._id
      ? campaign.ownerId._id.toString()
      : campaign.ownerId.toString();

  if (ownerId !== userId) {
    throw new Error("Not authorized to close this campaign");
  }

  if (campaign.isClosed) {
    throw new Error("Campaign is already closed");
  }

  campaign.isClosed = true;
  await campaign.save();

  return campaign;
};

export const getUserCampaigns = async (userId: string) => {
  const campaigns = await Campaign.aggregate([
    {
      $match: {
        ownerId: new mongoose.Types.ObjectId(userId),
      },
    },
    // Lookup Sponsors
    {
      $lookup: {
        from: "sponsorentries",
        localField: "_id",
        foreignField: "campaignId",
        as: "sponsors",
      },
    },
    // Lookup Layout
    {
      $lookup: {
        from: "shirtlayouts",
        localField: "_id",
        foreignField: "campaignId",
        as: "layout",
      },
    },
    // Add stats fields
    {
      $addFields: {
        stats: {
          totalPledged: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$sponsors",
                    as: "s",
                    cond: { $eq: ["$$s.paymentStatus", "paid"] },
                  },
                },
                as: "paidSponsor",
                in: "$$paidSponsor.amount",
              },
            },
          },
          totalPending: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: "$sponsors",
                    as: "s",
                    cond: { $eq: ["$$s.paymentStatus", "pending"] },
                  },
                },
                as: "pendingSponsor",
                in: "$$pendingSponsor.amount",
              },
            },
          },
          sponsorCount: {
            $size: {
              $filter: {
                input: "$sponsors",
                as: "s",
                cond: { $eq: ["$$s.paymentStatus", "paid"] },
              },
            },
          },
          pendingCount: {
            $size: {
              $filter: {
                input: "$sponsors",
                as: "s",
                cond: { $eq: ["$$s.paymentStatus", "pending"] },
              },
            },
          },
          positionsTotal: {
            $let: {
              vars: { layoutDoc: { $arrayElemAt: ["$layout", 0] } },
              in: { $size: { $ifNull: ["$$layoutDoc.placements", []] } },
            },
          },
          positionsClaimed: {
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
    // Project to remove large joined arrays
    {
      $project: {
        sponsors: 0,
        layout: 0,
      },
    },
    {
      $sort: { createdAt: -1 },
    },
  ]);
  return campaigns;
};

export const validateCampaignIsOpen = (campaign: any) => {
  if (campaign.isClosed) {
    throw new Error("Campaign is closed");
  }

  if (campaign.endDate && new Date() > new Date(campaign.endDate)) {
    throw new Error("Campaign has ended");
  }

  return true;
};

export const updateCampaignPricing = async (
  campaignId: string,
  userId: string,
  pricingData: any,
) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Verify ownership
  const ownerId =
    typeof campaign.ownerId === "object" && campaign.ownerId._id
      ? campaign.ownerId._id.toString()
      : campaign.ownerId.toString();

  if (ownerId !== userId) {
    throw new Error("Not authorized to update this campaign");
  }

  if (campaign.isClosed) {
    throw new Error("Cannot update a closed campaign");
  }

  // Check for ANY sponsors (even pending)
  const hasSponsors = await mongoose
    .model("SponsorEntry")
    .exists({ campaignId });
  if (hasSponsors) {
    throw new Error(
      "Cannot update pricing because campaign already has sponsors",
    );
  }

  // Determine config and update layout
  const pricingConfig: any = {};
  if (campaign.campaignType === "fixed") {
    pricingConfig.fixedPrice = pricingData.fixedPrice;
  } else if (campaign.campaignType === "positional") {
    // Support both multiplicative and additive pricing
    if (pricingData.priceMultiplier) {
      pricingConfig.priceMultiplier = pricingData.priceMultiplier;
    } else {
      pricingConfig.basePrice = pricingData.basePrice;
      pricingConfig.pricePerPosition = pricingData.pricePerPosition;
    }
  } else {
    throw new Error("Cannot update pricing for pay-what-you-want campaigns");
  }

  // Find and update layout directly
  const ShirtLayout = mongoose.model("ShirtLayout");
  const layout = await ShirtLayout.findOne({ campaignId });

  if (!layout) {
    throw new Error("Layout not found");
  }

  // Recalculate all position prices
  layout.placements.forEach((placement: any, index: number) => {
    const positionNumber = index + 1; // Position number is 1-based

    if (campaign.campaignType === "fixed") {
      placement.price = pricingConfig.fixedPrice;
    } else if (campaign.campaignType === "positional") {
      if (pricingConfig.priceMultiplier) {
        // Multiplicative: position × multiplier
        placement.price = positionNumber * pricingConfig.priceMultiplier;
      } else {
        // Additive: basePrice + (position × pricePerPosition)
        placement.price =
          pricingConfig.basePrice + index * pricingConfig.pricePerPosition;
      }
    }
  });

  await layout.save();
  return true;
};

export const reopenCampaign = async (campaignId: string, userId: string) => {
  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Verify ownership - handle populated ownerId
  const ownerId =
    typeof campaign.ownerId === "object" && campaign.ownerId._id
      ? campaign.ownerId._id.toString()
      : campaign.ownerId.toString();

  if (ownerId !== userId) {
    throw new Error("Not authorized to reopen this campaign");
  }

  if (!campaign.isClosed) {
    throw new Error("Campaign is not closed");
  }

  campaign.isClosed = false;
  await campaign.save();

  return campaign;
};

export const getAllCampaigns = async () => {
  const campaigns = await Campaign.find()
    .populate("ownerId", "name email")
    .sort({ createdAt: -1 });
  return campaigns;
};

export const deleteCampaign = async (campaignId: string) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  // Delete associated data
  const ShirtLayout = mongoose.model("ShirtLayout");
  const SponsorEntry = mongoose.model("SponsorEntry");

  await ShirtLayout.deleteMany({ campaignId });
  await SponsorEntry.deleteMany({ campaignId });
  await Campaign.findByIdAndDelete(campaignId);

  return { message: "Campaign deleted successfully" };
};
