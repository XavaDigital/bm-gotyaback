import { Request, Response } from "express";
import * as campaignService from "../services/campaign.service";
import * as uploadService from "../services/upload.service";

export const createCampaign = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Parse data from body (could be JSON or multipart form data)
    const data =
      typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;

    console.log("=== CREATE CAMPAIGN CONTROLLER ===");
    console.log("Received data:", JSON.stringify(data, null, 2));
    console.log("campaignType:", data.campaignType);
    console.log("layoutStyle:", data.layoutStyle);
    console.log("pricingConfig:", JSON.stringify(data.pricingConfig, null, 2));

    // Handle header image upload if present
    let headerImageUrl: string | undefined;
    const file = req.file;

    if (file) {
      // Create campaign first to get ID for folder structure
      const tempCampaign: any = await campaignService.createCampaign(
        userId.toString(),
        data
      );

      // Upload header image to S3
      headerImageUrl = await uploadService.uploadHeaderImageToS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        tempCampaign._id.toString()
      );

      // Update campaign with header image URL
      const campaign = await campaignService.updateCampaign(
        tempCampaign._id.toString(),
        userId.toString(),
        { headerImageUrl }
      );

      res.status(201).json(campaign);
    } else {
      const campaign = await campaignService.createCampaign(
        userId.toString(),
        data
      );
      res.status(201).json(campaign);
    }
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaignById(req.params.id);
    res.json(campaign);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

export const getPublicCampaign = async (req: Request, res: Response) => {
  try {
    const campaign = await campaignService.getCampaignBySlug(req.params.slug);
    res.json(campaign);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};

export const updateCampaign = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Parse data from body (could be JSON or multipart form data)
    const data =
      typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;

    // Handle header image upload if present
    const file = req.file;

    if (file) {
      // Upload header image to S3
      const headerImageUrl = await uploadService.uploadHeaderImageToS3(
        file.buffer,
        file.originalname,
        file.mimetype,
        req.params.id
      );

      // Add header image URL to update data
      data.headerImageUrl = headerImageUrl;
    }

    const campaign = await campaignService.updateCampaign(
      req.params.id,
      userId.toString(),
      data
    );
    res.json(campaign);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};

export const updatePricing = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    await campaignService.updateCampaignPricing(
      req.params.id,
      userId.toString(),
      req.body
    );
    res.status(200).json({ message: "Pricing updated successfully" });
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};

export const closeCampaign = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const campaign = await campaignService.closeCampaign(
      req.params.id,
      userId.toString()
    );
    res.json(campaign);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};

export const getMyCampaigns = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const campaigns = await campaignService.getUserCampaigns(userId.toString());
    res.json(campaigns);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const duplicateCampaign = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    const { title, startDate, endDate } = req.body;

    const newCampaign = await campaignService.duplicateCampaign(
      req.params.id,
      userId.toString(),
      { title, startDate, endDate }
    );

    res.status(201).json(newCampaign);
  } catch (error) {
    const message = (error as Error).message;
    const status = message.includes("Not authorized") ? 403 : 400;
    res.status(status).json({ message });
  }
};
