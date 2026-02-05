import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { paymentLimiter, publicReadLimiter } from '../middleware/rateLimiter.middleware';
import { validateCreatePaymentIntent } from '../middleware/validation.middleware';

const router = Router();

// Get Stripe config (public key)
router.get('/config', publicReadLimiter, paymentController.getConfig);

// Get campaign-specific payment config
router.get('/campaigns/:campaignId/config', publicReadLimiter, paymentController.getCampaignConfig);

// Create payment intent - strict rate limiting and validation
router.post('/create-payment-intent', paymentLimiter, validateCreatePaymentIntent, paymentController.createPaymentIntent);

// NOTE: Webhook route is mounted directly in app.ts with raw body parser

export default router;
