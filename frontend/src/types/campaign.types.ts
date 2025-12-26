export interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
  organizerProfile?: OrganizerProfile;
}

export interface OrganizerProfile {
  displayName?: string;
  slug?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface CampaignStats {
  sponsorCount: number;
  totalPositions: number;
  claimedPositions: number;
  remainingPositions: number;
}

// Pricing Strategy Types
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
export type SponsorType = "text" | "logo";
export type LogoApprovalStatus = "pending" | "approved" | "rejected";
export type DisplaySize = "small" | "medium" | "large" | "xlarge";

export interface SizeTier {
  size: DisplaySize;
  minAmount: number;
  maxAmount: number | null;
  textFontSize: number;
  logoWidth: number;
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
  sizeTiers?: SizeTier[];
  // Price tiers for "sections" layout style (positional pricing)
  priceTiers?: PriceTier[];
}

export interface Campaign {
  _id: string;
  ownerId: string | User;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  headerImageUrl?: string;
  garmentType: "singlet" | "tshirt" | "hoodie";
  campaignType: CampaignType;
  sponsorDisplayType: SponsorDisplayType;
  layoutStyle: LayoutStyle;
  layoutOrder?: LayoutOrder;
  pricingConfig: PricingConfig;
  currency: "NZD" | "AUD" | "USD";
  startDate?: Date | string;
  endDate?: Date | string;
  status: "draft" | "active" | "closed";
  isClosed: boolean;
  enableStripePayments: boolean;
  allowOfflinePayments: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  stats?: CampaignStats;
}

export interface Position {
  positionId: string;
  row?: number;
  col?: number;
  price: number;
  isTaken: boolean;
  sponsorId?: string;
  tier?: number; // For sections layout - which tier this position belongs to
}

export interface ShirtLayout {
  _id: string;
  campaignId: string;
  layoutType: "grid" | "flexible";
  rows?: number; // Calculated from totalPositions / columns
  columns?: number;
  totalPositions?: number; // Total number of sponsor positions
  arrangement?: "horizontal" | "vertical"; // How positions are numbered
  placements: Position[];
  maxSponsors?: number;
}

export interface SponsorEntry {
  _id: string;
  campaignId: string;
  positionId?: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  amount: number;
  paymentMethod: "card" | "cash";
  paymentStatus: "pending" | "paid" | "failed";
  sponsorType: SponsorType;
  logoUrl?: string;
  logoApprovalStatus: LogoApprovalStatus;
  logoRejectionReason?: string;
  displaySize: DisplaySize;
  calculatedFontSize?: number;
  calculatedLogoWidth?: number;
  createdAt: Date | string;
}

// Request types for API calls
export interface CreateCampaignRequest {
  title: string;
  shortDescription?: string;
  description?: string;
  headerImageFile?: File;
  garmentType: "singlet" | "tshirt" | "hoodie";
  campaignType: CampaignType;
  sponsorDisplayType: SponsorDisplayType;
  layoutStyle: LayoutStyle;
  layoutOrder?: LayoutOrder;
  pricingConfig: PricingConfig;
  currency?: "NZD" | "AUD" | "USD";
  startDate?: Date | string;
  endDate?: Date | string;
  enableStripePayments?: boolean;
  allowOfflinePayments?: boolean;
}

export interface CreateLayoutRequest {
  totalPositions?: number; // Total number of sponsor positions (for grid layouts)
  columns?: number; // Number of columns (for grid layouts)
  arrangement?: "horizontal" | "vertical"; // Position numbering arrangement (for grid layouts)
  maxSponsors?: number; // Max sponsors (for flexible layouts)
  campaignType: CampaignType;
  pricingConfig: PricingConfig;
}

export interface CreateSponsorshipRequest {
  positionId?: string;
  name: string;
  email: string;
  phone: string;
  message?: string;
  amount: number;
  paymentMethod: "card" | "cash";
  sponsorType?: SponsorType;
  logoFile?: File;
}

export interface UpdateCampaignRequest {
  title?: string;
  shortDescription?: string;
  description?: string;
  headerImageFile?: File;
  endDate?: Date | string;
  startDate?: Date | string;
  enableStripePayments?: boolean;
  allowOfflinePayments?: boolean;
  garmentType?: "singlet" | "tshirt" | "hoodie";
  status?: "draft" | "active" | "closed";
}

export interface UpdatePricingRequest {
  pricingConfig: PricingConfig;
}

export interface ApproveLogoRequest {
  approved: boolean;
  rejectionReason?: string;
}

export interface UpdateProfileRequest {
  displayName?: string;
  slug?: string;
  logoUrl?: string;
  coverImageUrl?: string;
  bio?: string;
  websiteUrl?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };
}

export interface OrganizerPublicProfile {
  profile: OrganizerProfile;
  campaigns: Campaign[];
}

export interface PaymentConfig {
  stripeEnabled: boolean;
  publishableKey: string | null;
}

export interface CampaignPaymentConfig {
  enableStripePayments: boolean;
  allowOfflinePayments: boolean;
  publishableKey: string | null;
}
