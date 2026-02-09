import { describe, it, expect, beforeEach } from 'vitest';
import * as campaignService from './campaign.service';
import { Campaign } from '../models/Campaign';
import { createTestUser, createTestCampaign, cleanupTestData } from '../test/testUtils';

describe('Campaign Service', () => {
  beforeEach(async () => {
    await cleanupTestData();
  });

  describe('createCampaign', () => {
    it('should create a campaign with valid data', async () => {
      const user = await createTestUser();

      const campaignData = {
        title: 'Test Campaign',
        slug: 'test-campaign',
        description: 'Test description',
        campaignType: 'fixed' as const,
        garmentType: 'tshirt',
        pricingConfig: {
          fixedPrice: 25,
        },
        enableStripePayments: false,
        allowOfflinePayments: true,
      };

      const campaign = await campaignService.createCampaign(user._id.toString(), campaignData);

      expect(campaign).toBeDefined();
      expect(campaign.title).toBe('Test Campaign');
      expect(campaign.slug).toBe('test-campaign');
      expect(campaign.ownerId.toString()).toBe(user._id.toString());
    });

    it('should auto-generate unique slug from title', async () => {
      const user = await createTestUser();

      const campaignData = {
        title: 'My Test Campaign',
        description: 'Test description',
        campaignType: 'fixed' as const,
        garmentType: 'tshirt',
        pricingConfig: {
          fixedPrice: 25,
        },
        enableStripePayments: false,
        allowOfflinePayments: true,
      };

      const campaign = await campaignService.createCampaign(user._id.toString(), campaignData);

      expect(campaign.slug).toBeDefined();
      expect(campaign.slug).toContain('my-test-campaign');
    });
  });

  describe('getCampaignById', () => {
    it('should retrieve campaign by ID', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());

      const retrieved = await campaignService.getCampaignById(campaign._id.toString());

      expect(retrieved).toBeDefined();
      expect(retrieved._id.toString()).toBe(campaign._id.toString());
      expect(retrieved.title).toBe(campaign.title);
    });

    it('should throw error for non-existent campaign', async () => {
      await expect(
        campaignService.getCampaignById('507f1f77bcf86cd799439011')
      ).rejects.toThrow('Campaign not found');
    });
  });

  describe('getCampaignBySlug', () => {
    it('should retrieve campaign by slug', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString(), {
        slug: 'unique-test-slug',
      });

      const retrieved = await campaignService.getCampaignBySlug('unique-test-slug');

      expect(retrieved).toBeDefined();
      expect(retrieved.slug).toBe('unique-test-slug');
    });

    it('should throw error for non-existent slug', async () => {
      await expect(
        campaignService.getCampaignBySlug('non-existent-slug')
      ).rejects.toThrow('Campaign not found');
    });
  });

  describe('updateCampaign', () => {
    it('should update campaign successfully', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());

      const updated = await campaignService.updateCampaign(
        campaign._id.toString(),
        user._id.toString(),
        { title: 'Updated Title' }
      );

      expect(updated).toBeDefined();
      expect(updated.title).toBe('Updated Title');
    });

    it('should allow updating campaign title', async () => {
      const user = await createTestUser();
      const campaign = await createTestCampaign(user._id.toString());

      const updated = await campaignService.updateCampaign(
        campaign._id.toString(),
        user._id.toString(),
        { title: 'New Title', description: 'New Description' }
      );

      expect(updated.title).toBe('New Title');
      expect(updated.description).toBe('New Description');
    });
  });

  // Note: deleteCampaign test skipped as it requires ShirtLayout model
  // which would need to be imported and set up in the test environment

  describe('getUserCampaigns', () => {
    it('should retrieve all campaigns for a user', async () => {
      const user = await createTestUser();
      await createTestCampaign(user._id.toString());
      await createTestCampaign(user._id.toString());

      const campaigns = await campaignService.getUserCampaigns(user._id.toString());

      expect(campaigns).toHaveLength(2);
      expect(campaigns[0].ownerId.toString()).toBe(user._id.toString());
    });

    it('should return empty array for user with no campaigns', async () => {
      const user = await createTestUser();

      const campaigns = await campaignService.getUserCampaigns(user._id.toString());

      expect(campaigns).toHaveLength(0);
    });
  });
});

