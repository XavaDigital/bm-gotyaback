import { Router } from "express";
import * as sponsorshipController from "../controllers/sponsorship.controller";
import { protect } from "../middleware/auth.middleware";

const router = Router();

// Public sponsorship submission
router.post("/campaigns/:id/sponsor", sponsorshipController.createSponsorship);

// Public sponsor list (only paid sponsors)
router.get(
  "/campaigns/:id/public-sponsors",
  sponsorshipController.getPublicSponsors
);

// Protected routes (campaign owner only)
router.get(
  "/campaigns/:id/sponsors",
  protect,
  sponsorshipController.getSponsors
);
router.post(
  "/sponsorships/:sponsorshipId/mark-paid",
  protect,
  sponsorshipController.markAsPaid
);
router.patch(
  "/sponsorships/:sponsorshipId/payment-status",
  protect,
  sponsorshipController.updatePaymentStatus
);

export default router;
