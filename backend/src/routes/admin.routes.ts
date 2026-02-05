import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { protect, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Admin routes (protected - require authentication AND admin role)
// All routes use both protect (authentication) and requireAdmin (authorization) middleware
router.post("/seed-sponsors", protect, requireAdmin, adminController.seedSponsors);
router.post("/approve-all-logos", protect, requireAdmin, adminController.approveAllLogos);
router.post("/mark-all-paid", protect, requireAdmin, adminController.markAllAsPaid);
router.post("/clear-sponsors", protect, requireAdmin, adminController.clearSponsors);
router.get("/campaigns", protect, requireAdmin, adminController.getAllCampaigns);
router.delete("/campaigns/:id", protect, requireAdmin, adminController.deleteCampaign);

export default router;

