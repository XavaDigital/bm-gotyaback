import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Admin routes (protected - require authentication)
// Note: In production, you might want to add an additional admin role check
router.post("/seed-sponsors", protect, adminController.seedSponsors);
router.post("/approve-all-logos", protect, adminController.approveAllLogos);
router.post("/mark-all-paid", protect, adminController.markAllAsPaid);
router.post("/clear-sponsors", protect, adminController.clearSponsors);
router.get("/campaigns", protect, adminController.getAllCampaigns);
router.delete("/campaigns/:id", protect, adminController.deleteCampaign);

export default router;

