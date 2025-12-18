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
    // Validate Stripe configuration if enableStripePayments is true
    if (campaignData.enableStripePayments && !process.env.STRIPE_SECRET_KEY) {
        throw new Error('Cannot enable Stripe payments: Stripe is not configured on this server');
    }

    // Validate at least one payment method is enabled
    if (!campaignData.enableStripePayments && !campaignData.allowOfflinePayments) {
        throw new Error('At least one payment method must be enabled');
    }

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

    // Validate Stripe configuration if trying to enable Stripe payments
    if (updates.enableStripePayments && !process.env.STRIPE_SECRET_KEY) {
        throw new Error('Cannot enable Stripe payments: Stripe is not configured on this server');
    }

    // Validate at least one payment method is enabled
    const finalEnableStripe = updates.enableStripePayments !== undefined
        ? updates.enableStripePayments
        : campaign.enableStripePayments;
    const finalAllowOffline = updates.allowOfflinePayments !== undefined
        ? updates.allowOfflinePayments
        : campaign.allowOfflinePayments;

    if (!finalEnableStripe && !finalAllowOffline) {
        throw new Error('At least one payment method must be enabled');
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

export const updateCampaignPricing = async (campaignId: string, userId: string, pricingData: any) => {
    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
        throw new Error('Campaign not found');
    }

    // Verify ownership
    const ownerId = typeof campaign.ownerId === 'object' && campaign.ownerId._id
        ? campaign.ownerId._id.toString()
        : campaign.ownerId.toString();

    if (ownerId !== userId) {
        throw new Error('Not authorized to update this campaign');
    }

    if (campaign.isClosed) {
        throw new Error('Cannot update a closed campaign');
    }

    // Check for ANY sponsors (even pending)
    const hasSponsors = await mongoose.model('SponsorEntry').exists({ campaignId });
    if (hasSponsors) {
        throw new Error('Cannot update pricing because campaign already has sponsors');
    }

    // Determine config and update layout
    const pricingConfig: any = {};
    if (campaign.campaignType === 'fixed') {
        pricingConfig.fixedPrice = pricingData.fixedPrice;
    } else if (campaign.campaignType === 'placement') {
        pricingConfig.zonePricing = pricingData.zonePricing;
    } else {
        throw new Error('Cannot update pricing for donation campaigns');
    }

    // Find and update layout directly
    const ShirtLayout = mongoose.model('ShirtLayout');
    const layout = await ShirtLayout.findOne({ campaignId });

    if (!layout) {
        throw new Error('Layout not found');
    }

    // Recalculate all position prices
    // Re-using the logic from shirtLayout.service (inline for now to avoid circular deps or complex refactor)
    // Simple zone logic: top 1/3 = top, middle 1/3 = middle, bottom 1/3 = bottom

    layout.placements.forEach((placement: any) => {
        // Parse row from positionId (e.g. "R0C0")
        const match = placement.positionId.match(/R(\d+)C(\d+)/);
        if (match) {
            const row = parseInt(match[1]) - 1; // 0-based row index (stored as 1-based in ID)

            if (campaign.campaignType === 'fixed') {
                placement.price = pricingConfig.fixedPrice;
            } else if (campaign.campaignType === 'placement') {
                const rows = layout.rows;
                const zone = row < rows / 3 ? 'top' : row < (2 * rows) / 3 ? 'middle' : 'bottom';
                placement.price = pricingConfig.zonePricing[zone] || 0;
            }
        }
    });

    await layout.save();
    return true;
};
