import { describe, it, expect, vi, beforeEach } from 'vitest';
import sponsorshipService from './sponsorship.service';
import apiClient from './apiClient';
import { createMockSponsor } from '~/test/testUtils';

vi.mock('./apiClient');

describe('Sponsorship Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSponsorship', () => {
    it('should create sponsorship with JSON data when no logo file', async () => {
      const mockSponsor = createMockSponsor();
      const sponsorData = {
        name: 'Test Sponsor',
        email: 'sponsor@example.com',
        phone: '1234567890',
        amount: 100,
        paymentMethod: 'stripe' as const,
        sponsorType: 'text' as const,
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockSponsor });

      const result = await sponsorshipService.createSponsorship('campaign-123', sponsorData);

      expect(apiClient.post).toHaveBeenCalledWith('/campaigns/campaign-123/sponsor', sponsorData);
      expect(result).toEqual(mockSponsor);
    });

    it('should create sponsorship with FormData when logo file is provided', async () => {
      const mockSponsor = createMockSponsor();
      const file = new File(['logo'], 'logo.png', { type: 'image/png' });
      const sponsorData = {
        name: 'Test Sponsor',
        email: 'sponsor@example.com',
        amount: 100,
        paymentMethod: 'stripe' as const,
        sponsorType: 'logo' as const,
        logoFile: file,
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockSponsor });

      const result = await sponsorshipService.createSponsorship('campaign-123', sponsorData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/campaigns/campaign-123/sponsor',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockSponsor);
    });
  });

  describe('getSponsors', () => {
    it('should fetch all sponsors for a campaign', async () => {
      const mockSponsors = [createMockSponsor()];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSponsors });

      const result = await sponsorshipService.getSponsors('campaign-123');

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/campaign-123/sponsors');
      expect(result).toEqual(mockSponsors);
    });
  });

  describe('getPublicSponsors', () => {
    it('should fetch public sponsors for a campaign', async () => {
      const mockSponsors = [createMockSponsor({ paymentStatus: 'paid' })];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSponsors });

      const result = await sponsorshipService.getPublicSponsors('campaign-123');

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/campaign-123/public-sponsors');
      expect(result).toEqual(mockSponsors);
    });
  });

  describe('markAsPaid', () => {
    it('should mark sponsorship as paid', async () => {
      const mockSponsor = createMockSponsor({ paymentStatus: 'paid' });
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockSponsor });

      const result = await sponsorshipService.markAsPaid('sponsor-123');

      expect(apiClient.post).toHaveBeenCalledWith('/sponsorships/sponsor-123/mark-paid');
      expect(result).toEqual(mockSponsor);
    });
  });

  describe('getPendingLogos', () => {
    it('should fetch pending logo approvals', async () => {
      const mockSponsors = [
        createMockSponsor({ logoApprovalStatus: 'pending', sponsorType: 'logo' }),
      ];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockSponsors });

      const result = await sponsorshipService.getPendingLogos('campaign-123');

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/campaign-123/pending-logos');
      expect(result).toEqual(mockSponsors);
    });
  });

  describe('approveLogo', () => {
    it('should approve a logo', async () => {
      const mockSponsor = createMockSponsor({ logoApprovalStatus: 'approved' });
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockSponsor });

      const result = await sponsorshipService.approveLogo('sponsor-123', { approved: true });

      expect(apiClient.post).toHaveBeenCalledWith('/sponsorships/sponsor-123/approve-logo', {
        approved: true,
      });
      expect(result).toEqual(mockSponsor);
    });

    it('should reject a logo with reason', async () => {
      const mockSponsor = createMockSponsor({ logoApprovalStatus: 'rejected' });
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockSponsor });

      const result = await sponsorshipService.approveLogo('sponsor-123', {
        approved: false,
        rejectionReason: 'Low quality',
      });

      expect(apiClient.post).toHaveBeenCalledWith('/sponsorships/sponsor-123/approve-logo', {
        approved: false,
        rejectionReason: 'Low quality',
      });
      expect(result).toEqual(mockSponsor);
    });
  });

  describe('approveAllLogos', () => {
    it('should approve all pending logos for a campaign', async () => {
      vi.mocked(apiClient.post).mockResolvedValue({ data: { message: 'All logos approved' } });

      const result = await sponsorshipService.approveAllLogos('campaign-123');

      expect(apiClient.post).toHaveBeenCalledWith('/campaigns/campaign-123/approve-all-logos');
      expect(result).toEqual({ message: 'All logos approved' });
    });
  });
});

