import { ShirtLayout } from '../models/ShirtLayout';
import mongoose from 'mongoose';

interface PricingConfig {
    fixedPrice?: number;
    zonePricing?: {
        [key: string]: number;
    };
}

// Generate position array based on campaign type
export const generatePositions = (
    rows: number,
    columns: number,
    campaignType: string,
    pricing: PricingConfig
) => {
    const positions = [];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
            const positionId = `R${row + 1}C${col + 1}`;
            let price = 0;

            if (campaignType === 'fixed' && pricing.fixedPrice) {
                price = pricing.fixedPrice;
            } else if (campaignType === 'placement' && pricing.zonePricing) {
                // Simple zone logic: top 1/3 = top, middle 1/3 = middle, bottom 1/3 = bottom
                const zone = row < rows / 3 ? 'top' : row < (2 * rows) / 3 ? 'middle' : 'bottom';
                price = pricing.zonePricing[zone] || 0;
            }

            positions.push({
                positionId,
                price,
                isTaken: false,
            });
        }
    }

    return positions;
};

export const createLayout = async (
    campaignId: string,
    rows: number,
    columns: number,
    campaignType: string,
    pricing: PricingConfig
) => {
    // Check if layout already exists for this campaign
    const existingLayout = await ShirtLayout.findOne({ campaignId });
    if (existingLayout) {
        throw new Error('Layout already exists for this campaign');
    }

    const positions = generatePositions(rows, columns, campaignType, pricing);

    const layout = await ShirtLayout.create({
        campaignId,
        rows,
        columns,
        placements: positions,
    });

    return layout;
};

export const getLayoutByCampaignId = async (campaignId: string) => {
    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new Error('Invalid campaign ID');
    }

    const layout = await ShirtLayout.findOne({ campaignId });

    if (!layout) {
        throw new Error('Layout not found for this campaign');
    }

    return layout;
};

// Atomic position reservation to prevent double booking
export const reservePosition = async (layoutId: string, positionId: string) => {
    const layout = await ShirtLayout.findOneAndUpdate(
        {
            _id: layoutId,
            'placements.positionId': positionId,
            'placements.isTaken': false,
        },
        {
            $set: { 'placements.$.isTaken': true },
        },
        { new: true }
    );

    if (!layout) {
        throw new Error('Position not available or already taken');
    }

    return layout;
};

// Release position (for failed payments or cancellations)
export const releasePosition = async (layoutId: string, positionId: string) => {
    const layout = await ShirtLayout.findOneAndUpdate(
        {
            _id: layoutId,
            'placements.positionId': positionId,
        },
        {
            $set: { 'placements.$.isTaken': false },
        },
        { new: true }
    );

    if (!layout) {
        throw new Error('Position not found');
    }

    return layout;
};

// Get position details
export const getPositionDetails = async (layoutId: string, positionId: string) => {
    const layout = await ShirtLayout.findById(layoutId);

    if (!layout) {
        throw new Error('Layout not found');
    }

    const position = layout.placements.find((p: any) => p.positionId === positionId);

    if (!position) {
        throw new Error('Position not found');
    }

    return position;
};
