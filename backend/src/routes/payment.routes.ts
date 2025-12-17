import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';

const router = Router();

// Get Stripe config (public key)
router.get('/config', paymentController.getConfig);

// Create payment intent
router.post('/create-payment-intent', paymentController.createPaymentIntent);

// NOTE: Webhook route is mounted directly in app.ts with raw body parser

export default router;
