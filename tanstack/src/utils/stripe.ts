import { loadStripe } from '@stripe/stripe-js';
import type { Stripe } from '@stripe/stripe-js';

let stripePromise: Promise<Stripe | null> | null = null;
const campaignStripeCache = new Map<string, Promise<Stripe | null>>();

const getStripe = async (campaignId?: string): Promise<Stripe | null> => {
    try {
        // If campaignId is provided, get campaign-specific config
        if (campaignId) {
            if (!campaignStripeCache.has(campaignId)) {
                const promise = fetch(`http://localhost:5000/api/payment/campaigns/${campaignId}/config`)
                    .then(res => res.json())
                    .then(data => {
                        if (!data.publishableKey || !data.enableStripePayments) {
                            return null;
                        }
                        return loadStripe(data.publishableKey);
                    })
                    .catch(error => {
                        console.error('Failed to load Stripe for campaign:', error);
                        return null;
                    });
                campaignStripeCache.set(campaignId, promise);
            }
            return campaignStripeCache.get(campaignId)!;
        }

        // Otherwise get global config
        if (!stripePromise) {
            stripePromise = fetch('http://localhost:5000/api/payment/config')
                .then(res => res.json())
                .then(data => {
                    if (!data.publishableKey || !data.stripeEnabled) {
                        return null;
                    }
                    return loadStripe(data.publishableKey);
                })
                .catch(error => {
                    console.error('Failed to load Stripe:', error);
                    return null;
                });
        }
        return stripePromise;
    } catch (error) {
        console.error('Error in getStripe:', error);
        return null;
    }
};

export default getStripe;
