import { PricingConfig, SizeTier, SponsorType } from "../types/campaign.types";

/**
 * Calculate the price for a specific position in a positional pricing campaign
 * Supports three modes:
 * - Sections: Different prices for top, middle, and bottom sections
 * - Additive: basePrice + (position × pricePerPosition)
 * - Multiplicative: position × priceMultiplier
 */
export const calculatePositionPrice = (
  position: number,
  config: PricingConfig,
  section?: "top" | "middle" | "bottom"
): number => {
  // Section-based pricing (for amount-ordered layout)
  if (config.sections && section) {
    const sectionConfig = config.sections[section];
    if (!sectionConfig) {
      throw new Error(`Section configuration not found for ${section}`);
    }
    return sectionConfig.amount;
  }

  // Multiplicative pricing (e.g., position 40 × $5 = $200)
  if (config.priceMultiplier) {
    if (config.priceMultiplier <= 0) {
      throw new Error(
        "Invalid pricing config: priceMultiplier must be positive"
      );
    }
    return position * config.priceMultiplier;
  }

  // Additive pricing (e.g., $10 + (position 40 × $2) = $90)
  if (config.basePrice !== undefined && config.pricePerPosition !== undefined) {
    if (config.basePrice < 0 || config.pricePerPosition < 0) {
      throw new Error(
        "Invalid pricing config: basePrice and pricePerPosition must be non-negative"
      );
    }
    return config.basePrice + position * config.pricePerPosition;
  }

  throw new Error(
    "Invalid pricing config for positional pricing: must provide either sections, priceMultiplier, or (basePrice + pricePerPosition)"
  );
};

/**
 * Determine which size tier a sponsor falls into based on amount paid
 * Returns null if no tiers are defined (for simple pay-what-you-want campaigns)
 */
export const calculateSizeTier = (
  amount: number,
  tiers: SizeTier[] | undefined
): SizeTier | null => {
  if (!tiers || tiers.length === 0) {
    return null; // No tiers defined - use default sizing
  }

  // Sort tiers by minAmount ascending
  const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);

  // Find the appropriate tier
  for (let i = sortedTiers.length - 1; i >= 0; i--) {
    const tier = sortedTiers[i];
    if (amount >= tier.minAmount) {
      // Check if amount is within max (if max is defined)
      if (tier.maxAmount === null || amount <= tier.maxAmount) {
        return tier;
      }
    }
  }

  // If no tier found, return the smallest tier
  return sortedTiers[0];
};

/**
 * Calculate display sizes (font size or logo width) based on amount and tier
 */
export const calculateDisplaySizes = (
  amount: number,
  tier: SizeTier,
  sponsorType: SponsorType
): { fontSize?: number; logoWidth?: number } => {
  if (sponsorType === "text") {
    return {
      fontSize: tier.textFontSize,
    };
  } else if (sponsorType === "logo") {
    return {
      logoWidth: tier.logoWidth,
    };
  }

  return {};
};

/**
 * Validate pricing config based on campaign type
 */
export const validatePricingConfig = (
  campaignType: string,
  config: PricingConfig
): boolean => {
  if (campaignType === "fixed") {
    if (!config.fixedPrice || config.fixedPrice <= 0) {
      throw new Error("Fixed pricing requires a valid fixedPrice");
    }
  } else if (campaignType === "positional") {
    // Must have either multiplicative OR additive pricing
    const hasMultiplicative =
      config.priceMultiplier && config.priceMultiplier > 0;
    const hasAdditive =
      config.basePrice !== undefined &&
      config.basePrice >= 0 &&
      config.pricePerPosition !== undefined &&
      config.pricePerPosition >= 0;

    if (!hasMultiplicative && !hasAdditive) {
      throw new Error(
        "Positional pricing requires either priceMultiplier or (basePrice + pricePerPosition)"
      );
    }
  } else if (campaignType === "pay-what-you-want") {
    if (!config.minimumAmount || config.minimumAmount <= 0) {
      throw new Error("Pay-what-you-want requires a valid minimumAmount");
    }

    // Size tiers are optional - if provided, validate them
    if (config.sizeTiers && config.sizeTiers.length > 0) {
      config.sizeTiers.forEach((tier, index) => {
        if (tier.minAmount < 0) {
          throw new Error(`Size tier ${index} has invalid minAmount`);
        }
        if (tier.textFontSize <= 0 || tier.logoWidth <= 0) {
          throw new Error(`Size tier ${index} has invalid display sizes`);
        }
      });
    }
  }

  return true;
};

/**
 * Get default size tiers for pay-what-you-want campaigns
 */
export const getDefaultSizeTiers = (): SizeTier[] => {
  return [
    {
      size: "small",
      minAmount: 5,
      maxAmount: 24,
      textFontSize: 12,
      logoWidth: 40,
    },
    {
      size: "medium",
      minAmount: 25,
      maxAmount: 49,
      textFontSize: 16,
      logoWidth: 60,
    },
    {
      size: "large",
      minAmount: 50,
      maxAmount: 99,
      textFontSize: 20,
      logoWidth: 80,
    },
    {
      size: "xlarge",
      minAmount: 100,
      maxAmount: null, // No upper limit
      textFontSize: 28,
      logoWidth: 120,
    },
  ];
};
