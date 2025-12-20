// Campaign Pricing Configuration Types

export interface SizeTier {
  size: "small" | "medium" | "large" | "xlarge";
  minAmount: number;
  maxAmount: number | null; // null for highest tier
  textFontSize: number; // px for text sponsors
  logoWidth: number; // px for logo sponsors
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
}

export interface PlacementPosition {
  positionId: string; // e.g., "A1", "B5"
  row: number;
  col: number;
  price: number;
  isTaken: boolean;
  sponsorId?: string;
}

// Campaign Types
export type CampaignType = "fixed" | "positional" | "pay-what-you-want";
export type SponsorDisplayType = "text-only" | "logo-only" | "both";
export type LayoutStyle =
  | "grid"
  | "size-ordered"
  | "amount-ordered"
  | "word-cloud";

// Sponsor Types
export type SponsorType = "text" | "logo";
export type LogoApprovalStatus = "pending" | "approved" | "rejected";
export type DisplaySize = "small" | "medium" | "large" | "xlarge";
