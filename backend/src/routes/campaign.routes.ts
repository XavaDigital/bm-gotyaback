import { Router } from "express";
import * as campaignController from "../controllers/campaign.controller";
import * as shirtLayoutController from "../controllers/shirtLayout.controller";
import { protect } from "../middleware/auth.middleware";
import { uploadHeaderImage } from "../middleware/upload.middleware";

const router = Router();

// Public routes
router.get("/public/:slug", campaignController.getPublicCampaign);

// Protected routes (require authentication)
router.post(
  "/",
  protect,
  uploadHeaderImage.single("headerImageFile"),
  campaignController.createCampaign
);
router.get("/my-campaigns", protect, campaignController.getMyCampaigns);
router.get("/:id", protect, campaignController.getCampaign);
router.put(
  "/:id",
  protect,
  uploadHeaderImage.single("headerImageFile"),
  campaignController.updateCampaign
);
router.put("/:id/pricing", protect, campaignController.updatePricing);
router.post("/:id/close", protect, campaignController.closeCampaign);
router.post("/:id/reopen", protect, campaignController.reopenCampaign);

// Shirt layout routes
router.post("/:id/layout", protect, shirtLayoutController.createLayout);
router.get("/:id/layout", shirtLayoutController.getLayout); // Public for viewing

export default router;
