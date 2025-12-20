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

export interface Campaign {
  _id: string;
  ownerId: string | User;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  garmentType: "singlet" | "tshirt" | "hoodie";
  campaignType: "fixed" | "placement" | "donation";
  currency: "NZD" | "AUD" | "USD";
  startDate?: Date | string;
  endDate?: Date | string;
  isClosed: boolean;
  enableStripePayments: boolean;
  allowOfflinePayments: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  stats?: CampaignStats;
}

export interface Position {
  positionId: string;
  price: number;
  isTaken: boolean;
}

export interface ShirtLayout {
  _id: string;
  campaignId: string;
  rows: number;
  columns: number;
  placements: Position[];
}

export interface SponsorEntry {
  _id: string;
  campaignId: string;
  positionId?: string;
  name: string;
  email: string;
  message?: string;
  amount: number;
  paymentMethod: "card" | "cash";
  paymentStatus: "pending" | "paid" | "failed";
  createdAt: Date | string;
}

// Request types for API calls
export interface CreateCampaignRequest {
  title: string;
  shortDescription?: string;
  description?: string;
  garmentType: "singlet" | "tshirt" | "hoodie";
  campaignType: "fixed" | "placement" | "donation";
  currency?: "NZD" | "AUD" | "USD";
  startDate?: Date | string;
  endDate?: Date | string;
  enableStripePayments?: boolean;
  allowOfflinePayments?: boolean;
}

export interface CreateLayoutRequest {
  rows: number;
  columns: number;
  pricing: {
    fixedPrice?: number;
    zonePricing?: {
      top?: number;
      middle?: number;
      bottom?: number;
    };
  };
}

export interface CreateSponsorshipRequest {
  positionId?: string;
  name: string;
  email: string;
  message?: string;
  amount: number;
  paymentMethod: "card" | "cash";
}

export interface UpdateCampaignRequest {
  title?: string;
  shortDescription?: string;
  description?: string;
  endDate?: Date | string;
  startDate?: Date | string;
  enableStripePayments?: boolean;
  allowOfflinePayments?: boolean;
  garmentType?: "singlet" | "tshirt" | "hoodie";
}

export interface UpdatePricingRequest {
  fixedPrice?: number;
  zonePricing?: {
    top?: number;
    middle?: number;
    bottom?: number;
  };
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
