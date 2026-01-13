import { Request, Response } from "express";
import { SponsorEntry } from "../models/SponsorEntry";
import { Campaign } from "../models/Campaign";
import { ShirtLayout } from "../models/ShirtLayout";
import mongoose from "mongoose";
import * as campaignService from "../services/campaign.service";

// Helper function to generate random sponsor data based on campaign type
const generateRandomSponsor = (
  campaignId: string,
  index: number,
  campaign: any,
  layout: any,
  availablePositions: any[]
) => {
  const firstNames = [
    "John", "Jane", "Michael", "Sarah", "David", "Emily", "Chris", "Jessica",
    "Daniel", "Ashley", "Matthew", "Amanda", "James", "Melissa", "Robert",
    "Jennifer", "William", "Linda", "Richard", "Patricia", "Thomas", "Nancy"
  ];

  const lastNames = [
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
    "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez",
    "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin"
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
  let calculatedFontSize: number;

  // Determine amount and position based on campaign type
  if (layout.layoutType === "grid" && availablePositions.length > 0) {
    // For grid layouts (fixed or positional), pick a random available position
    const randomIndex = Math.floor(Math.random() * availablePositions.length);
    const position = availablePositions[randomIndex];
    positionId = position.positionId;
    amount = position.price;

    // Remove this position from available positions
    availablePositions.splice(randomIndex, 1);
  } else {
    // For flexible layouts (pay-what-you-want), generate random amount
    amount = Math.floor(Math.random() * 180) + 20;
  }

  // Determine display size based on campaign type and amount
  if (campaign.campaignType === "pay-what-you-want" && campaign.pricingConfig?.sizeTiers) {
    // Use size tiers for pay-what-you-want
    const tier = campaign.pricingConfig.sizeTiers.find((t: any) => {
      const minMatch = !t.minAmount || amount >= t.minAmount;
      const maxMatch = !t.maxAmount || amount <= t.maxAmount;
      return minMatch && maxMatch;
    });

    if (tier) {
      displaySize = tier.size;
      calculatedFontSize = tier.textFontSize || 16;
    } else {
      // Fallback
      displaySize = "medium";
      calculatedFontSize = 18;
    }
  } else {
    // For fixed/positional, use simple amount-based sizing
    if (amount < 50) {
      displaySize = "small";
      calculatedFontSize = 14;
    } else if (amount < 100) {
      displaySize = "medium";
      calculatedFontSize = 18;
    } else if (amount < 150) {
      displaySize = "large";
      calculatedFontSize = 24;
    } else {
      displaySize = "xlarge";
      calculatedFontSize = 32;
    }
  }

  return {
    campaignId,
    positionId,
    name,
    email,
    phone,
    message,
    amount,
    paymentMethod: "card" as const,
    paymentStatus: "paid" as const,
    sponsorType: "text" as const,
    displaySize,
    calculatedFontSize,
  };
};

export const seedSponsors = async (req: Request, res: Response) => {
  try {
    const { campaignId, numberOfSponsors } = req.body;

    // Validation
    if (!campaignId || !numberOfSponsors) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign ID" });
    }

    if (numberOfSponsors < 1 || numberOfSponsors > 100) {
      return res.status(400).json({ message: "Number of sponsors must be between 1 and 100" });
    }

    // Check if campaign exists
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found" });
    }

    // Get layout for the campaign
    const layout = await ShirtLayout.findOne({ campaignId });
    if (!layout) {
      return res.status(404).json({ message: "Layout not found for this campaign. Please create a layout first." });
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
      sponsors.push(generateRandomSponsor(campaignId, i, campaign, layout, availablePositions));
    }

    const result = await SponsorEntry.insertMany(sponsors);

    // Update layout to mark positions as taken
    if (layout.layoutType === "grid") {
      for (const sponsor of result) {
        if (sponsor.positionId) {
          const placement = layout.placements.find((p: any) => p.positionId === sponsor.positionId);
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
    const campaigns = await campaignService.getAllCampaigns();
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const deleteCampaign = async (req: Request, res: Response) => {
  try {
    const result = await campaignService.deleteCampaign(req.params.id);
    res.json(result);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("not found") ? 404 : 400;
    res.status(status).json({ message });
  }
};
