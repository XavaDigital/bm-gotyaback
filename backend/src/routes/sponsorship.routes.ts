import { Router } from "express";
import * as sponsorshipController from "../controllers/sponsorship.controller";
import { protect } from "../middleware/auth.middleware";
import { uploadLogo } from "../middleware/upload.middleware";
import { sponsorLimiter, uploadLimiter, publicReadLimiter } from "../middleware/rateLimiter.middleware";
import { validateCreateSponsorship, validateMongoId } from "../middleware/validation.middleware";

const router = Router();

// Public sponsorship submission (with optional logo upload)
router.post(
  "/campaigns/:id/sponsor",
  sponsorLimiter,
  validateMongoId,
  uploadLogo.single("logoFile"),
  validateCreateSponsorship,
  sponsorshipController.createSponsorship,
);

// Public sponsor list (only paid sponsors)
router.get(
  "/campaigns/:id/public-sponsors",
  publicReadLimiter,
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
  uploadLimiter,
  uploadLogo.single("logoFile"),
  sponsorshipController.uploadLogo,
);

export default router;
