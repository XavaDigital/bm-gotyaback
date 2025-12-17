import apiClient from './apiClient';

const paymentService = {
    // Create payment intent for sponsorship
    createPaymentIntent: async (data: {
        campaignId: string;
        positionId?: string;
        amount: number;
        sponsorData: {
            name: string;
            message?: string;
        };
    }) => {
        const response = await apiClient.post('/payment/create-payment-intent', data);
        return response.data;
    },

    // Get Stripe config (publishable key)
    getConfig: async () => {
        const response = await apiClient.get('/payment/config');
        return response.data;
    },
};

export default paymentService;
