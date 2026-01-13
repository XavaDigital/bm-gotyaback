import { Request, Response } from "express";
import * as shirtLayoutService from "../services/shirtLayout.service";
import * as campaignService from "../services/campaign.service";

export const createLayout = async (req: Request, res: Response) => {
  try {
    const userId = req.user?._id;
    const campaignId = req.params.id;

    if (!userId) {
      return res.status(401).json({ message: "User not authenticated" });
    }

    // Verify campaign ownership
    const campaign = await campaignService.getCampaignById(campaignId);

    // Handle both populated and unpopulated ownerId
    const ownerId =
      typeof campaign.ownerId === "object" && campaign.ownerId._id
        ? campaign.ownerId._id.toString()
        : campaign.ownerId.toString();

    if (ownerId !== userId.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to create layout for this campaign" });
    }

    const {
      totalPositions,
      columns,
      pricingConfig,
      maxSponsors,
      campaignType,
      arrangement,
      layoutStyle,
    } = req.body;

    let layout;

    // Check if this is a section-based layout (positional with amount-ordered)
    if (
      campaignType === "positional" &&
      layoutStyle === "amount-ordered" &&
      pricingConfig?.sections
    ) {
      // Create section-based layout
      layout = await shirtLayoutService.createSectionLayout(
        campaignId,
        campaignType,
        pricingConfig
      );
    } else {
      // Determine layout type based on layoutStyle (not just campaign type)
      // Flexible layouts: word-cloud, size-ordered, amount-ordered (for non-positional)
      // Grid layout: grid (or when layoutStyle is not specified for fixed/positional)
      const useFlexibleLayout =
        layoutStyle === "word-cloud" ||
        layoutStyle === "size-ordered" ||
        (layoutStyle === "amount-ordered" && campaignType !== "positional");

      if (useFlexibleLayout) {
        // Create flexible layout for word-cloud, size-ordered, amount-ordered
        layout = await shirtLayoutService.createFlexibleLayout(
          campaignId,
          maxSponsors || totalPositions // Use totalPositions as max if maxSponsors not provided
        );
      } else {
        // Create grid layout for grid layoutStyle or legacy fixed/positional
        if (!totalPositions || !columns) {
          return res.status(400).json({
            message: "Total positions and columns are required for grid layouts",
          });
        }

        layout = await shirtLayoutService.createLayout(
          campaignId,
          totalPositions,
          columns,
          campaignType,
          pricingConfig || campaign.pricingConfig,
          arrangement || "horizontal"
        );
      }
    }

    res.status(201).json(layout);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const getLayout = async (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const layout = await shirtLayoutService.getLayoutByCampaignId(campaignId);
    res.json(layout);
  } catch (error) {
    res.status(404).json({ message: (error as Error).message });
  }
};
