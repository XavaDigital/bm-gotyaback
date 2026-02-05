import { Request, Response } from "express";
import { SponsorEntry } from "../models/SponsorEntry";
import { Campaign } from "../models/Campaign";
import { ShirtLayout } from "../models/ShirtLayout";
import mongoose from "mongoose";
import * as campaignService from "../services/campaign.service";
import { calculatePositionPrice } from "../services/pricing.service";
import { getPaginationParams, getSkipValue, createPaginatedResponse } from "../utils/pagination";
import { logAdminAction, getClientIp, AuditAction } from "../utils/auditLogger";

// Sample logo URLs for seeding (using real sponsor logos)
const sampleLogoUrls = [
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
  // Repeat logos to have more variety for seeding
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768546097400-h83iuq/attachment_125990042-1768546097401.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545854052-sjht05/discord-1768545854052.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545775448-35co8k/Lorraine-Tuhoe-Estore-06-600x450-1768545775449.png",
  "https://s3.amazonaws.com/media.reviewus.plus/sponsors/logos/temp-1768545984396-9jwqw/Hamilton-Hawks-Estore-1024x768-1768545984396.png",
];

// Helper function to generate random sponsor data based on campaign type
const generateRandomSponsor = (
  campaignId: string,
  index: number,
  campaign: any,
  layout: any,
  availablePositions: any[],
) => {
  const firstNames = [
    "John",
    "Jane",
    "Michael",
    "Sarah",
    "David",
    "Emily",
    "Chris",
    "Jessica",
    "Daniel",
    "Ashley",
    "Matthew",
    "Amanda",
    "James",
    "Melissa",
    "Robert",
    "Jennifer",
    "William",
    "Linda",
    "Richard",
    "Patricia",
    "Thomas",
    "Nancy",
  ];

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
  ];

  const businessSuffixes = [
    "& Co.",
    "Enterprises",
    "Group",
    "Industries",
    "Solutions",
    "Services",
    "Corporation",
    "LLC",
    "Inc.",
    "Partners",
    "Associates",
    "Consulting",
    "Holdings",
    "Ventures",
    "Capital",
    "Technologies",
    "Systems",
    "Designs",
  ];

  const messages = [
    "Great cause!",
    "Happy to support!",
    "Keep up the good work!",
    "Best of luck!",
    "Proud to be a sponsor!",
    "Go team!",
    "Well done!",
    "Amazing initiative!",
    null, // Some sponsors don't leave messages
    null,
  ];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  const name = `${firstName} ${lastName}`;
  const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@example.com`;
  const phone = `+64${Math.floor(Math.random() * 900000000 + 100000000)}`;
  const message = messages[Math.floor(Math.random() * messages.length)];

  let amount: number;
  let positionId: string | undefined;
  let displaySize: "small" | "medium" | "large" | "xlarge";
  let calculatedFontSize: number | undefined;
  let calculatedLogoWidth: number | undefined;

  // Determine amount and position based on campaign type and layout type
  if (layout.layoutType === "grid" && availablePositions.length > 0) {
    // For grid layouts (fixed or positional), pick a random available position
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions[randomIndex];
    positionId = position.positionId;
    amount = position.price;

    // Remove this position from available positions
    availablePositions.splice(randomIndex, 1);
  } else {
    // For flexible layouts, amount depends on campaign type
    if (campaign.campaignType === "fixed") {
      // Fixed pricing: use the fixed price from pricing config
      amount = campaign.pricingConfig?.fixedPrice || 50;
    } else if (campaign.campaignType === "positional") {
      // Positional pricing with flexible layout: calculate price based on simulated position
      // Use index + 1 as the position number to generate varying prices
      const simulatedPosition = index + 1;
      try {
        amount = calculatePositionPrice(simulatedPosition, campaign.pricingConfig);
      } catch (error) {
        // Fallback if pricing config is invalid
        amount = campaign.pricingConfig?.basePrice || 50;
      }
    } else {
      // Pay-what-you-want: generate random amount
      amount = Math.floor(Math.random() * 180) + 20;
    }
  }

  // Determine sponsor type based on campaign settings
  let sponsorType: "text" | "logo";
  if (campaign.sponsorDisplayType === "logo-only") {
    sponsorType = "logo";
  } else if (campaign.sponsorDisplayType === "text-only") {
    sponsorType = "text";
  } else {
    // For "both", always choose logo so we have the image
    sponsorType = "logo";
  }

  // Determine display size based on campaign type and amount
  if (
    campaign.campaignType === "pay-what-you-want" &&
    campaign.pricingConfig?.sizeTiers
  ) {
    // Use size tiers for pay-what-you-want
    const tier = campaign.pricingConfig.sizeTiers.find((t: any) => {
      const minMatch = !t.minAmount || amount >= t.minAmount;
      const maxMatch = !t.maxAmount || amount <= t.maxAmount;
      return minMatch && maxMatch;
    });

    if (tier) {
      displaySize = tier.size;
      if (sponsorType === "text") {
        calculatedFontSize = tier.textFontSize || 16;
      } else {
        calculatedLogoWidth = tier.logoWidth || 80;
      }
    } else {
      // Fallback
      displaySize = "medium";
      if (sponsorType === "text") {
        calculatedFontSize = 18;
      } else {
        calculatedLogoWidth = 80;
      }
    }
  } else if (campaign.campaignType === "fixed") {
    // For fixed pricing, all sponsors have the same amount and should have the same size
    // Use a consistent size based on the fixed price
    if (amount < 50) {
      displaySize = "small";
      calculatedFontSize = 14;
      calculatedLogoWidth = 60;
    } else if (amount < 100) {
      displaySize = "medium";
      calculatedFontSize = 18;
      calculatedLogoWidth = 80;
    } else if (amount < 150) {
      displaySize = "large";
      calculatedFontSize = 24;
      calculatedLogoWidth = 120;
    } else {
      displaySize = "xlarge";
      calculatedFontSize = 32;
      calculatedLogoWidth = 160;
    }
  } else {
    // For positional pricing, use amount-based sizing (amounts vary by position)
    if (amount < 50) {
      displaySize = "small";
      calculatedFontSize = 14;
      calculatedLogoWidth = 60;
    } else if (amount < 100) {
      displaySize = "medium";
      calculatedFontSize = 18;
      calculatedLogoWidth = 80;
    } else if (amount < 150) {
      displaySize = "large";
      calculatedFontSize = 24;
      calculatedLogoWidth = 120;
    } else {
      displaySize = "xlarge";
      calculatedFontSize = 32;
      calculatedLogoWidth = 160;
    }
  }

  // Generate logo URL if sponsor type is logo
  const logoUrl =
    sponsorType === "logo"
      ? sampleLogoUrls[index % sampleLogoUrls.length]
      : undefined;

  // Generate displayName for logo sponsors when campaign display type is "both"
  let displayName: string | undefined;
  if (sponsorType === "logo" && campaign.sponsorDisplayType === "both") {
    // Generate a business name different from the personal name
    const businessSuffix =
      businessSuffixes[Math.floor(Math.random() * businessSuffixes.length)];
    displayName = `${lastName} ${businessSuffix}`;
  }

  const sponsor: any = {
    campaignId,
    positionId,
    name,
    email,
    phone,
    message,
    amount,
    paymentMethod: "card" as const,
    paymentStatus: "paid" as const,
    sponsorType,
    displaySize,
  };

  // Add logo-specific fields
  if (sponsorType === "logo") {
    sponsor.logoUrl = logoUrl;
    sponsor.logoApprovalStatus = "approved"; // Auto-approve seeded logos
    sponsor.calculatedLogoWidth = calculatedLogoWidth;
    if (displayName) {
      sponsor.displayName = displayName;
    }
  } else {
    sponsor.calculatedFontSize = calculatedFontSize;
  }

  return sponsor;
};

export const seedSponsors = async (req: Request, res: Response) => {
  try {
    const { campaignId, numberOfSponsors } = req.body;

    // Log admin action
    logAdminAction(
      AuditAction.ADMIN_SEED_DATA,
      req.user?._id.toString() || 'unknown',
      req.user?.email || 'unknown',
      getClientIp(req),
      'Campaign',
      campaignId,
      { numberOfSponsors }
    );

    // Validation
    if (!campaignId || !numberOfSponsors) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    if (numberOfSponsors < 1 || numberOfSponsors > 100) {
      return res
        .status(400)
        .json({ message: "Number of sponsors must be between 1 and 100" });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Get layout for the campaign
    const layout = await ShirtLayout.findOne({ campaignId });
    if (!layout) {
      return res.status(404).json({
        message:
          "Layout not found for this campaign. Please create a layout first.",
      });
    }

    // Get available positions for grid layouts
    let availablePositions: any[] = [];
    if (layout.layoutType === "grid") {
      // Get positions that are not taken
      availablePositions = layout.placements.filter((p: any) => !p.isTaken);

      if (availablePositions.length < numberOfSponsors) {
        return res.status(400).json({
          message: `Only ${availablePositions.length} positions available, but ${numberOfSponsors} sponsors requested`,
        });
      }
    }

    // Generate and insert sponsors
    const sponsors = [];
    for (let i = 0; i < numberOfSponsors; i++) {
      sponsors.push(
        generateRandomSponsor(
          campaignId,
          i,
          campaign,
          layout,
          availablePositions,
        ),
      );
    }

    const result = await SponsorEntry.insertMany(sponsors);

    // Update layout to mark positions as taken
    if (layout.layoutType === "grid") {
      for (const sponsor of result) {
        if (sponsor.positionId) {
          const placement = layout.placements.find(
            (p: any) => p.positionId === sponsor.positionId,
          );
          if (placement) {
            placement.isTaken = true;
            placement.sponsorId = sponsor._id;
          }
        }
      }
      await layout.save();
    }

    res.status(201).json({
      message: `Successfully seeded ${result.length} sponsors`,
      count: result.length,
      sponsors: result,
    });
  } catch (error) {
    console.error("Error seeding sponsors:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const getAllCampaigns = async (req: Request, res: Response) => {
  try {
    // Log admin action
    logAdminAction(
      AuditAction.ADMIN_VIEW_ALL_CAMPAIGNS,
      req.user?._id.toString() || 'unknown',
      req.user?.email || 'unknown',
      getClientIp(req)
    );

    const { page, limit } = getPaginationParams(req.query, 20, 100);
    const skip = getSkipValue(page, limit);

    const [campaigns, total] = await Promise.all([
      Campaign.find()
        .populate('ownerId', 'name email organizerProfile')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Campaign.countDocuments(),
    ]);

    const response = createPaginatedResponse(campaigns, total, page, limit);
    res.json(response);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    // Log admin action
    logAdminAction(
      AuditAction.ADMIN_DELETE_CAMPAIGN,
      req.user?._id.toString() || 'unknown',
      req.user?.email || 'unknown',
      getClientIp(req),
      'Campaign',
      req.params.id
    );

    const result = await campaignService.deleteCampaign(req.params.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("not found") ? 404 : 400;
    res.status(status).json({ message });
  }
};

export const approveAllLogos = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "Missing campaignId" });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    const { SponsorEntry } = require("../models/SponsorEntry");

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

    res.json({
      message: `Approved ${result.modifiedCount} logos`,
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error approving logos:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const markAllAsPaid = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "Missing campaignId" });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    const { SponsorEntry } = require("../models/SponsorEntry");

    // Update all pending payments to paid
    const result = await SponsorEntry.updateMany(
      {
        campaignId,
        paymentStatus: "pending",
      },
      {
        $set: { paymentStatus: "paid" },
      },
    );

    res.json({
      message: `Marked ${result.modifiedCount} sponsors as paid`,
      count: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking sponsors as paid:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const clearSponsors = async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.body;

    if (!campaignId) {
      return res.status(400).json({ message: "Missing campaignId" });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    const { SponsorEntry } = require("../models/SponsorEntry");

    // Clear shirt layout positions
    const layout = await ShirtLayout.findOne({ campaignId });
    if (layout && layout.placements && layout.placements.length > 0) {
      layout.placements.forEach((placement: any) => {
        placement.isTaken = false;
        placement.sponsorId = undefined;
      });
      await layout.save();
    }

    // Delete all sponsors for this campaign
    const result = await SponsorEntry.deleteMany({
      campaignId,
    });

    res.json({
      message: `Deleted ${result.deletedCount} sponsors and cleared layout`,
      count: result.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing sponsors:", error);
    res.status(500).json({ message: (error as Error).message });
  }
};
