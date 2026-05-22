import { ShirtLayout } from "../models/ShirtLayout";
import mongoose from "mongoose";
import { PricingConfig } from "../types/campaign.types";
import { calculatePositionPrice, parsePricingConfig } from "./pricing.service";

// Generate positions for section-based layout (top, middle, bottom)
export const generateSectionPositions = (
  pricing: PricingConfig,
  campaignType: string,
) => {
  if (!pricing.sections) {
    throw new Error(
      "Section configuration is required for section-based layout",
    );
  }

  const positions = [];
  let positionNumber = 1;

  // Generate positions for each section
  const sections: Array<"top" | "middle" | "bottom"> = [
    "top",
    "middle",
    "bottom",
  ];

  for (const section of sections) {
    const sectionConfig = pricing.sections[section];
    if (!sectionConfig) continue;

    const { slots, amount } = sectionConfig;

    for (let i = 0; i < slots; i++) {
      positions.push({
        positionId: positionNumber.toString(),
        section, // Store which section this position belongs to
        price: amount,
        isTaken: false,
      });
      positionNumber++;
    }
  }

  return positions;
};

// Generate position array based on campaign type
export const generatePositions = (
  totalPositions: number,
  columns: number,
  campaignType: string,
  pricing: PricingConfig,
  arrangement: "horizontal" | "vertical" = "horizontal",
) => {
  const campaignPricing = parsePricingConfig(campaignType, pricing);
  const positions = [];
  const rows = Math.ceil(totalPositions / columns);
  let positionNumber = 1;

  const priceForPosition = (pos: number): number => {
    if (campaignPricing.type === "fixed") return campaignPricing.fixedPrice;
    if (campaignPricing.type === "positional") {
      return calculatePositionPrice(pos, campaignPricing, undefined, totalPositions);
    }
    return campaignPricing.minimumAmount;
  };

  if (arrangement === "horizontal") {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (positionNumber > totalPositions) break;
        positions.push({
          positionId: positionNumber.toString(),
          row: row + 1,
          col: col + 1,
          price: priceForPosition(positionNumber),
          isTaken: false,
        });
        positionNumber++;
      }
    }
  } else {
    for (let col = 0; col < columns; col++) {
      for (let row = 0; row < rows; row++) {
        if (positionNumber > totalPositions) break;
        positions.push({
          positionId: positionNumber.toString(),
          row: row + 1,
          col: col + 1,
          price: priceForPosition(positionNumber),
          isTaken: false,
        });
        positionNumber++;
      }
    }
  }

  return positions;
};

// Create section-based layout for positional campaigns with amount-ordered layout
export const createSectionLayout = async (
  campaignId: string,
  campaignType: string,
  pricing: PricingConfig,
) => {
  // Check if layout already exists for this campaign
  const existingLayout = await ShirtLayout.findOne({ campaignId });
  if (existingLayout) {
    throw new Error("Layout already exists for this campaign");
  }

  const positions = generateSectionPositions(pricing, campaignType);
  const totalPositions = positions.length;

  const layout = await ShirtLayout.create({
    campaignId,
    layoutType: "grid",
    totalPositions,
    placements: positions,
  });

  return layout;
};

export const createLayout = async (
  campaignId: string,
  totalPositions: number,
  columns: number,
  campaignType: string,
  pricing: PricingConfig,
  arrangement: "horizontal" | "vertical" = "horizontal",
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
    arrangement,
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
  maxSponsors?: number,
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
    { new: true },
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
    { new: true },
  );

  if (!layout) {
    throw new Error("Position not found");
  }

  return layout;
};

// Get position details — uses the positional $ projection so only the matching
// placement is returned from MongoDB instead of the entire placements array.
export const getPositionDetails = async (
  layoutId: string,
  positionId: string,
) => {
  const layout = await ShirtLayout.findOne(
    { _id: layoutId, "placements.positionId": positionId },
    { "placements.$": 1 },
  );

  if (!layout || !layout.placements?.[0]) {
    throw new Error("Position not found");
  }

  return layout.placements[0];
};

// Recalculate every placement price after a pricing config change.
// Owned here because it mutates the layout document — campaign.service has no business
// touching layout internals directly.
export const recalculateLayoutPrices = async (
  campaignId: string,
  campaignType: string,
  pricing: PricingConfig,
) => {
  const layout = await ShirtLayout.findOne({ campaignId });
  if (!layout) throw new Error("Layout not found");

  const campaignPricing = parsePricingConfig(campaignType, pricing);
  const total = layout.placements.length;

  layout.placements.forEach((placement: any, index: number) => {
    const pos = index + 1;
    if (campaignPricing.type === "fixed") {
      placement.price = campaignPricing.fixedPrice;
    } else if (campaignPricing.type === "positional") {
      placement.price = calculatePositionPrice(pos, campaignPricing, undefined, total);
    }
  });

  await layout.save();
  return layout;
};
