import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Admin routes (protected - require authentication)
// Note: In production, you might want to add an additional admin role check
router.post("/seed-sponsors", protect, adminController.seedSponsors);
router.get("/campaigns", protect, adminController.getAllCampaigns);
router.delete("/campaigns/:id", protect, adminController.deleteCampaign);

export default router;

