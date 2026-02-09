import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as campaignController from './campaign.controller';
import * as campaignService from '../services/campaign.service';
import * as uploadService from '../services/upload.service';
import { mockRequest, mockResponse, createTestUser, createTestCampaign } from '../test/testUtils';

// Mock the services
vi.mock('../services/campaign.service');
vi.mock('../services/upload.service');

describe('Campaign Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create a campaign without header image', async () => {
      const user = await createTestUser();
      const mockCampaign = await createTestCampaign(user._id.toString());

      const req = mockRequest({
        user,
        body: {
          title: 'Test Campaign',
          description: 'Test description',
          campaignType: 'fixed',
          garmentType: 'tshirt',
          pricingConfig: { fixedPrice: 25 },
        },
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'createCampaign').mockResolvedValue(mockCampaign as any);

      await campaignController.createCampaign(req as any, res as any);

      expect(campaignService.createCampaign).toHaveBeenCalledWith(
        user._id.toString(),
        expect.objectContaining({ title: 'Test Campaign' })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCampaign);
    });

    it('should create a campaign with header image', async () => {
      const user = await createTestUser();
      const mockCampaign = await createTestCampaign(user._id.toString());
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
      };

      const req = mockRequest({
        user,
        body: {
          data: JSON.stringify({
            title: 'Test Campaign',
            description: 'Test description',
          }),
        },
        file: mockFile,
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'createCampaign').mockResolvedValue(mockCampaign as any);
      vi.spyOn(uploadService, 'uploadHeaderImageToS3').mockResolvedValue('https://s3.amazonaws.com/test.jpg');
      vi.spyOn(campaignService, 'updateCampaign').mockResolvedValue({ ...mockCampaign, headerImageUrl: 'https://s3.amazonaws.com/test.jpg' } as any);

      await campaignController.createCampaign(req as any, res as any);

      expect(uploadService.uploadHeaderImageToS3).toHaveBeenCalled();
      expect(campaignService.updateCampaign).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        body: {},
      });
      const res = mockResponse();

      await campaignController.createCampaign(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 400 on error', async () => {
      const user = await createTestUser();
      const req = mockRequest({
        user,
        body: {},
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'createCampaign').mockRejectedValue(new Error('Invalid data'));

      await campaignController.createCampaign(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid data' });
    });
  });

  describe('getCampaign', () => {
    it('should get campaign by ID', async () => {
      const user = await createTestUser();
      const mockCampaign = await createTestCampaign(user._id.toString());

      const req = mockRequest({
        params: { id: mockCampaign._id.toString() },
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'getCampaignById').mockResolvedValue(mockCampaign as any);

      await campaignController.getCampaign(req as any, res as any);

      expect(campaignService.getCampaignById).toHaveBeenCalledWith(mockCampaign._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockCampaign);
    });

    it('should return 404 if campaign not found', async () => {
      const req = mockRequest({
        params: { id: 'non-existent-id' },
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'getCampaignById').mockRejectedValue(new Error('Campaign not found'));

      await campaignController.getCampaign(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Campaign not found' });
    });
  });

  describe('getPublicCampaign', () => {
    it('should get campaign by slug', async () => {
      const user = await createTestUser();
      const mockCampaign = await createTestCampaign(user._id.toString(), { slug: 'test-slug' });

      const req = mockRequest({
        params: { slug: 'test-slug' },
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'getCampaignBySlug').mockResolvedValue(mockCampaign as any);

      await campaignController.getPublicCampaign(req as any, res as any);

      expect(campaignService.getCampaignBySlug).toHaveBeenCalledWith('test-slug');
      expect(res.json).toHaveBeenCalledWith(mockCampaign);
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      const user = await createTestUser();
      const mockCampaign = await createTestCampaign(user._id.toString());

      const req = mockRequest({
        user,
        params: { id: mockCampaign._id.toString() },
        body: { title: 'Updated Title' },
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'updateCampaign').mockResolvedValue({ ...mockCampaign, title: 'Updated Title' } as any);

      await campaignController.updateCampaign(req as any, res as any);

      expect(campaignService.updateCampaign).toHaveBeenCalledWith(
        mockCampaign._id.toString(),
        user._id.toString(),
        { title: 'Updated Title' }
      );
      expect(res.json).toHaveBeenCalled();
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        params: { id: 'campaign-id' },
        body: {},
      });
      const res = mockResponse();

      await campaignController.updateCampaign(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });

    it('should return 403 if user not authorized', async () => {
      const user = await createTestUser();
      const req = mockRequest({
        user,
        params: { id: 'campaign-id' },
        body: {},
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'updateCampaign').mockRejectedValue(new Error('Not authorized'));

      await campaignController.updateCampaign(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ message: 'Not authorized' });
    });
  });

  describe('closeCampaign', () => {
    it('should close campaign successfully', async () => {
      const user = await createTestUser();
      const mockCampaign = await createTestCampaign(user._id.toString());

      const req = mockRequest({
        user,
        params: { id: mockCampaign._id.toString() },
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'closeCampaign').mockResolvedValue({ ...mockCampaign, isClosed: true } as any);

      await campaignController.closeCampaign(req as any, res as any);

      expect(campaignService.closeCampaign).toHaveBeenCalledWith(
        mockCampaign._id.toString(),
        user._id.toString()
      );
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('getMyCampaigns', () => {
    it('should get user campaigns', async () => {
      const user = await createTestUser();
      const mockCampaigns = [
        await createTestCampaign(user._id.toString()),
        await createTestCampaign(user._id.toString()),
      ];

      const req = mockRequest({
        user,
      });
      const res = mockResponse();

      vi.spyOn(campaignService, 'getUserCampaigns').mockResolvedValue(mockCampaigns as any);

      await campaignController.getMyCampaigns(req as any, res as any);

      expect(campaignService.getUserCampaigns).toHaveBeenCalledWith(user._id.toString());
      expect(res.json).toHaveBeenCalledWith(mockCampaigns);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
      });
      const res = mockResponse();

      await campaignController.getMyCampaigns(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated' });
    });
  });
});

