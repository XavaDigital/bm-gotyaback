import { SponsorEntry } from "../models/SponsorEntry";
import { Campaign } from "../models/Campaign";
import * as shirtLayoutService from "./shirtLayout.service";
import * as campaignService from "./campaign.service";
import mongoose from "mongoose";
import { calculateSizeTier, calculateDisplaySizes } from "./pricing.service";
import { PricingConfig, SponsorType } from "../types/campaign.types";

export const createSponsorship = async (
  campaignId: string,
  sponsorData: {
    positionId?: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
    amount: number;
    paymentMethod: "card" | "cash" | "afterpay";
    sponsorType?: SponsorType;
    logoUrl?: string;
    displayName?: string;
  },
  positionAlreadyReserved = false,
) => {
  // Get campaign and validate it's open
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  campaignService.validateCampaignIsOpen(campaign);

  // For PWYW campaigns, enforce the server-side minimum so a cash sponsor cannot
  // send $0.01 and receive a "large" display tier.
  if (campaign.campaignType === "pay-what-you-want") {
    const config = campaign.pricingConfig as PricingConfig;
    const minimumAmount: number | undefined =
      config?.minimumAmount ??
      (config?.sizeTiers && config.sizeTiers.length > 0
        ? Math.min(...config.sizeTiers.map((t) => t.minAmount ?? 0))
        : undefined);

    if (minimumAmount !== undefined && minimumAmount > 0 && sponsorData.amount < minimumAmount) {
      throw new Error(`Minimum sponsorship amount is ${minimumAmount}`);
    }
  }

  // For positional and fixed campaigns, verify the positionId and optionally reserve it.
  // Always scope the lookup by campaignId so a crafted positionId from another campaign's
  // layout cannot be injected via Stripe PaymentIntent metadata.
  if (
    (campaign.campaignType === "positional" || campaign.campaignType === "fixed") &&
    sponsorData.positionId
  ) {
    const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);

    // This throws "Position not found" if positionId does not belong to this campaign's layout.
    const position = await shirtLayoutService.getPositionDetails(
      layout._id.toString(),
      sponsorData.positionId,
    );

    if (!positionAlreadyReserved) {
      // Verify amount matches position price
      if (sponsorData.amount !== position.price) {
        throw new Error("Amount does not match position price");
      }

      // Atomically reserve the position
      try {
        await shirtLayoutService.reservePosition(
          layout._id.toString(),
          sponsorData.positionId,
        );
      } catch (error) {
        throw new Error("Position not available or already taken");
      }
    }
  }

  // Calculate display metrics for pay-what-you-want campaigns
  type DisplayMetrics =
    | { kind: "text"; fontSize: number }
    | { kind: "logo"; logoWidth: number }
    | null;
  let displayMetrics: DisplayMetrics = null;

  if (campaign.campaignType === "pay-what-you-want") {
    const sponsorType = sponsorData.sponsorType || "text";
    if (
      campaign.pricingConfig?.sizeTiers &&
      campaign.pricingConfig.sizeTiers.length > 0
    ) {
      const tier = calculateSizeTier(
        sponsorData.amount,
        (campaign.pricingConfig as PricingConfig).sizeTiers,
      );
      if (tier) {
        const sizes = calculateDisplaySizes(sponsorData.amount, tier, sponsorType);
        displayMetrics = sizes.fontSize !== undefined
          ? { kind: "text", fontSize: sizes.fontSize }
          : { kind: "logo", logoWidth: sizes.logoWidth! };
      }
    }
    if (!displayMetrics) {
      displayMetrics = sponsorType === "text"
        ? { kind: "text", fontSize: 16 }
        : { kind: "logo", logoWidth: 80 };
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
        sponsorData.paymentMethod === "cash" ? "pending" : "paid",
      sponsorType: sponsorData.sponsorType || "text",
      logoUrl: sponsorData.logoUrl,
      displayName: sponsorData.displayName,
      logoApprovalStatus,
      displayMetrics: displayMetrics ?? undefined,
    });

    return sponsorEntry;
  } catch (error) {
    // If sponsorship creation fails, release the position so it is not permanently locked.
    if (
      (campaign.campaignType === "positional" ||
        campaign.campaignType === "fixed") &&
      sponsorData.positionId
    ) {
      try {
        const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
        await shirtLayoutService.releasePosition(
          layout._id.toString(),
          sponsorData.positionId,
        );
      } catch (releaseError) {
        // CRITICAL: position is permanently locked and requires manual intervention.
        console.error(
          "CRITICAL: Failed to release position after SponsorEntry creation failure. Manual intervention required.",
          { campaignId, positionId: sponsorData.positionId, releaseError },
        );
      }
    }
    throw error;
  }
};

export const getSponsorsByCampaign = async (
  campaignId: string,
  userId: string,
  page: number = 1,
  limit: number = 50,
  filters?: { paymentStatus?: string; logoApprovalStatus?: string }
) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }
  if (campaign.ownerId.toString() !== userId) {
    throw new Error("Not authorized to view sponsors for this campaign");
  }

  const VALID_PAYMENT_STATUSES = new Set(["pending", "paid", "failed"]);
  const VALID_LOGO_STATUSES = new Set(["pending", "approved", "rejected"]);

  if (filters?.paymentStatus && !VALID_PAYMENT_STATUSES.has(filters.paymentStatus)) {
    throw new Error("Invalid paymentStatus filter");
  }
  if (filters?.logoApprovalStatus && !VALID_LOGO_STATUSES.has(filters.logoApprovalStatus)) {
    throw new Error("Invalid logoApprovalStatus filter");
  }

  const query: any = { campaignId };
  if (filters?.paymentStatus) query.paymentStatus = filters.paymentStatus;
  if (filters?.logoApprovalStatus) query.logoApprovalStatus = filters.logoApprovalStatus;

  const skip = (page - 1) * limit;

  const [sponsors, total] = await Promise.all([
    SponsorEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SponsorEntry.countDocuments(query),
  ]);

  return {
    sponsors,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
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
  newStatus: "pending" | "paid",
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
      "Not authorized to update payment status for this sponsorship",
    );
  }

  // Only allow status changes for cash/manual payments
  if (sponsorship.paymentMethod === "card") {
    throw new Error(
      "Cannot manually change payment status for card payments. Card payments are managed by Stripe.",
    );
  }

  // Update status
  sponsorship.paymentStatus = newStatus;
  await sponsorship.save();

  return sponsorship;
};

// Get public sponsor list (paid sponsors with text or approved logos)
export const getPublicSponsors = async (campaignId: string) => {
  const sponsors = await SponsorEntry.find({
    campaignId,
    paymentStatus: "paid", // Only show paid sponsors
    $or: [
      { sponsorType: "text" }, // All text sponsors
      { sponsorType: "logo", logoApprovalStatus: "approved" }, // Only approved logo sponsors
    ],
  }).select(
    // Explicitly exclude sensitive fields: email, phone, paymentMethod
    "name message positionId createdAt sponsorType logoUrl displayName logoApprovalStatus displayMetrics amount paymentStatus",
  );

  return sponsors;
};

export const validatePositionAvailable = async (
  layoutId: string,
  positionId: string,
) => {
  const position = await shirtLayoutService.getPositionDetails(
    layoutId,
    positionId,
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
  rejectionReason?: string,
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
  userId: string,
  page: number = 1,
  limit: number = 50,
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

  const query = {
    campaignId,
    sponsorType: "logo",
    logoApprovalStatus: "pending",
  };

  const skip = (page - 1) * limit;

  const [pendingLogos, total] = await Promise.all([
    SponsorEntry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    SponsorEntry.countDocuments(query),
  ]);

  return {
    pendingLogos,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// Approve all pending logos for a campaign
export const approveAllLogoSponsorships = async (
  campaignId: string,
  userId: string,
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
    throw new Error("Not authorized to approve logos for this campaign");
  }

  // Update all pending logos to approved
  const result = await SponsorEntry.updateMany(
    {
      campaignId,
      sponsorType: "logo",
      logoApprovalStatus: "pending",
    },
    {
      $set: { logoApprovalStatus: "approved" },
    },
  );

  return result;
};
