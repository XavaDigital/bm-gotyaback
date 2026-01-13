import { SponsorEntry } from "../models/SponsorEntry";
import { Campaign } from "../models/Campaign";
import * as shirtLayoutService from "./shirtLayout.service";
import * as campaignService from "./campaign.service";
import mongoose from "mongoose";
import { calculateSizeTier, calculateDisplaySizes } from "./pricing.service";
import { SponsorType } from "../types/campaign.types";

export const createSponsorship = async (
  campaignId: string,
  sponsorData: {
    positionId?: string;
    name: string;
    email: string;
    phone: string;
    message?: string;
    amount: number;
    paymentMethod: "card" | "cash";
    sponsorType?: SponsorType;
    logoUrl?: string;
  }
) => {
  // Get campaign and validate it's open
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  campaignService.validateCampaignIsOpen(campaign);

  // For positional and fixed campaigns, we need to reserve a position
  if (
    (campaign.campaignType === "positional" ||
      campaign.campaignType === "fixed") &&
    sponsorData.positionId
  ) {
    const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);

    // Get position details to verify price
    const position = await shirtLayoutService.getPositionDetails(
      layout._id.toString(),
      sponsorData.positionId
    );

    // Verify amount matches position price
    if (sponsorData.amount !== position.price) {
      throw new Error("Amount does not match position price");
    }

    // Atomically reserve the position
    try {
      await shirtLayoutService.reservePosition(
        layout._id.toString(),
        sponsorData.positionId
      );
    } catch (error) {
      throw new Error("Position not available or already taken");
    }
  }

  // Calculate display size for pay-what-you-want campaigns
  let displaySize: "small" | "medium" | "large" | "xlarge" = "medium";
  let calculatedFontSize: number | undefined;
  let calculatedLogoWidth: number | undefined;

  if (campaign.campaignType === "pay-what-you-want") {
    if (
      campaign.pricingConfig?.sizeTiers &&
      campaign.pricingConfig.sizeTiers.length > 0
    ) {
      // Use size tiers if defined
      const tier = calculateSizeTier(
        sponsorData.amount,
        campaign.pricingConfig.sizeTiers as any
      );

      if (tier) {
        displaySize = tier.size;
        const sponsorType = sponsorData.sponsorType || "text";
        const sizes = calculateDisplaySizes(
          sponsorData.amount,
          tier,
          sponsorType
        );
        calculatedFontSize = sizes.fontSize;
        calculatedLogoWidth = sizes.logoWidth;
      }
    } else {
      // No size tiers - use simple proportional sizing based on amount
      // Default: medium size for all sponsors
      displaySize = "medium";
      const sponsorType = sponsorData.sponsorType || "text";

      // Simple proportional sizing: base size + amount-based scaling
      if (sponsorType === "text") {
        calculatedFontSize = 16; // Default medium text size
      } else {
        calculatedLogoWidth = 80; // Default medium logo size
      }
    }
  }

  // Determine logo approval status
  const logoApprovalStatus = sponsorData.logoUrl ? "pending" : "approved";

  // Create sponsorship entry
  try {
    const sponsorEntry = await SponsorEntry.create({
      campaignId,
      positionId: sponsorData.positionId,
      name: sponsorData.name,
      email: sponsorData.email,
      phone: sponsorData.phone,
      message: sponsorData.message,
      amount: sponsorData.amount,
      paymentMethod: sponsorData.paymentMethod,
      paymentStatus:
        sponsorData.paymentMethod === "cash" ? "pending" : "pending",
      sponsorType: sponsorData.sponsorType || "text",
      logoUrl: sponsorData.logoUrl,
      logoApprovalStatus,
      displaySize,
      calculatedFontSize,
      calculatedLogoWidth,
    });

    return sponsorEntry;
  } catch (error) {
    // If sponsorship creation fails, release the position
    if (
      (campaign.campaignType === "positional" ||
        campaign.campaignType === "fixed") &&
      sponsorData.positionId
    ) {
      const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
      await shirtLayoutService.releasePosition(
        layout._id.toString(),
        sponsorData.positionId
      );
    }
    throw error;
  }
};

export const getSponsorsByCampaign = async (campaignId: string) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const sponsors = await SponsorEntry.find({ campaignId }).sort({
    createdAt: -1,
  });
  return sponsors;
};

export const markAsPaid = async (sponsorshipId: string, userId: string) => {
  if (!mongoose.Types.ObjectId.isValid(sponsorshipId)) {
    throw new Error("Invalid sponsorship ID");
  }

  const sponsorship = await SponsorEntry.findById(sponsorshipId);
  if (!sponsorship) {
    throw new Error("Sponsorship not found");
  }

  // Verify campaign ownership
  const campaign = await Campaign.findById(sponsorship.campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.ownerId.toString() !== userId) {
    throw new Error("Not authorized to mark payment for this sponsorship");
  }

  if (sponsorship.paymentStatus === "paid") {
    throw new Error("Sponsorship is already marked as paid");
  }

  sponsorship.paymentStatus = "paid";
  await sponsorship.save();

  return sponsorship;
};

export const updatePaymentStatus = async (
  sponsorshipId: string,
  userId: string,
  newStatus: "pending" | "paid"
) => {
  if (!mongoose.Types.ObjectId.isValid(sponsorshipId)) {
    throw new Error("Invalid sponsorship ID");
  }

  const sponsorship = await SponsorEntry.findById(sponsorshipId);
  if (!sponsorship) {
    throw new Error("Sponsorship not found");
  }

  // Verify campaign ownership
  const campaign = await Campaign.findById(sponsorship.campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.ownerId.toString() !== userId) {
    throw new Error(
      "Not authorized to update payment status for this sponsorship"
    );
  }

  // Only allow status changes for cash/manual payments
  if (sponsorship.paymentMethod === "card") {
    throw new Error(
      "Cannot manually change payment status for card payments. Card payments are managed by Stripe."
    );
  }

  // Update status
  sponsorship.paymentStatus = newStatus;
  await sponsorship.save();

  return sponsorship;
};

// Get public sponsor list (text sponsors + approved logo sponsors)
export const getPublicSponsors = async (campaignId: string) => {
  const sponsors = await SponsorEntry.find({
    campaignId,
    $or: [
      { sponsorType: "text" }, // All text sponsors
      { sponsorType: "logo", logoApprovalStatus: "approved" }, // Only approved logo sponsors
    ],
  }).select(
    "name message positionId createdAt sponsorType logoUrl displaySize calculatedFontSize calculatedLogoWidth paymentStatus amount"
  );

  return sponsors;
};

export const validatePositionAvailable = async (
  layoutId: string,
  positionId: string
) => {
  const position = await shirtLayoutService.getPositionDetails(
    layoutId,
    positionId
  );

  if (position.isTaken) {
    throw new Error("Position is already taken");
  }

  return true;
};

// Approve or reject logo sponsorship
export const approveLogoSponsorship = async (
  sponsorshipId: string,
  userId: string,
  approved: boolean,
  rejectionReason?: string
) => {
  if (!mongoose.Types.ObjectId.isValid(sponsorshipId)) {
    throw new Error("Invalid sponsorship ID");
  }

  const sponsorship = await SponsorEntry.findById(sponsorshipId);
  if (!sponsorship) {
    throw new Error("Sponsorship not found");
  }

  // Verify campaign ownership
  const campaign = await Campaign.findById(sponsorship.campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.ownerId.toString() !== userId) {
    throw new Error("Not authorized to approve logos for this campaign");
  }

  // Update logo approval status
  sponsorship.logoApprovalStatus = approved ? "approved" : "rejected";
  if (!approved && rejectionReason) {
    sponsorship.logoRejectionReason = rejectionReason;
  }

  await sponsorship.save();

  // TODO: Send email notification to sponsor about approval/rejection

  return sponsorship;
};

// Get pending logo approvals for a campaign
export const getPendingLogoApprovals = async (
  campaignId: string,
  userId: string
) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  // Verify campaign ownership
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.ownerId.toString() !== userId) {
    throw new Error("Not authorized to view logo approvals for this campaign");
  }

  const pendingLogos = await SponsorEntry.find({
    campaignId,
    sponsorType: "logo",
    logoApprovalStatus: "pending",
  }).sort({ createdAt: -1 });

  return pendingLogos;
};
