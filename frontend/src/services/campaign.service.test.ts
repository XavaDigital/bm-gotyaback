import { describe, it, expect, vi, beforeEach } from 'vitest';
import campaignService from './campaign.service';
import apiClient from './apiClient';
import { createMockCampaign } from '~/test/testUtils';

vi.mock('./apiClient');

describe('Campaign Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createCampaign', () => {
    it('should create campaign with JSON data when no file', async () => {
      const mockCampaign = createMockCampaign();
      const campaignData = {
        title: 'Test Campaign',
        campaignType: 'fixed' as const,
        garmentType: 'tshirt' as const,
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.createCampaign(campaignData);

      expect(apiClient.post).toHaveBeenCalledWith('/campaigns', campaignData);
      expect(result).toEqual(mockCampaign);
    });

    it('should create campaign with FormData when file is provided', async () => {
      const mockCampaign = createMockCampaign();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const campaignData = {
        title: 'Test Campaign',
        campaignType: 'fixed' as const,
        garmentType: 'tshirt' as const,
        headerImageFile: file,
      };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.createCampaign(campaignData);

      expect(apiClient.post).toHaveBeenCalledWith(
        '/campaigns',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('getMyCampaigns', () => {
    it('should fetch user campaigns', async () => {
      const mockCampaigns = [createMockCampaign()];
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCampaigns });

      const result = await campaignService.getMyCampaigns();

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/my-campaigns');
      expect(result).toEqual(mockCampaigns);
    });
  });

  describe('getCampaignById', () => {
    it('should fetch campaign by ID', async () => {
      const mockCampaign = createMockCampaign({ _id: 'campaign-123' });
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.getCampaignById('campaign-123');

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/campaign-123');
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('getPublicCampaign', () => {
    it('should fetch public campaign by slug', async () => {
      const mockCampaign = createMockCampaign({ slug: 'test-campaign' });
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.getPublicCampaign('test-campaign');

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/public/test-campaign');
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign with JSON data when no file', async () => {
      const mockCampaign = createMockCampaign();
      const updateData = { title: 'Updated Title' };

      vi.mocked(apiClient.put).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.updateCampaign('campaign-123', updateData);

      expect(apiClient.put).toHaveBeenCalledWith('/campaigns/campaign-123', updateData);
      expect(result).toEqual(mockCampaign);
    });

    it('should update campaign with FormData when file is provided', async () => {
      const mockCampaign = createMockCampaign();
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const updateData = { title: 'Updated Title', headerImageFile: file };

      vi.mocked(apiClient.put).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.updateCampaign('campaign-123', updateData);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/campaigns/campaign-123',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('closeCampaign', () => {
    it('should close campaign', async () => {
      const mockCampaign = createMockCampaign({ isClosed: true });
      vi.mocked(apiClient.post).mockResolvedValue({ data: mockCampaign });

      const result = await campaignService.closeCampaign('campaign-123');

      expect(apiClient.post).toHaveBeenCalledWith('/campaigns/campaign-123/close');
      expect(result).toEqual(mockCampaign);
    });
  });

  describe('createLayout', () => {
    it('should create layout for campaign', async () => {
      const mockLayout = { _id: 'layout-1', campaignId: 'campaign-123', placements: [] };
      const layoutData = { totalPositions: 10, columns: 5 };

      vi.mocked(apiClient.post).mockResolvedValue({ data: mockLayout });

      const result = await campaignService.createLayout('campaign-123', layoutData as any);

      expect(apiClient.post).toHaveBeenCalledWith('/campaigns/campaign-123/layout', layoutData);
      expect(result).toEqual(mockLayout);
    });
  });

  describe('getLayout', () => {
    it('should fetch layout for campaign', async () => {
      const mockLayout = { _id: 'layout-1', campaignId: 'campaign-123', placements: [] };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockLayout });

      const result = await campaignService.getLayout('campaign-123');

      expect(apiClient.get).toHaveBeenCalledWith('/campaigns/campaign-123/layout');
      expect(result).toEqual(mockLayout);
    });
  });

  describe('getAllCampaigns', () => {
    it('should fetch all campaigns with pagination', async () => {
      const mockResponse = {
        data: [createMockCampaign()],
        pagination: { page: 1, limit: 20, total: 1, pages: 1, hasNext: false, hasPrev: false },
      };
      vi.mocked(apiClient.get).mockResolvedValue({ data: mockResponse });

      const result = await campaignService.getAllCampaigns(1, 20);

      expect(apiClient.get).toHaveBeenCalledWith('/admin/campaigns?page=1&limit=20');
      expect(result).toEqual(mockResponse);
    });
  });

  describe('deleteCampaign', () => {
    it('should delete campaign', async () => {
      vi.mocked(apiClient.delete).mockResolvedValue({ data: null });

      await campaignService.deleteCampaign('campaign-123');

      expect(apiClient.delete).toHaveBeenCalledWith('/admin/campaigns/campaign-123');
    });
  });
});

