import { describe, it, expect } from 'vitest';
import * as pricingService from './pricing.service';
import type { PricingConfig, SizeTier } from '../types/campaign.types';

describe('Pricing Service', () => {
  describe('calculatePositionPrice', () => {
    it('should calculate price with multiplicative pricing', () => {
      const config: PricingConfig = {
        priceMultiplier: 5,
      };

      const price = pricingService.calculatePositionPrice(40, config);
      expect(price).toBe(200); // 40 * 5
    });

    it('should calculate price with additive pricing (ascending)', () => {
      const config: PricingConfig = {
        basePrice: 10,
        pricePerPosition: 2,
      };

      const price = pricingService.calculatePositionPrice(40, config);
      expect(price).toBe(88); // 10 + (40 - 1) * 2
    });

    it('should calculate price with additive pricing (descending)', () => {
      const config: PricingConfig = {
        basePrice: 10,
        pricePerPosition: 2,
        pricingOrder: 'descending',
      };

      const price = pricingService.calculatePositionPrice(1, config, undefined, 100);
      expect(price).toBe(208); // 10 + (100 - 1) * 2
    });

    it('should calculate price with section-based pricing', () => {
      const config: PricingConfig = {
        sections: {
          top: { amount: 100, slots: 10 },
          middle: { amount: 50, slots: 20 },
          bottom: { amount: 25, slots: 30 },
        },
      };

      expect(pricingService.calculatePositionPrice(1, config, 'top')).toBe(100);
      expect(pricingService.calculatePositionPrice(1, config, 'middle')).toBe(50);
      expect(pricingService.calculatePositionPrice(1, config, 'bottom')).toBe(25);
    });

    it('should throw error for invalid multiplicative pricing', () => {
      const config: PricingConfig = {
        priceMultiplier: -5,
      };

      expect(() => pricingService.calculatePositionPrice(40, config)).toThrow(
        'priceMultiplier must be positive'
      );
    });

    it('should throw error for invalid additive pricing', () => {
      const config: PricingConfig = {
        basePrice: -10,
        pricePerPosition: 2,
      };

      expect(() => pricingService.calculatePositionPrice(40, config)).toThrow(
        'basePrice and pricePerPosition must be non-negative'
      );
    });

    it('should throw error for missing pricing config', () => {
      const config: PricingConfig = {};

      expect(() => pricingService.calculatePositionPrice(40, config)).toThrow(
        'Invalid pricing config for positional pricing'
      );
    });
  });

  describe('calculateSizeTier', () => {
    const tiers: SizeTier[] = [
      { size: 'small', minAmount: 5, maxAmount: 24, textFontSize: 12, logoWidth: 40 },
      { size: 'medium', minAmount: 25, maxAmount: 49, textFontSize: 16, logoWidth: 60 },
      { size: 'large', minAmount: 50, maxAmount: 99, textFontSize: 20, logoWidth: 80 },
      { size: 'xlarge', minAmount: 100, maxAmount: null, textFontSize: 28, logoWidth: 120 },
    ];

    it('should return correct tier for small amount', () => {
      const tier = pricingService.calculateSizeTier(10, tiers);
      expect(tier?.size).toBe('small');
    });

    it('should return correct tier for medium amount', () => {
      const tier = pricingService.calculateSizeTier(30, tiers);
      expect(tier?.size).toBe('medium');
    });

    it('should return correct tier for large amount', () => {
      const tier = pricingService.calculateSizeTier(75, tiers);
      expect(tier?.size).toBe('large');
    });

    it('should return correct tier for xlarge amount', () => {
      const tier = pricingService.calculateSizeTier(150, tiers);
      expect(tier?.size).toBe('xlarge');
    });

    it('should return null if no tiers defined', () => {
      const tier = pricingService.calculateSizeTier(50, undefined);
      expect(tier).toBeNull();
    });

    it('should return smallest tier for amount below all tiers', () => {
      const tier = pricingService.calculateSizeTier(3, tiers);
      expect(tier?.size).toBe('small');
    });
  });

  describe('calculateDisplaySizes', () => {
    const tier: SizeTier = {
      size: 'medium',
      minAmount: 25,
      maxAmount: 49,
      textFontSize: 16,
      logoWidth: 60,
    };

    it('should return fontSize for text sponsor', () => {
      const sizes = pricingService.calculateDisplaySizes(30, tier, 'text');
      expect(sizes.fontSize).toBe(16);
      expect(sizes.logoWidth).toBeUndefined();
    });

    it('should return logoWidth for logo sponsor', () => {
      const sizes = pricingService.calculateDisplaySizes(30, tier, 'logo');
      expect(sizes.logoWidth).toBe(60);
      expect(sizes.fontSize).toBeUndefined();
    });
  });

  describe('validatePricingConfig', () => {
    it('should validate fixed pricing config', () => {
      const config: PricingConfig = {
        fixedPrice: 25,
      };

      expect(pricingService.validatePricingConfig('fixed', config)).toBe(true);
    });

    it('should throw error for invalid fixed pricing', () => {
      const config: PricingConfig = {
        fixedPrice: 0,
      };

      expect(() => pricingService.validatePricingConfig('fixed', config)).toThrow(
        'Fixed pricing requires a valid fixedPrice'
      );
    });
  });
});

