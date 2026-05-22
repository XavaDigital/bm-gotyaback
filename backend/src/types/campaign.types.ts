// Campaign Pricing Configuration Types

export interface SizeTier {
  size: "small" | "medium" | "large" | "xlarge";
  minAmount: number;
  maxAmount: number | null; // null for highest tier
  textFontSize: number; // px for text sponsors
  logoWidth: number; // px for logo sponsors
}

export interface SectionConfig {
  amount: number; // Price for this section
  slots: number; // Number of slots in this section
}

export type SectionMap = {
  top?: SectionConfig;
  middle?: SectionConfig;
  bottom?: SectionConfig;
};

// Discriminated union for type-safe pricing — each variant carries only the
// fields it needs. Use parsePricingConfig() to construct from a flat PricingConfig.
export type PositionalPricing =
  | { type: "positional"; mode: "additive"; basePrice: number; pricePerPosition: number; pricingOrder?: "ascending" | "descending" }
  | { type: "positional"; mode: "multiplicative"; priceMultiplier: number }
  | { type: "positional"; mode: "sections"; sections: SectionMap };

export type CampaignPricing =
  | { type: "fixed"; fixedPrice: number }
  | PositionalPricing
  | { type: "pay-what-you-want"; minimumAmount: number; suggestedAmounts?: number[]; sizeTiers?: SizeTier[] };

// Flat representation stored in MongoDB — all fields optional because which ones
// are relevant depends on campaignType. Use parsePricingConfig() for typed access.
export interface PricingConfig {
  fixedPrice?: number;
  basePrice?: number;
  pricePerPosition?: number;
  priceMultiplier?: number;
  pricingOrder?: "ascending" | "descending";
  sections?: SectionMap;
  minimumAmount?: number;
  suggestedAmounts?: number[];
  sizeTiers?: SizeTier[];
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
export type LayoutStyle =
  | "grid"
  | "size-ordered"
  | "amount-ordered"
  | "word-cloud";

// Sponsor Types
export type SponsorType = "text" | "logo";
export type LogoApprovalStatus = "pending" | "approved" | "rejected";
export type DisplaySize = "small" | "medium" | "large" | "xlarge";
