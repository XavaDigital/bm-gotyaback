import { Request, Response } from 'express';
import * as shirtLayoutService from '../services/shirtLayout.service';
import * as campaignService from '../services/campaign.service';

export const createLayout = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const campaignId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Verify campaign ownership
        const campaign = await campaignService.getCampaignById(campaignId);

        // Handle both populated and unpopulated ownerId
        const ownerId = typeof campaign.ownerId === 'object' && campaign.ownerId._id
            ? campaign.ownerId._id.toString()
            : campaign.ownerId.toString();

        if (ownerId !== userId.toString()) {
            return res.status(403).json({ message: 'Not authorized to create layout for this campaign' });
        }

        const { rows, columns, pricing } = req.body;

        const layout = await shirtLayoutService.createLayout(
            campaignId,
            rows,
            columns,
            campaign.campaignType,
            pricing
        );

        res.status(201).json(layout);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getLayout = async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
        res.json(layout);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};
