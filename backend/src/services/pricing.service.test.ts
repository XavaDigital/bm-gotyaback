import { describe, it, expect } from 'vitest';
import * as pricingService from './pricing.service';
import type { PositionalPricing, PricingConfig, SizeTier } from '../types/campaign.types';

describe('Pricing Service', () => {
  describe('calculatePositionPrice', () => {
    it('should calculate price with multiplicative pricing', () => {
      const config: PositionalPricing = { type: 'positional', mode: 'multiplicative', priceMultiplier: 5 };

      const price = pricingService.calculatePositionPrice(40, config);
      expect(price).toBe(200); // 40 * 5
    });

    it('should calculate price with additive pricing (ascending)', () => {
      const config: PositionalPricing = { type: 'positional', mode: 'additive', basePrice: 10, pricePerPosition: 2 };

      const price = pricingService.calculatePositionPrice(40, config);
      expect(price).toBe(88); // 10 + (40 - 1) * 2
    });

    it('should calculate price with additive pricing (descending)', () => {
      const config: PositionalPricing = {
        type: 'positional',
        mode: 'additive',
        basePrice: 10,
        pricePerPosition: 2,
        pricingOrder: 'descending',
      };

      const price = pricingService.calculatePositionPrice(1, config, undefined, 100);
      expect(price).toBe(208); // 10 + (100 - 1) * 2
    });

    it('should calculate price with section-based pricing', () => {
      const config: PositionalPricing = {
        type: 'positional',
        mode: 'sections',
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

    it('should throw for sections mode when section arg is missing', () => {
      const config: PositionalPricing = {
        type: 'positional',
        mode: 'sections',
        sections: { top: { amount: 100, slots: 10 } },
      };

      expect(() => pricingService.calculatePositionPrice(1, config)).toThrow(
        'Section parameter required'
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

  describe('parsePricingConfig', () => {
    it('should parse fixed pricing config', () => {
      const config: PricingConfig = { fixedPrice: 25 };
      const result = pricingService.parsePricingConfig('fixed', config);
      expect(result).toEqual({ type: 'fixed', fixedPrice: 25 });
    });

    it('should parse positional multiplicative config', () => {
      const config: PricingConfig = { priceMultiplier: 5 };
      const result = pricingService.parsePricingConfig('positional', config);
      expect(result).toEqual({ type: 'positional', mode: 'multiplicative', priceMultiplier: 5 });
    });

    it('should parse positional additive config', () => {
      const config: PricingConfig = { basePrice: 10, pricePerPosition: 2 };
      const result = pricingService.parsePricingConfig('positional', config);
      expect(result).toEqual({ type: 'positional', mode: 'additive', basePrice: 10, pricePerPosition: 2, pricingOrder: undefined });
    });

    it('should parse pay-what-you-want config', () => {
      const config: PricingConfig = { minimumAmount: 5 };
      const result = pricingService.parsePricingConfig('pay-what-you-want', config);
      expect(result).toEqual({ type: 'pay-what-you-want', minimumAmount: 5, suggestedAmounts: undefined, sizeTiers: undefined });
    });

    it('should throw for invalid fixed pricing', () => {
      expect(() => pricingService.parsePricingConfig('fixed', { fixedPrice: 0 })).toThrow(
        'Fixed pricing requires a valid fixedPrice'
      );
    });

    it('should throw for positional pricing with no mode fields', () => {
      expect(() => pricingService.parsePricingConfig('positional', {})).toThrow(
        'Positional pricing requires'
      );
    });
  });

  describe('validatePricingConfig', () => {
    it('should validate fixed pricing config', () => {
      expect(pricingService.validatePricingConfig('fixed', { fixedPrice: 25 })).toBe(true);
    });

    it('should throw error for invalid fixed pricing', () => {
      expect(() => pricingService.validatePricingConfig('fixed', { fixedPrice: 0 })).toThrow(
        'Fixed pricing requires a valid fixedPrice'
      );
    });
  });
});

