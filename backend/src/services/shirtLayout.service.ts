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
  arrangement: "horizontal" | "vertical" = "horizontal"
) => {
  const positions = [];
  const rows = Math.ceil(totalPositions / columns);
  let positionNumber = 1;

  if (arrangement === "horizontal") {
    // Horizontal arrangement: fill rows first (left to right, top to bottom)
    // Position 1, 2, 3 are in the first row
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (positionNumber > totalPositions) break;

        const positionId = positionNumber.toString();
        let price = 0;

        if (campaignType === "fixed" && pricing.fixedPrice) {
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

        if (campaignType === "fixed" && pricing.fixedPrice) {
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
  arrangement: "horizontal" | "vertical" = "horizontal"
) => {
  // Check if layout already exists for this campaign
  const existingLayout = await ShirtLayout.findOne({ campaignId });
  if (existingLayout) {
    throw new Error("Layout already exists for this campaign");
  }

  const rows = Math.ceil(totalPositions / columns);
  const positions = generatePositions(
    totalPositions,
    columns,
    campaignType,
    pricing,
    arrangement
  );

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
