import { Request, Response } from "express";
import * as sponsorshipService from "../services/sponsorship.service";
import * as uploadService from "../services/upload.service";

export const createSponsorship = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;

    // Parse data from body (could be JSON or multipart form data)
    const data =
      typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;

    const {
      positionId,
      name,
      email,
      phone,
      message,
      amount,
      paymentMethod,
      sponsorType,
    } = data;

    // Validation
    if (!name || !email || !phone || !amount || !paymentMethod) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Handle logo file upload if present
    let logoUrl: string | undefined;
    const file = req.file;

    if (file && sponsorType === "logo") {
      // Upload logo to S3
      // Note: We'll generate a temporary ID for the folder structure
      const tempId = `temp-${Date.now()}`;
      logoUrl = await uploadService.uploadLogoToS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        tempId
      );
    }

    const sponsorship = await sponsorshipService.createSponsorship(campaignId, {
      positionId,
      name,
      email,
      phone,
      message,
      amount,
      paymentMethod,
      sponsorType,
      logoUrl,
    });

    res.status(201).json(sponsorship);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getSponsors = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const campaignId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const sponsors = await sponsorshipService.getSponsorsByCampaign(campaignId);
    res.json(sponsors);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getPublicSponsors = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const sponsors = await sponsorshipService.getPublicSponsors(campaignId);
    res.json(sponsors);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const markAsPaid = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const sponsorshipId = req.params.sponsorshipId;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const sponsorship = await sponsorshipService.markAsPaid(
      sponsorshipId,
      userId.toString()
    );
    res.json(sponsorship);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};

export const updatePaymentStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const sponsorshipId = req.params.sponsorshipId;
    const { status } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (!status || !["pending", "paid"].includes(status)) {
      return res
        .status(400)
        .json({ message: 'Invalid status. Must be "pending" or "paid"' });
    }

    const sponsorship = await sponsorshipService.updatePaymentStatus(
      sponsorshipId,
      userId.toString(),
      status
    );
    res.json(sponsorship);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized")
      ? 403
      : message.includes("Cannot manually change")
      ? 400
      : 400;
    res.status(status).json({ message });
  }
};

// Approve or reject logo sponsorship
export const approveLogo = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const sponsorshipId = req.params.sponsorshipId;
    const { approved, rejectionReason } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    if (typeof approved !== "boolean") {
      return res
        .status(400)
        .json({ message: "approved field is required and must be a boolean" });
    }

    const sponsorship = await sponsorshipService.approveLogoSponsorship(
      sponsorshipId,
      userId.toString(),
      approved,
      rejectionReason
    );

    res.json(sponsorship);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};

// Get pending logo approvals for a campaign
export const getPendingLogos = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const campaignId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const pendingLogos = await sponsorshipService.getPendingLogoApprovals(
      campaignId,
      userId.toString()
    );

    res.json(pendingLogos);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};
