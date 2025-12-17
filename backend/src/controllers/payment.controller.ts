import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';

export const createPaymentIntent = async (req: Request, res: Response) => {
    try {
        const { campaignId, positionId, amount, sponsorData } = req.body;

        if (!campaignId || !amount || !sponsorData || !sponsorData.name) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const result = await paymentService.createPaymentIntent(
            campaignId,
            positionId,
            amount,
            sponsorData
        );

        res.json(result);
    } catch (error: any) {
        res.status(400).json({ message: error.message });
    }
};

export const handleWebhook = async (req: Request, res: Response) => {
    try {
        const signature = req.headers['stripe-signature'] as string;

        if (!signature) {
            return res.status(400).json({ message: 'Missing stripe signature' });
        }

        // Note: req.body should be raw buffer for webhook verification
        const result = await paymentService.handleWebhook(req.body, signature);

        res.json(result);
    } catch (error: any) {
        console.error('Webhook error:', error.message);
        res.status(400).json({ message: error.message });
    }
};

export const getConfig = async (req: Request, res: Response) => {
    try {
        const publishableKey = paymentService.getStripePublishableKey();
        res.json({ publishableKey });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
};
