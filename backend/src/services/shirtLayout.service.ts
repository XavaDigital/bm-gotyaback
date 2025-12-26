import { ShirtLayout } from "../models/ShirtLayout";
import mongoose from "mongoose";
import { PricingConfig } from "../types/campaign.types";
import { calculatePositionPrice } from "./pricing.service";

// Generate position array based on campaign type
export const generatePositions = (
  totalPositions: number,
  columns: number,
  campaignType: string,
  pricing: PricingConfig,
  arrangement: "horizontal" | "vertical" = "horizontal",
  layoutStyle?: string
) => {
  const positions = [];
  const rows = Math.ceil(totalPositions / columns);
  let positionNumber = 1;

  // For sections layout, pricing is tier-based, not position-based
  const isSectionsLayout = layoutStyle === "sections";

  // For sections layout, distribute positions across tiers
  let tierDistribution: { tierNumber: number; price: number; count: number }[] =
    [];
  if (isSectionsLayout && pricing.priceTiers) {
    // Calculate how many positions per tier (distribute evenly)
    const positionsPerTier = Math.floor(
      totalPositions / pricing.priceTiers.length
    );
    const remainder = totalPositions % pricing.priceTiers.length;

    tierDistribution = pricing.priceTiers.map((tier, index) => ({
      tierNumber: tier.tierNumber,
      price: tier.price,
      count: positionsPerTier + (index < remainder ? 1 : 0), // Distribute remainder to first tiers
    }));

    console.log("Tier distribution:", tierDistribution);
  }

  // Helper to get tier for current position (for sections layout)
  const getTierForPosition = (posNum: number) => {
    if (!isSectionsLayout || tierDistribution.length === 0) return null;

    let cumulativeCount = 0;
    for (const tier of tierDistribution) {
      cumulativeCount += tier.count;
      if (posNum <= cumulativeCount) {
        return { tierNumber: tier.tierNumber, price: tier.price };
      }
    }
    return tierDistribution[tierDistribution.length - 1]; // Fallback to last tier
  };

  if (arrangement === "horizontal") {
    // Horizontal arrangement: fill rows first (left to right, top to bottom)
    // Position 1, 2, 3 are in the first row
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (positionNumber > totalPositions) break;

        const positionId = positionNumber.toString();
        let price = 0;
        let tier = undefined;

        if (isSectionsLayout) {
          const tierInfo = getTierForPosition(positionNumber);
          if (tierInfo) {
            price = tierInfo.price;
            tier = tierInfo.tierNumber;
          }
        } else if (campaignType === "fixed" && pricing.fixedPrice) {
          price = pricing.fixedPrice;
        } else if (campaignType === "positional") {
          // Use the new pricing service for positional pricing
          price = calculatePositionPrice(positionNumber, pricing);
        }

        positions.push({
          positionId,
          row: row + 1,
          col: col + 1,
          price,
          isTaken: false,
          ...(tier !== undefined && { tier }), // Only add tier if it's defined
        });

        positionNumber++;
      }
    }
  } else {
    // Vertical arrangement: fill columns first (top to bottom, left to right)
    // Position 1, 2, 3 are in the first column
    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        if (positionNumber > totalPositions) break;

        const positionId = positionNumber.toString();
        let price = 0;
        let tier = undefined;

        if (isSectionsLayout) {
          const tierInfo = getTierForPosition(positionNumber);
          if (tierInfo) {
            price = tierInfo.price;
            tier = tierInfo.tierNumber;
          }
        } else if (campaignType === "fixed" && pricing.fixedPrice) {
          price = pricing.fixedPrice;
        } else if (campaignType === "positional") {
          // Use the new pricing service for positional pricing
          price = calculatePositionPrice(positionNumber, pricing);
        }

        positions.push({
          positionId,
          row: row + 1,
          col: col + 1,
          price,
          isTaken: false,
          ...(tier !== undefined && { tier }), // Only add tier if it's defined
        });

        positionNumber++;
      }
    }
  }

  return positions;
};

export const createLayout = async (
  campaignId: string,
  totalPositions: number,
  columns: number,
  campaignType: string,
  pricing: PricingConfig,
  arrangement: "horizontal" | "vertical" = "horizontal",
  layoutStyle?: string
) => {
  // Check if layout already exists for this campaign
  const existingLayout = await ShirtLayout.findOne({ campaignId });
  if (existingLayout) {
    throw new Error("Layout already exists for this campaign");
  }

  console.log("=== CREATE LAYOUT ===");
  console.log("campaignType:", campaignType);
  console.log("layoutStyle:", layoutStyle);
  console.log("totalPositions:", totalPositions);
  console.log("pricing:", JSON.stringify(pricing, null, 2));

  const rows = Math.ceil(totalPositions / columns);
  const positions = generatePositions(
    totalPositions,
    columns,
    campaignType,
    pricing,
    arrangement,
    layoutStyle
  );

  console.log("Generated positions (first 5):", positions.slice(0, 5));
  console.log("Generated positions (last 5):", positions.slice(-5));

  const layout = await ShirtLayout.create({
    campaignId,
    layoutType: "grid",
    rows,
    columns,
    totalPositions,
    arrangement,
    placements: positions,
  });

  return layout;
};

// Create flexible layout for pay-what-you-want campaigns
export const createFlexibleLayout = async (
  campaignId: string,
  maxSponsors?: number
) => {
  // Check if layout already exists for this campaign
  const existingLayout = await ShirtLayout.findOne({ campaignId });
  if (existingLayout) {
    throw new Error("Layout already exists for this campaign");
  }

  const layout = await ShirtLayout.create({
    campaignId,
    layoutType: "flexible",
    maxSponsors: maxSponsors || null,
    placements: [], // No fixed placements for flexible layouts
  });

  return layout;
};

export const getLayoutByCampaignId = async (campaignId: string) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    throw new Error("Invalid campaign ID");
  }

  const layout = await ShirtLayout.findOne({ campaignId });

  if (!layout) {
    throw new Error("Layout not found for this campaign");
  }

  return layout;
};

// Atomic position reservation to prevent double booking
export const reservePosition = async (layoutId: string, positionId: string) => {
  const layout = await ShirtLayout.findOneAndUpdate(
    {
      _id: layoutId,
      "placements.positionId": positionId,
      "placements.isTaken": false,
    },
    {
      $set: { "placements.$.isTaken": true },
    },
    { new: true }
  );

  if (!layout) {
    throw new Error("Position not available or already taken");
  }

  return layout;
};

// Release position (for failed payments or cancellations)
export const releasePosition = async (layoutId: string, positionId: string) => {
  const layout = await ShirtLayout.findOneAndUpdate(
    {
      _id: layoutId,
      "placements.positionId": positionId,
    },
    {
      $set: { "placements.$.isTaken": false },
    },
    { new: true }
  );

  if (!layout) {
    throw new Error("Position not found");
  }

  return layout;
};

// Get position details
export const getPositionDetails = async (
  layoutId: string,
  positionId: string
) => {
  const layout = await ShirtLayout.findById(layoutId);

  if (!layout) {
    throw new Error("Layout not found");
  }

  const position = layout.placements.find(
    (p: any) => p.positionId === positionId
  );

  if (!position) {
    throw new Error("Position not found");
  }

  return position;
};
