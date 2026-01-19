import { Router } from "express";
import * as sponsorshipController from "../controllers/sponsorship.controller";
import { protect } from "../middleware/auth.middleware";
import { uploadLogo } from "../middleware/upload.middleware";

const router = Router();

// Public sponsorship submission (with optional logo upload)
router.post(
  "/campaigns/:id/sponsor",
  uploadLogo.single("logoFile"),
  sponsorshipController.createSponsorship,
);

// Public sponsor list (only paid sponsors)
router.get(
  "/campaigns/:id/public-sponsors",
  sponsorshipController.getPublicSponsors,
);

// Protected routes (campaign owner only)
router.get(
  "/campaigns/:id/sponsors",
  protect,
  sponsorshipController.getSponsors,
);
router.post(
  "/sponsorships/:sponsorshipId/mark-paid",
  protect,
  sponsorshipController.markAsPaid,
);
router.patch(
  "/sponsorships/:sponsorshipId/payment-status",
  protect,
  sponsorshipController.updatePaymentStatus,
);

// Logo approval routes
router.post(
  "/sponsorships/:sponsorshipId/approve-logo",
  protect,
  sponsorshipController.approveLogo,
);
router.get(
  "/campaigns/:id/pending-logos",
  protect,
  sponsorshipController.getPendingLogos,
);
router.post(
  "/campaigns/:id/approve-all-logos",
  protect,
  sponsorshipController.approveAllLogos,
);

// Logo pre-upload route (for card payments)
router.post(
  "/campaigns/:id/upload-logo",
  uploadLogo.single("logoFile"),
  sponsorshipController.uploadLogo,
);

export default router;
