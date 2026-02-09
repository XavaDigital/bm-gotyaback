import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as sponsorshipController from './sponsorship.controller';
import * as sponsorshipService from '../services/sponsorship.service';
import * as uploadService from '../services/upload.service';
import { mockRequest, mockResponse, createTestUser, createTestCampaign, createTestSponsor } from '../test/testUtils';

// Mock the services
vi.mock('../services/sponsorship.service');
vi.mock('../services/upload.service');

describe('Sponsorship Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createSponsorship', () => {
    it('should create sponsorship without logo', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const mockSponsor = await createTestSponsor(campaign._id.toString());

      const req = mockRequest({
        params: { id: campaign._id.toString() },
        body: {
          name: 'Test Sponsor',
          email: 'sponsor@example.com',
          amount: 25,
          paymentMethod: 'cash',
          sponsorType: 'text',
        },
      });
      const res = mockResponse();

      vi.spyOn(sponsorshipService, 'createSponsorship').mockResolvedValue(mockSponsor as any);

      await sponsorshipController.createSponsorship(req as any, res as any);

      expect(sponsorshipService.createSponsorship).toHaveBeenCalledWith(
        campaign._id.toString(),
        expect.objectContaining({
          name: 'Test Sponsor',
          email: 'sponsor@example.com',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockSponsor);
    });

    it('should create sponsorship with logo', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const mockSponsor = await createTestSponsor(campaign._id.toString(), { sponsorType: 'logo' });
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
      };

      const req = mockRequest({
        params: { id: campaign._id.toString() },
        body: {
          data: JSON.stringify({
            name: 'Test Sponsor',
            email: 'sponsor@example.com',
            amount: 50,
            paymentMethod: 'cash',
            sponsorType: 'logo',
          }),
        },
        file: mockFile,
      });
      const res = mockResponse();

      vi.spyOn(uploadService, 'uploadLogoToS3').mockResolvedValue('https://s3.amazonaws.com/logo.jpg');
      vi.spyOn(sponsorshipService, 'createSponsorship').mockResolvedValue(mockSponsor as any);

      await sponsorshipController.createSponsorship(req as any, res as any);

      expect(uploadService.uploadLogoToS3).toHaveBeenCalled();
      expect(sponsorshipService.createSponsorship).toHaveBeenCalledWith(
        campaign._id.toString(),
        expect.objectContaining({
          logoUrl: 'https://s3.amazonaws.com/logo.jpg',
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 if missing required fields', async () => {
      const req = mockRequest({
        params: { id: 'campaign-id' },
        body: {
          name: 'Test Sponsor',
          // Missing email, amount, paymentMethod
        },
      });
      const res = mockResponse();

      await sponsorshipController.createSponsorship(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Missing required fields' });
    });

    it('should return 400 on error', async () => {
      const req = mockRequest({
        params: { id: 'campaign-id' },
        body: {
          name: 'Test Sponsor',
          email: 'sponsor@example.com',
          amount: 25,
          paymentMethod: 'cash',
        },
      });
      const res = mockResponse();

      vi.spyOn(sponsorshipService, 'createSponsorship').mockRejectedValue(new Error('Creation failed'));

      await sponsorshipController.createSponsorship(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Creation failed' });
    });
  });

  describe('getSponsors', () => {
    it('should get sponsors for campaign', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const mockSponsors = [
        await createTestSponsor(campaign._id.toString()),
        await createTestSponsor(campaign._id.toString()),
      ];

      const req = mockRequest({
        user,
        params: { id: campaign._id.toString() },
        query: { page: '1', limit: '50' },
      });
      const res = mockResponse();

      const mockResult = {
        data: mockSponsors,
        pagination: {
          page: 1,
          limit: 50,
          total: 2,
          pages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };

      vi.spyOn(sponsorshipService, 'getSponsorsByCampaign').mockResolvedValue(mockResult as any);

      await sponsorshipController.getSponsors(req as any, res as any);

      expect(sponsorshipService.getSponsorsByCampaign).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { id: 'campaign-id' },
      });
      const res = mockResponse();

      await sponsorshipController.getSponsors(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
  });

  describe('getPublicSponsors', () => {
    it('should get public sponsors for campaign', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const mockSponsors = [
        await createTestSponsor(campaign._id.toString()),
      ];

      const req = mockRequest({
        params: { id: campaign._id.toString() },
      });
      const res = mockResponse();

      vi.spyOn(sponsorshipService, 'getPublicSponsors').mockResolvedValue(mockSponsors as any);

      await sponsorshipController.getPublicSponsors(req as any, res as any);

      expect(sponsorshipService.getPublicSponsors).toHaveBeenCalledWith(campaign._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockSponsors);
    });

    it('should return 400 on error', async () => {
      const req = mockRequest({
        params: { id: 'campaign-id' },
      });
      const res = mockResponse();

      vi.spyOn(sponsorshipService, 'getPublicSponsors').mockRejectedValue(new Error('Failed to fetch'));

      await sponsorshipController.getPublicSponsors(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Failed to fetch' });
    });
  });

  describe('markAsPaid', () => {
    it('should mark sponsorship as paid', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const sponsor = await createTestSponsor(campaign._id.toString());

      const req = mockRequest({
        user,
        params: { sponsorshipId: sponsor._id.toString() },
      });
      const res = mockResponse();

      const updatedSponsor = { ...sponsor, paymentStatus: 'paid' };
      vi.spyOn(sponsorshipService, 'markAsPaid').mockResolvedValue(updatedSponsor as any);

      await sponsorshipController.markAsPaid(req as any, res as any);

      expect(sponsorshipService.markAsPaid).toHaveBeenCalledWith(
        sponsor._id.toString(),
        user._id.toString()
      );
      expect(res.json).toHaveBeenCalledWith(updatedSponsor);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { sponsorshipId: 'sponsor-id' },
      });
      const res = mockResponse();

      await sponsorshipController.markAsPaid(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 403 if not authorized', async () => {
      const user = await createTestUser();
      const req = mockRequest({
        user,
        params: { sponsorshipId: 'sponsor-id' },
      });
      const res = mockResponse();

      vi.spyOn(sponsorshipService, 'markAsPaid').mockRejectedValue(new Error('Not authorized'));

      await sponsorshipController.markAsPaid(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const sponsor = await createTestSponsor(campaign._id.toString());

      const req = mockRequest({
        user,
        params: { sponsorshipId: sponsor._id.toString() },
        body: { status: 'paid' },
      });
      const res = mockResponse();

      const updatedSponsor = { ...sponsor, paymentStatus: 'paid' };
      vi.spyOn(sponsorshipService, 'updatePaymentStatus').mockResolvedValue(updatedSponsor as any);

      await sponsorshipController.updatePaymentStatus(req as any, res as any);

      expect(sponsorshipService.updatePaymentStatus).toHaveBeenCalledWith(
        sponsor._id.toString(),
        user._id.toString(),
        'paid'
      );
      expect(res.json).toHaveBeenCalledWith(updatedSponsor);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { sponsorshipId: 'sponsor-id' },
        body: { status: 'paid' },
      });
      const res = mockResponse();

      await sponsorshipController.updatePaymentStatus(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 for invalid status', async () => {
      const user = await createTestUser();
      const req = mockRequest({
        user,
        params: { sponsorshipId: 'sponsor-id' },
        body: { status: 'invalid' },
      });
      const res = mockResponse();

      await sponsorshipController.updatePaymentStatus(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid status. Must be "pending" or "paid"' });
    });
  });

  describe('approveLogo', () => {
    it('should approve logo sponsorship', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const sponsor = await createTestSponsor(campaign._id.toString(), { sponsorType: 'logo' });

      const req = mockRequest({
        user,
        params: { sponsorshipId: sponsor._id.toString() },
        body: { approved: true },
      });
      const res = mockResponse();

      const updatedSponsor = { ...sponsor, logoApprovalStatus: 'approved' };
      vi.spyOn(sponsorshipService, 'approveLogoSponsorship').mockResolvedValue(updatedSponsor as any);

      await sponsorshipController.approveLogo(req as any, res as any);

      expect(sponsorshipService.approveLogoSponsorship).toHaveBeenCalledWith(
        sponsor._id.toString(),
        user._id.toString(),
        true,
        undefined
      );
      expect(res.json).toHaveBeenCalledWith(updatedSponsor);
    });

    it('should reject logo sponsorship with reason', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());
      const sponsor = await createTestSponsor(campaign._id.toString(), { sponsorType: 'logo' });

      const req = mockRequest({
        user,
        params: { sponsorshipId: sponsor._id.toString() },
        body: { approved: false, rejectionReason: 'Inappropriate content' },
      });
      const res = mockResponse();

      const updatedSponsor = { ...sponsor, logoApprovalStatus: 'rejected' };
      vi.spyOn(sponsorshipService, 'approveLogoSponsorship').mockResolvedValue(updatedSponsor as any);

      await sponsorshipController.approveLogo(req as any, res as any);

      expect(sponsorshipService.approveLogoSponsorship).toHaveBeenCalledWith(
        sponsor._id.toString(),
        user._id.toString(),
        false,
        'Inappropriate content'
      );
      expect(res.json).toHaveBeenCalledWith(updatedSponsor);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { sponsorshipId: 'sponsor-id' },
        body: { approved: true },
      });
      const res = mockResponse();

      await sponsorshipController.approveLogo(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 400 if approved field is missing', async () => {
      const user = await createTestUser();
      const req = mockRequest({
        user,
        params: { sponsorshipId: 'sponsor-id' },
        body: {},
      });
      const res = mockResponse();

      await sponsorshipController.approveLogo(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'approved field is required and must be a boolean' });
    });
  });

  describe('getPendingLogos', () => {
    it('should get pending logo approvals', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());

      const req = mockRequest({
        user,
        params: { id: campaign._id.toString() },
        query: { page: '1', limit: '50' },
      });
      const res = mockResponse();

      const mockResult = {
        data: [],
        pagination: { page: 1, limit: 50, total: 0, pages: 0, hasNext: false, hasPrev: false },
      };
      vi.spyOn(sponsorshipService, 'getPendingLogoApprovals').mockResolvedValue(mockResult as any);

      await sponsorshipController.getPendingLogos(req as any, res as any);

      expect(sponsorshipService.getPendingLogoApprovals).toHaveBeenCalledWith(
        campaign._id.toString(),
        user._id.toString(),
        1,
        50
      );
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { id: 'campaign-id' },
      });
      const res = mockResponse();

      await sponsorshipController.getPendingLogos(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo file', async () => {
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
      };

      const req = mockRequest({
        params: { id: 'campaign-id' },
        file: mockFile,
      });
      const res = mockResponse();

      const mockLogoUrl = 'https://s3.amazonaws.com/temp-logo.jpg';
      vi.spyOn(uploadService, 'uploadLogoToS3').mockResolvedValue(mockLogoUrl);

      await sponsorshipController.uploadLogo(req as any, res as any);

      expect(uploadService.uploadLogoToS3).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ logoUrl: mockLogoUrl });
    });

    it('should return 400 if no file provided', async () => {
      const req = mockRequest({
        params: { id: 'campaign-id' },
        file: undefined,
      });
      const res = mockResponse();

      await sponsorshipController.uploadLogo(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'No logo file provided' });
    });
  });

  describe('approveAllLogos', () => {
    it('should approve all pending logos', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());

      const req = mockRequest({
        user,
        params: { id: campaign._id.toString() },
      });
      const res = mockResponse();

      const mockResult = { approvedCount: 5 };
      vi.spyOn(sponsorshipService, 'approveAllLogoSponsorships').mockResolvedValue(mockResult as any);

      await sponsorshipController.approveAllLogos(req as any, res as any);

      expect(sponsorshipService.approveAllLogoSponsorships).toHaveBeenCalledWith(
        campaign._id.toString(),
        user._id.toString()
      );
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { id: 'campaign-id' },
      });
      const res = mockResponse();

      await sponsorshipController.approveAllLogos(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});

