import { Campaign } from "../models/Campaign";
import mongoose from "mongoose";
import { validatePricingConfig } from "./pricing.service";
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
      "Cannot enable Stripe payments: Stripe is not configured on this server"
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
      campaignData.layoutStyle
    );
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
    "name email"
  );

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
};

export const getCampaignBySlug = async (slug: string) => {
  const campaign = await Campaign.findOne({ slug }).populate(
    "ownerId",
    "name email"
  );

  if (!campaign) {
    throw new Error("Campaign not found");
  }

  return campaign;
};

export const updateCampaign = async (
  campaignId: string,
  userId: string,
  updates: any
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
      "Cannot enable Stripe payments: Stripe is not configured on this server"
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
    const layoutStyle = updates.layoutStyle || campaign.layoutStyle;
    validatePricingConfig(campaignType, updates.pricingConfig, layoutStyle);
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
  const campaigns = await Campaign.find({ ownerId: userId }).sort({
    createdAt: -1,
  });
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
  pricingData: any
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
      "Cannot update pricing because campaign already has sponsors"
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

export const duplicateCampaign = async (
  campaignId: string,
  userId: string,
  newData: { title?: string; startDate?: Date; endDate?: Date }
) => {
  // Get the original campaign
  const originalCampaign = await Campaign.findById(campaignId);

  if (!originalCampaign) {
    throw new Error("Campaign not found");
  }

  // Verify ownership
  const ownerId =
    typeof originalCampaign.ownerId === "object" && originalCampaign.ownerId._id
      ? originalCampaign.ownerId._id.toString()
      : originalCampaign.ownerId.toString();

  if (ownerId !== userId) {
    throw new Error("Not authorized to duplicate this campaign");
  }

  // Create a copy of the campaign data
  const campaignData = {
    title: newData.title || `${originalCampaign.title} (Copy)`,
    shortDescription: originalCampaign.shortDescription,
    description: originalCampaign.description,
    headerImageUrl: originalCampaign.headerImageUrl,
    garmentType: originalCampaign.garmentType,
    campaignType: originalCampaign.campaignType,
    sponsorDisplayType: originalCampaign.sponsorDisplayType,
    layoutStyle: originalCampaign.layoutStyle,
    layoutOrder: originalCampaign.layoutOrder,
    pricingConfig: originalCampaign.pricingConfig,
    currency: originalCampaign.currency,
    startDate: newData.startDate,
    endDate: newData.endDate,
    status: "draft", // Set duplicated campaigns to draft
    enableStripePayments: originalCampaign.enableStripePayments,
    allowOfflinePayments: originalCampaign.allowOfflinePayments,
  };

  // Create the new campaign using the existing createCampaign function
  const newCampaign = await createCampaign(userId, campaignData);

  // Get the original layout if it exists
  const ShirtLayout = mongoose.model("ShirtLayout");
  const originalLayout = await ShirtLayout.findOne({
    campaignId: originalCampaign._id,
  });

  // If there's a layout, duplicate it for the new campaign
  if (originalLayout) {
    const layoutData: any = {
      campaignId: (newCampaign as any)._id,
      layoutType: originalLayout.layoutType,
      maxSponsors: originalLayout.maxSponsors,
    };

    // Copy grid-specific properties if it's a grid layout
    if (originalLayout.layoutType === "grid") {
      layoutData.rows = originalLayout.rows;
      layoutData.columns = originalLayout.columns;
      layoutData.totalPositions = originalLayout.totalPositions;
      layoutData.arrangement = originalLayout.arrangement;

      // Create placements with the same structure but no sponsors
      layoutData.placements = originalLayout.placements.map(
        (placement: any) => ({
          positionId: placement.positionId,
          row: placement.row,
          col: placement.col,
          price: placement.price,
          isTaken: false, // Reset to not taken
          // Don't copy sponsorId
        })
      );
    } else {
      // For flexible layouts, just create an empty placements array
      layoutData.placements = [];
    }

    await ShirtLayout.create(layoutData);
  }

  return newCampaign;
};
