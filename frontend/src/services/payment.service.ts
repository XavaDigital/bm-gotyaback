import apiClient from './apiClient';
import type { PaymentConfig, CampaignPaymentConfig } from '../types/campaign.types';

const paymentService = {
    // Create payment intent for sponsorship
    createPaymentIntent: async (data: {
        campaignId: string;
        positionId?: string;
        amount: number;
        sponsorData: {
            name: string;
            email: string;
            message?: string;
        };
    }) => {
        const response = await apiClient.post('/payment/create-payment-intent', data);
        return response.data;
    },

    // Get Stripe config (publishable key)
    getConfig: async (): Promise<PaymentConfig> => {
        const response = await apiClient.get('/payment/config');
        return response.data;
    },

    // Get campaign-specific payment config
    getCampaignConfig: async (campaignId: string): Promise<CampaignPaymentConfig> => {
        const response = await apiClient.get(`/payment/campaigns/${campaignId}/config`);
        return response.data;
    },
};

export default paymentService;
