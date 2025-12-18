import { Request, Response } from 'express';
import * as campaignService from '../services/campaign.service';

export const createCampaign = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const campaign = await campaignService.createCampaign(userId.toString(), req.body);
        res.status(201).json(campaign);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getCampaign = async (req: Request, res: Response) => {
    try {
        const campaign = await campaignService.getCampaignById(req.params.id);
        res.json(campaign);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const getPublicCampaign = async (req: Request, res: Response) => {
    try {
        const campaign = await campaignService.getCampaignBySlug(req.params.slug);
        res.json(campaign);
    } catch (error) {
        res.status(404).json({ message: (error as Error).message });
    }
};

export const updateCampaign = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const campaign = await campaignService.updateCampaign(
            req.params.id,
            userId.toString(),
            req.body
        );
        res.json(campaign);
    } catch (error) {
        const message = (error as Error).message;
        const status = message.includes('Not authorized') ? 403 : 400;
        res.status(status).json({ message });
    }
};

export const updatePricing = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        await campaignService.updateCampaignPricing(
            req.params.id,
            userId.toString(),
            req.body
        );
        res.status(200).json({ message: 'Pricing updated successfully' });
    } catch (error) {
        const message = (error as Error).message;
        const status = message.includes('Not authorized') ? 403 : 400;
        res.status(status).json({ message });
    }
};

export const closeCampaign = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const campaign = await campaignService.closeCampaign(req.params.id, userId.toString());
        res.json(campaign);
    } catch (error) {
        const message = (error as Error).message;
        const status = message.includes('Not authorized') ? 403 : 400;
        res.status(status).json({ message });
    }
};

export const getMyCampaigns = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const campaigns = await campaignService.getUserCampaigns(userId.toString());
        res.json(campaigns);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};
