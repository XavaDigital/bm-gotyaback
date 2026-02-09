import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadStripe } from '@stripe/stripe-js';

// Mock @stripe/stripe-js
vi.mock('@stripe/stripe-js', () => ({
  loadStripe: vi.fn(),
}));

// Mock global fetch
global.fetch = vi.fn();

describe('Stripe Utils', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    // Reset modules to clear the module-level cache variables
    vi.resetModules();
  });

  describe('getStripe', () => {
    it('should load Stripe with global config', async () => {
      const mockStripe = { id: 'stripe-instance' };
      vi.mocked(loadStripe).mockResolvedValue(mockStripe as any);

      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          publishableKey: 'pk_test_123',
          stripeEnabled: true,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      const result = await getStripe();

      expect(global.fetch).toHaveBeenCalledWith('http://localhost:5000/api/payment/config');
      expect(loadStripe).toHaveBeenCalledWith('pk_test_123');
      expect(result).toEqual(mockStripe);
    });

    it('should return null when Stripe is not enabled globally', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          publishableKey: 'pk_test_123',
          stripeEnabled: false,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      const result = await getStripe();

      expect(result).toBeNull();
      expect(loadStripe).not.toHaveBeenCalled();
    });

    it('should return null when publishable key is missing', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          stripeEnabled: true,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      const result = await getStripe();

      expect(result).toBeNull();
      expect(loadStripe).not.toHaveBeenCalled();
    });

    it('should load Stripe with campaign-specific config', async () => {
      const mockStripe = { id: 'stripe-campaign-instance' };
      vi.mocked(loadStripe).mockResolvedValue(mockStripe as any);

      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          publishableKey: 'pk_test_campaign_123',
          enableStripePayments: true,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      const result = await getStripe('campaign-123');

      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:5000/api/payment/campaigns/campaign-123/config'
      );
      expect(loadStripe).toHaveBeenCalledWith('pk_test_campaign_123');
      expect(result).toEqual(mockStripe);
    });

    it('should return null when campaign Stripe is not enabled', async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          publishableKey: 'pk_test_campaign_123',
          enableStripePayments: false,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      const result = await getStripe('campaign-123');

      expect(result).toBeNull();
      expect(loadStripe).not.toHaveBeenCalled();
    });

    it('should cache Stripe instance for global config', async () => {
      const mockStripe = { id: 'stripe-instance' };
      vi.mocked(loadStripe).mockResolvedValue(mockStripe as any);

      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          publishableKey: 'pk_test_123',
          stripeEnabled: true,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      // First call
      await getStripe();
      // Second call
      await getStripe();

      // Should only fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(loadStripe).toHaveBeenCalledTimes(1);
    });

    it('should cache Stripe instance per campaign', async () => {
      const mockStripe = { id: 'stripe-campaign-instance' };
      vi.mocked(loadStripe).mockResolvedValue(mockStripe as any);

      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          publishableKey: 'pk_test_campaign_123',
          enableStripePayments: true,
        }),
      });

      const { default: getStripe } = await import('./stripe');
      // First call for campaign-123
      await getStripe('campaign-123');
      // Second call for campaign-123
      await getStripe('campaign-123');

      // Should only fetch once due to caching
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(loadStripe).toHaveBeenCalledTimes(1);
    });

    it('should handle fetch errors gracefully', async () => {
      (global.fetch as any).mockRejectedValue(new Error('Network error'));

      const { default: getStripe } = await import('./stripe');
      const result = await getStripe();

      expect(result).toBeNull();
    });
  });
});

