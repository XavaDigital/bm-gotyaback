// Campaign Pricing Configuration Types

export interface SizeTier {
  size: "small" | "medium" | "large" | "xlarge";
  minAmount: number;
  maxAmount: number | null; // null for highest tier
  textFontSize: number; // px for text sponsors
  logoWidth: number; // px for logo sponsors
}

// Tier configuration for "sections" layout style
export interface PriceTier {
  tierNumber: number; // 1, 2, 3, etc.
  price: number; // Price for this tier
  sponsorDisplayType: "text-only" | "logo-only" | "both"; // What types of sponsors are allowed in this tier
}

export interface PricingConfig {
  // For fixed pricing
  fixedPrice?: number;

  // For positional pricing (additive: basePrice + position * pricePerPosition)
  basePrice?: number;
  pricePerPosition?: number;

  // For positional pricing (multiplicative: position * priceMultiplier)
  priceMultiplier?: number;

  // For pay-what-you-want
  minimumAmount?: number;
  suggestedAmounts?: number[];

  // Size tiers for pay-what-you-want
  sizeTiers?: SizeTier[];

  // Price tiers for "sections" layout style (positional pricing)
  priceTiers?: PriceTier[];
}

export interface PlacementPosition {
  positionId: string; // e.g., "1", "2", "3"
  row: number;
  col: number;
  price: number;
  isTaken: boolean;
  sponsorId?: string;
}

// Campaign Types
export type CampaignType = "fixed" | "positional" | "pay-what-you-want";
export type SponsorDisplayType = "text-only" | "logo-only" | "both";
// Layout styles:
// Positional: "ordered", "sections", "cloud"
// Fixed: "cloud", "list"
// Pay-what-you-want: "word-cloud", "list"
export type LayoutStyle =
  | "ordered"
  | "sections"
  | "cloud"
  | "list"
  | "word-cloud";
export type LayoutOrder = "asc" | "desc";

// Sponsor Types
export type SponsorType = "text" | "logo";
export type LogoApprovalStatus = "pending" | "approved" | "rejected";
export type DisplaySize = "small" | "medium" | "large" | "xlarge";
