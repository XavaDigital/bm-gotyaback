import { SponsorEntry } from '../models/SponsorEntry';
import { Campaign } from '../models/Campaign';
import * as shirtLayoutService from './shirtLayout.service';
import * as campaignService from './campaign.service';
import mongoose from 'mongoose';

export const createSponsorship = async (
    campaignId: string,
    sponsorData: {
        positionId?: string;
        name: string;
        email: string;
        message?: string;
        amount: number;
        paymentMethod: 'card' | 'cash';
    }
) => {
    // Get campaign and validate it's open
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new Error('Campaign not found');
    }

    campaignService.validateCampaignIsOpen(campaign);

    // For placement and fixed campaigns, we need to reserve a position
    if ((campaign.campaignType === 'placement' || campaign.campaignType === 'fixed') && sponsorData.positionId) {
        const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);

        // Get position details to verify price
        const position = await shirtLayoutService.getPositionDetails(
            layout._id.toString(),
            sponsorData.positionId
        );

        // Verify amount matches position price
        if (sponsorData.amount !== position.price) {
            throw new Error('Amount does not match position price');
        }

        // Atomically reserve the position
        try {
            await shirtLayoutService.reservePosition(
                layout._id.toString(),
                sponsorData.positionId
            );
        } catch (error) {
            throw new Error('Position not available or already taken');
        }
    }

    // Create sponsorship entry
    try {
        const sponsorEntry = await SponsorEntry.create({
            campaignId,
            positionId: sponsorData.positionId,
            name: sponsorData.name,
            email: sponsorData.email,
            message: sponsorData.message,
            amount: sponsorData.amount,
            paymentMethod: sponsorData.paymentMethod,
            paymentStatus: sponsorData.paymentMethod === 'cash' ? 'pending' : 'pending',
        });

        return sponsorEntry;
    } catch (error) {
        // If sponsorship creation fails, release the position
        if ((campaign.campaignType === 'placement' || campaign.campaignType === 'fixed') && sponsorData.positionId) {
            const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
            await shirtLayoutService.releasePosition(
                layout._id.toString(),
                sponsorData.positionId
            );
        }
        throw error;
    }
};

export const getSponsorsByCampaign = async (campaignId: string) => {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new Error('Invalid campaign ID');
    }

    const sponsors = await SponsorEntry.find({ campaignId }).sort({ createdAt: -1 });
    return sponsors;
};

export const markAsPaid = async (sponsorshipId: string, userId: string) => {
    if (!mongoose.Types.ObjectId.isValid(sponsorshipId)) {
        throw new Error('Invalid sponsorship ID');
    }

    const sponsorship = await SponsorEntry.findById(sponsorshipId);
    if (!sponsorship) {
        throw new Error('Sponsorship not found');
    }

    // Verify campaign ownership
    const campaign = await Campaign.findById(sponsorship.campaignId);
    if (!campaign) {
        throw new Error('Campaign not found');
    }

    if (campaign.ownerId.toString() !== userId) {
        throw new Error('Not authorized to mark payment for this sponsorship');
    }

    if (sponsorship.paymentStatus === 'paid') {
        throw new Error('Sponsorship is already marked as paid');
    }

    sponsorship.paymentStatus = 'paid';
    await sponsorship.save();

    return sponsorship;
};

// Get public sponsor list (only paid sponsors, limited info)
export const getPublicSponsors = async (campaignId: string) => {
    const sponsors = await SponsorEntry.find({
        campaignId,
        paymentStatus: 'paid',
    }).select('name message positionId createdAt');

    return sponsors;
};

export const validatePositionAvailable = async (layoutId: string, positionId: string) => {
    const position = await shirtLayoutService.getPositionDetails(layoutId, positionId);

    if (position.isTaken) {
        throw new Error('Position is already taken');
    }

    return true;
};
