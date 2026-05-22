import { CampaignPricing, PositionalPricing, PricingConfig, SizeTier, SponsorType } from "../types/campaign.types";

/**
 * Convert a flat PricingConfig + campaignType into the appropriate CampaignPricing
 * discriminated union variant. Validates the config and throws on invalid input.
 */
export const parsePricingConfig = (
  campaignType: string,
  config: PricingConfig,
): CampaignPricing => {
  if (campaignType === "fixed") {
    if (!config.fixedPrice || config.fixedPrice <= 0) {
      throw new Error("Fixed pricing requires a valid fixedPrice");
    }
    return { type: "fixed", fixedPrice: config.fixedPrice };
  }

  if (campaignType === "positional") {
    const hasSections =
      config.sections &&
      (config.sections.top || config.sections.middle || config.sections.bottom);

    if (hasSections && config.sections) {
      const validateSection = (section: { amount?: number; slots?: number } | undefined, name: string) => {
        if (section) {
          if (!section.amount || section.amount <= 0) {
            throw new Error(`Section '${name}' requires a valid amount greater than 0`);
          }
          if (!section.slots || section.slots <= 0) {
            throw new Error(`Section '${name}' requires a valid number of slots greater than 0`);
          }
        }
      };
      validateSection(config.sections.top, "top");
      validateSection(config.sections.middle, "middle");
      validateSection(config.sections.bottom, "bottom");
      return { type: "positional", mode: "sections", sections: config.sections };
    }

    if (config.priceMultiplier !== undefined) {
      if (config.priceMultiplier <= 0) {
        throw new Error("Invalid pricing config: priceMultiplier must be positive");
      }
      return { type: "positional", mode: "multiplicative", priceMultiplier: config.priceMultiplier };
    }

    if (config.basePrice !== undefined && config.pricePerPosition !== undefined) {
      if (config.basePrice < 0 || config.pricePerPosition < 0) {
        throw new Error("Invalid pricing config: basePrice and pricePerPosition must be non-negative");
      }
      return {
        type: "positional",
        mode: "additive",
        basePrice: config.basePrice,
        pricePerPosition: config.pricePerPosition,
        pricingOrder: config.pricingOrder,
      };
    }

    throw new Error(
      "Positional pricing requires either priceMultiplier, (basePrice + pricePerPosition), or sections configuration",
    );
  }

  if (campaignType === "pay-what-you-want") {
    if (!config.minimumAmount || config.minimumAmount <= 0) {
      throw new Error("Pay-what-you-want requires a valid minimumAmount");
    }
    if (config.sizeTiers && config.sizeTiers.length > 0) {
      config.sizeTiers.forEach((tier, index) => {
        if (tier.minAmount < 0) throw new Error(`Size tier ${index} has invalid minAmount`);
        if (tier.textFontSize <= 0 || tier.logoWidth <= 0) throw new Error(`Size tier ${index} has invalid display sizes`);
      });
    }
    return {
      type: "pay-what-you-want",
      minimumAmount: config.minimumAmount,
      suggestedAmounts: config.suggestedAmounts,
      sizeTiers: config.sizeTiers,
    };
  }

  throw new Error(`Unknown campaign type: ${campaignType}`);
};

/**
 * Calculate the price for a specific position in a positional pricing campaign.
 * Accepts a typed PositionalPricing variant — use parsePricingConfig() to obtain one.
 * For sections mode, pass the section name as the third argument.
 */
export const calculatePositionPrice = (
  position: number,
  config: PositionalPricing,
  section?: "top" | "middle" | "bottom",
  totalPositions?: number,
): number => {
  if (config.mode === "sections") {
    if (!section) {
      throw new Error("Section parameter required for sections-mode positional pricing");
    }
    const sectionConfig = config.sections[section];
    if (!sectionConfig) {
      throw new Error(`Section configuration not found for ${section}`);
    }
    return sectionConfig.amount;
  }

  if (config.mode === "multiplicative") {
    return position * config.priceMultiplier;
  }

  // additive
  if (config.pricingOrder === "descending" && totalPositions) {
    return config.basePrice + (totalPositions - position) * config.pricePerPosition;
  }
  return config.basePrice + (position - 1) * config.pricePerPosition;
};

/**
 * Determine which size tier a sponsor falls into based on amount paid
 * Returns null if no tiers are defined (for simple pay-what-you-want campaigns)
 */
export const calculateSizeTier = (
  amount: number,
  tiers: SizeTier[] | undefined,
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
  sponsorType: SponsorType,
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
 * Validate a pricing config for the given campaign type.
 * Delegates to parsePricingConfig — throws the same errors on invalid input.
 */
export const validatePricingConfig = (
  campaignType: string,
  config: PricingConfig,
): boolean => {
  parsePricingConfig(campaignType, config);
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
      logoWidth: 100,
    },
  ];
};
