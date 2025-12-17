import { Campaign } from '../models/Campaign';
import mongoose from 'mongoose';

// Helper function to generate URL-friendly slug
const generateSlug = (title: string): string => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
};

// Ensure slug uniqueness
const generateUniqueSlug = async (title: string): Promise<string> => {
    let slug = generateSlug(title);
    let counter = 1;

    while (await Campaign.findOne({ slug })) {
        slug = `${generateSlug(title)}-${counter}`;
        counter++;
    }

    return slug;
};

export const createCampaign = async (userId: string, campaignData: any) => {
    // Generate unique slug from title
    const slug = await generateUniqueSlug(campaignData.title);

    const campaign = await Campaign.create({
        ...campaignData,
        slug,
        ownerId: userId,
    });

    return campaign;
};

export const getCampaignById = async (campaignId: string) => {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new Error('Invalid campaign ID');
    }

    const campaign = await Campaign.findById(campaignId).populate('ownerId', 'name email');

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    return campaign;
};

export const getCampaignBySlug = async (slug: string) => {
    const campaign = await Campaign.findOne({ slug }).populate('ownerId', 'name email');

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    return campaign;
};

export const updateCampaign = async (campaignId: string, userId: string, updates: any) => {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    // Verify ownership - handle populated ownerId
    const ownerId = typeof campaign.ownerId === 'object' && campaign.ownerId._id
        ? campaign.ownerId._id.toString()
        : campaign.ownerId.toString();

    if (ownerId !== userId) {
        throw new Error('Not authorized to update this campaign');
    }

    // Don't allow updating certain fields if campaign is closed
    if (campaign.isClosed) {
        throw new Error('Cannot update a closed campaign');
    }

    // Prevent changing ownerId
    delete updates.ownerId;
    delete updates.slug;

    Object.assign(campaign, updates);
    await campaign.save();

    return campaign;
};

export const closeCampaign = async (campaignId: string, userId: string) => {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    // Verify ownership - handle populated ownerId
    const ownerId = typeof campaign.ownerId === 'object' && campaign.ownerId._id
        ? campaign.ownerId._id.toString()
        : campaign.ownerId.toString();

    if (ownerId !== userId) {
        throw new Error('Not authorized to close this campaign');
    }

    if (campaign.isClosed) {
        throw new Error('Campaign is already closed');
    }

    campaign.isClosed = true;
    await campaign.save();

    return campaign;
};

export const getUserCampaigns = async (userId: string) => {
    const campaigns = await Campaign.find({ ownerId: userId }).sort({ createdAt: -1 });
    return campaigns;
};

export const validateCampaignIsOpen = (campaign: any) => {
    if (campaign.isClosed) {
        throw new Error('Campaign is closed');
    }

    if (campaign.endDate && new Date() > new Date(campaign.endDate)) {
        throw new Error('Campaign has ended');
    }

    return true;
};
