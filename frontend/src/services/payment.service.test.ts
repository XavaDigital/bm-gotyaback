import { describe, it, expect, vi, beforeEach } from 'vitest';
import paymentService from './payment.service';
import apiClient from './apiClient';

vi.mock('./apiClient');

describe('Payment Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createPaymentIntent', () => {
    it('should create payment intent with sponsor data', async () => {
      const mockResponse = {
        clientSecret: 'pi_test_secret',
        sponsorshipId: 'sponsor-123',
      };

      const paymentData = {
        campaignId: 'campaign-123',
        positionId: 'A1',
        amount: 100,
        sponsorData: {
          name: 'Test Sponsor',
          email: 'sponsor@example.com',
          phone: '1234567890',
          message: 'Thank you!',
          sponsorType: 'text',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await paymentService.createPaymentIntent(paymentData);

      expect(apiClient.post).toHaveBeenCalledWith('/payment/create-payment-intent', paymentData);
      expect(result).toEqual(mockResponse);
    });

    it('should create payment intent without optional fields', async () => {
      const mockResponse = {
        clientSecret: 'pi_test_secret',
        sponsorshipId: 'sponsor-123',
      };

      const paymentData = {
        campaignId: 'campaign-123',
        amount: 50,
        sponsorData: {
          name: 'Test Sponsor',
          email: 'sponsor@example.com',
        },
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockResponse });

      const result = await paymentService.createPaymentIntent(paymentData);

      expect(apiClient.post).toHaveBeenCalledWith('/payment/create-payment-intent', paymentData);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getConfig', () => {
    it('should fetch Stripe config', async () => {
      const mockConfig = {
        publishableKey: 'pk_test_123',
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockConfig });

      const result = await paymentService.getConfig();

      expect(apiClient.get).toHaveBeenCalledWith('/payment/config');
      expect(result).toEqual(mockConfig);
    });
  });

  describe('getCampaignConfig', () => {
    it('should fetch campaign-specific payment config', async () => {
      const mockConfig = {
        stripeAccountId: 'acct_123',
        applicationFeePercent: 5,
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockConfig });

      const result = await paymentService.getCampaignConfig('campaign-123');

      expect(apiClient.get).toHaveBeenCalledWith('/payment/campaigns/campaign-123/config');
      expect(result).toEqual(mockConfig);
    });
  });
});

