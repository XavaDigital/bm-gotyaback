import { Request, Response } from 'express';
import * as sponsorshipService from '../services/sponsorship.service';

export const createSponsorship = async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        const { positionId, name, email, message, amount, paymentMethod } = req.body;

        // Validation
        if (!name || !email || !amount || !paymentMethod) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const sponsorship = await sponsorshipService.createSponsorship(campaignId, {
            positionId,
            name,
            email,
            message,
            amount,
            paymentMethod,
        });

        res.status(201).json(sponsorship);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getSponsors = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const campaignId = req.params.id;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const sponsors = await sponsorshipService.getSponsorsByCampaign(campaignId);
        res.json(sponsors);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const getPublicSponsors = async (req: Request, res: Response) => {
    try {
        const campaignId = req.params.id;
        const sponsors = await sponsorshipService.getPublicSponsors(campaignId);
        res.json(sponsors);
    } catch (error) {
        res.status(400).json({ message: (error as Error).message });
    }
};

export const markAsPaid = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id;
        const sponsorshipId = req.params.sponsorshipId;

        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated' });
        }

        const sponsorship = await sponsorshipService.markAsPaid(sponsorshipId, userId.toString());
        res.json(sponsorship);
    } catch (error) {
        const message = (error as Error).message;
        const status = message.includes('Not authorized') ? 403 : 400;
        res.status(status).json({ message });
    }
};
