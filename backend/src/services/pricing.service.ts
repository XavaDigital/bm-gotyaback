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
  section?: "top" | "middle" | "bottom",
  totalPositions?: number,
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
        "Invalid pricing config: priceMultiplier must be positive",
      );
    }
    return position * config.priceMultiplier;
  }

  // Additive pricing (e.g., $10 + (position 40 × $2) = $90)
  if (config.basePrice !== undefined && config.pricePerPosition !== undefined) {
    if (config.basePrice < 0 || config.pricePerPosition < 0) {
      throw new Error(
        "Invalid pricing config: basePrice and pricePerPosition must be non-negative",
      );
    }

    // Check for pricing order preference (default is ascending)
    if (config.pricingOrder === "descending") {
      // Descending logic: Base Price is the LAST spot.
      // Price increases as we go backwards from the last spot to the first.
      // E.g. Total 100. Pos 100 = Base. Pos 99 = Base + 1*Diff. Pos 1 = Base + 99*Diff.

      if (!totalPositions) {
        // Fallback if totalPositions is not provided (though it should be)
        // We'll treat Base Price as the starting max price in this edge case, or just error?
        // Let's stick to the previous simple logic as fallback but log/warn?
        // Actually, let's just assume position 1 is base + 0 for now to avoid breaking existing calls without totalPositions
        // WAIT, the user wants Base Price to be the MINIMUM.
        // If we don't know totalPositions, we can't calculate "Total - Position".
        // Let's assume a standard grid size if missing? No, that's risky.
        // Let's rely on the caller providing it.
      }

      if (totalPositions) {
        const inversePosition = totalPositions - position;
        return config.basePrice + inversePosition * config.pricePerPosition;
      }

      // Fallback: If we don't know the total, we can't anchor to the end.
      // But we can interpret "Base Price" as the "Max Price" (Price at Pos 1) if we wanted?
      // No, let's keep consistency. If totalPositions is missing, we simply can't do "Base is Last".
      // But since we control the caller (shirtLayout), we will provide it.
      // For safety, if totalPositions is missing, we default to standard ascending to avoid negative prices or weirdness,
      // OR we just use the previous reversed logic?
      // User said "Base Price as $10... should be at the last spot".
      // Without totalPositions, we can't know which is the last spot.
      // So if no totalPositions, we just return standard additive (ascending) as a safe default?
      // Or maybe throw an error?
      // Let's default to standard additive and maybe log.
      return config.basePrice + position * config.pricePerPosition;
    }

    return config.basePrice + (position - 1) * config.pricePerPosition;
  }

  throw new Error(
    "Invalid pricing config for positional pricing: must provide either sections, priceMultiplier, or (basePrice + pricePerPosition)",
  );
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
 * Validate pricing config based on campaign type
 */
export const validatePricingConfig = (
  campaignType: string,
  config: PricingConfig,
): boolean => {
  if (campaignType === "fixed") {
    if (!config.fixedPrice || config.fixedPrice <= 0) {
      throw new Error("Fixed pricing requires a valid fixedPrice");
    }
  } else if (campaignType === "positional") {
    // Must have either multiplicative OR additive pricing OR sections-based pricing
    const hasMultiplicative =
      config.priceMultiplier && config.priceMultiplier > 0;
    const hasAdditive =
      config.basePrice !== undefined &&
      config.basePrice >= 0 &&
      config.pricePerPosition !== undefined &&
      config.pricePerPosition >= 0;
    const hasSections =
      config.sections &&
      (config.sections.top || config.sections.middle || config.sections.bottom);

    if (!hasMultiplicative && !hasAdditive && !hasSections) {
      throw new Error(
        "Positional pricing requires either priceMultiplier, (basePrice + pricePerPosition), or sections configuration",
      );
    }

    // Validate sections if provided
    if (hasSections && config.sections) {
      const validateSection = (section: any, name: string) => {
        if (section) {
          if (!section.amount || section.amount <= 0) {
            throw new Error(
              `Section '${name}' requires a valid amount greater than 0`,
            );
          }
          if (!section.slots || section.slots <= 0) {
            throw new Error(
              `Section '${name}' requires a valid number of slots greater than 0`,
            );
          }
        }
      };

      validateSection(config.sections.top, "top");
      validateSection(config.sections.middle, "middle");
      validateSection(config.sections.bottom, "bottom");
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
      logoWidth: 100,
    },
  ];
};
