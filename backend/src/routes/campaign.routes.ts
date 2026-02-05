import { Router } from "express";
import * as campaignController from "../controllers/campaign.controller";
import * as shirtLayoutController from "../controllers/shirtLayout.controller";
import { protect } from "../middleware/auth.middleware";
import { uploadHeaderImage } from "../middleware/upload.middleware";
import { publicReadLimiter, uploadLimiter } from "../middleware/rateLimiter.middleware";
import { validateCreateCampaign, validateMongoId } from "../middleware/validation.middleware";

const router = Router();

// Public routes
router.get("/public/:slug", publicReadLimiter, campaignController.getPublicCampaign);

// Protected routes (require authentication)
router.post(
  "/",
  protect,
  uploadLimiter,
  uploadHeaderImage.single("headerImageFile"),
  validateCreateCampaign,
  campaignController.createCampaign
);
router.get("/my-campaigns", protect, campaignController.getMyCampaigns);
router.get("/:id", protect, validateMongoId, campaignController.getCampaign);
router.put(
  "/:id",
  protect,
  uploadLimiter,
  uploadHeaderImage.single("headerImageFile"),
  campaignController.updateCampaign
);
router.put("/:id/pricing", protect, campaignController.updatePricing);
router.post("/:id/close", protect, campaignController.closeCampaign);

// Shirt layout routes
router.post("/:id/layout", protect, shirtLayoutController.createLayout);
router.get("/:id/layout", publicReadLimiter, shirtLayoutController.getLayout); // Public for viewing

export default router;
