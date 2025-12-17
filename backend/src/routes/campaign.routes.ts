import { Router } from 'express';
import * as campaignController from '../controllers/campaign.controller';
import * as shirtLayoutController from '../controllers/shirtLayout.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/public/:slug', campaignController.getPublicCampaign);

// Protected routes (require authentication)
router.post('/', protect, campaignController.createCampaign);
router.get('/my-campaigns', protect, campaignController.getMyCampaigns);
router.get('/:id', protect, campaignController.getCampaign);
router.put('/:id', protect, campaignController.updateCampaign);
router.post('/:id/close', protect, campaignController.closeCampaign);

// Shirt layout routes
router.post('/:id/layout', protect, shirtLayoutController.createLayout);
router.get('/:id/layout', shirtLayoutController.getLayout); // Public for viewing

export default router;
