import { loadStripe } from '@stripe/stripe-js';

let stripePromise: Promise<any> | null = null;

const getStripe = () => {
    if (!stripePromise) {
        // Get publishable key from backend
        stripePromise = fetch('http://localhost:5000/api/payment/config')
            .then(res => res.json())
            .then(data => loadStripe(data.publishableKey));
    }
    return stripePromise;
};

export default getStripe;
