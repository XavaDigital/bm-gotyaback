import React, { useEffect, useState } from "react";
import { Modal, message } from "antd";
import dayjs from "dayjs";
import type { Campaign, UpdateCampaignRequest } from "~/types/campaign.types";
import campaignService from "../services/campaign.service";
import sponsorshipService from "../services/sponsorship.service";
import CampaignWizard from "./CampaignWizard";

interface EditCampaignModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  campaign: Campaign | null;
}

const EditCampaignModal: React.FC<EditCampaignModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  campaign,
}) => {
  const [loading, setLoading] = useState(false);
  const [hasSponsors, setHasSponsors] = useState(false);
  const [initializing, setInitializing] = useState(false);
  const [campaignData, setCampaignData] = useState<any>({});

  useEffect(() => {
    if (visible && campaign) {
      initializeForm();
    } else if (!visible) {
      // Reset state when modal closes
      setHasSponsors(false);
      setInitializing(false);
      setCampaignData({});
    }
  }, [visible, campaign]);

  const initializeForm = async () => {
    if (!campaign) return;

    setInitializing(true);

    try {
      // Check sponsors first
      try {
        const sponsors = await sponsorshipService.getSponsors(campaign._id);
        setHasSponsors(sponsors.length > 0);
      } catch (error) {
        console.error("Failed to check sponsors", error);
        setHasSponsors(false); // Default to false if check fails
      }

      // Initialize form values
      const formValues: any = {
        title: campaign.title,
        shortDescription: campaign.shortDescription || "",
        description: campaign.description || "",
        enableStripePayments: campaign.enableStripePayments ?? true,
        allowOfflinePayments: campaign.allowOfflinePayments ?? false,
        garmentType: campaign.garmentType,
        currency: campaign.currency,
        dates: [
          campaign.startDate ? dayjs(campaign.startDate) : null,
          campaign.endDate ? dayjs(campaign.endDate) : null,
        ],
      };

      // Load pricing from campaign.pricingConfig (the source of truth)
      if (campaign.campaignType !== "pay-what-you-want") {
        const pricingValues: any = {};

        if (campaign.campaignType === "fixed") {
          pricingValues.fixedPrice = campaign.pricingConfig?.fixedPrice;
        } else if (campaign.campaignType === "positional") {
          pricingValues.basePrice = campaign.pricingConfig?.basePrice;
          pricingValues.pricePerPosition = campaign.pricingConfig?.pricePerPosition;
        }

        formValues.pricing = pricingValues;

        // Load layout configuration for display
        try {
          const layout = await campaignService.getLayout(campaign._id);

          if (layout) {
            formValues.layoutConfig = {
              totalPositions: layout.totalPositions,
              columns: layout.columns,
              arrangement: layout.arrangement || "horizontal",
            };
          } else {
            // No layout exists yet
            formValues.layoutConfig = {};
          }
        } catch (error) {
          console.error("Failed to load layout", error);
          formValues.layoutConfig = {};
        }
      }

      // Set campaignData for wizard
      const newCampaignData = {
        title: campaign.title,
        shortDescription: campaign.shortDescription,
        description: campaign.description,
        garmentType: campaign.garmentType,
        campaignType: campaign.campaignType,
        sponsorDisplayType: campaign.sponsorDisplayType,
        layoutStyle: campaign.layoutStyle,
        currency: campaign.currency,
        enableStripePayments: campaign.enableStripePayments,
        allowOfflinePayments: campaign.allowOfflinePayments,
        dates: [
          campaign.startDate ? dayjs(campaign.startDate) : null,
          campaign.endDate ? dayjs(campaign.endDate) : null,
        ],
        pricing: formValues.pricing,
        layoutConfig: formValues.layoutConfig,
      };

      setCampaignData(newCampaignData);
    } catch (error) {
      console.error("Failed to initialize form", error);
      message.error("Failed to load campaign details");
    } finally {
      setInitializing(false);
    }
  };

  const handleSubmit = async (submittedCampaignData: any, layoutData: any) => {
    try {
      setLoading(true);

      // 1. Update basic fields
      const updateData: UpdateCampaignRequest = {
        title: submittedCampaignData.title,
        shortDescription: submittedCampaignData.shortDescription,
        description: submittedCampaignData.description,
        enableStripePayments: submittedCampaignData.enableStripePayments,
        allowOfflinePayments: submittedCampaignData.allowOfflinePayments,
        garmentType: submittedCampaignData.garmentType,
      };

      if (submittedCampaignData.startDate && submittedCampaignData.endDate) {
        updateData.startDate = submittedCampaignData.startDate;
        updateData.endDate = submittedCampaignData.endDate;
      }

      if (submittedCampaignData.headerImageFile) {
        updateData.headerImageFile = submittedCampaignData.headerImageFile;
      }

      if (campaign) {
        await campaignService.updateCampaign(campaign._id, updateData);

        // 2. Update/create layout and pricing ONLY if:
        // - Campaign is grid-based (fixed or positional)
        // - No sponsors exist yet
        // - Pricing values are actually provided
        if (
          campaign.campaignType !== "pay-what-you-want" &&
          !hasSponsors &&
          submittedCampaignData.pricing
        ) {
          // Check if we need to create/recreate the layout
          const layout = await campaignService.getLayout(campaign._id);

          // Check if this is a word-cloud layout (uses flexible layout, no grid needed)
          const isWordCloudLayout = campaign.layoutStyle === "word-cloud";

          // Determine if layout needs to be created based on layout style
          const needsLayoutCreation = !layout ||
                                      (isWordCloudLayout && layout.layoutType !== 'flexible') ||
                                      (!isWordCloudLayout && (layout.layoutType !== 'grid' || !layout.placements || layout.placements.length === 0));

          if (needsLayoutCreation) {
            // Validate that we have the necessary layout configuration for grid layouts
            if (!isWordCloudLayout &&
                (!submittedCampaignData.layoutConfig?.totalPositions ||
                !submittedCampaignData.layoutConfig?.columns)) {
              message.error("Please provide Total Positions and Columns to create the layout");
              setLoading(false);
              return;
            }

            // Build pricing config
            const pricingConfig: any = {};
            if (campaign.campaignType === "fixed") {
              const fixedPrice = Number(submittedCampaignData.pricing.fixedPrice);
              if (isNaN(fixedPrice) || fixedPrice <= 0) {
                message.error("Please enter a valid fixed price");
                setLoading(false);
                return;
              }
              pricingConfig.fixedPrice = fixedPrice;
            } else if (campaign.campaignType === "positional") {
              const basePrice = Number(submittedCampaignData.pricing.basePrice);
              const pricePerPosition = Number(submittedCampaignData.pricing.pricePerPosition);

              if (isNaN(basePrice) || basePrice < 0) {
                message.error("Please enter a valid base price");
                setLoading(false);
                return;
              }
              if (isNaN(pricePerPosition) || pricePerPosition < 0) {
                message.error("Please enter a valid price per position");
                setLoading(false);
                return;
              }

              pricingConfig.basePrice = basePrice;
              pricingConfig.pricePerPosition = pricePerPosition;
            }

            // Create the layout with placements
            if (isWordCloudLayout) {
              // For word-cloud layouts, create a flexible layout
              await campaignService.createLayout(campaign._id, {
                maxSponsors: submittedCampaignData.layoutConfig?.totalPositions || 0, // 0 = unlimited
                campaignType: campaign.campaignType,
                pricingConfig,
                layoutStyle: campaign.layoutStyle,
              });
            } else {
              // For grid layouts (size-ordered, etc.)
              await campaignService.createLayout(campaign._id, {
                totalPositions: submittedCampaignData.layoutConfig.totalPositions,
                columns: submittedCampaignData.layoutConfig.columns,
                arrangement: submittedCampaignData.layoutConfig.arrangement || 'horizontal',
                campaignType: campaign.campaignType,
                pricingConfig,
                layoutStyle: campaign.layoutStyle,
              });
            }
          } else {
            // Layout exists with placements, just update pricing
            const pricingData: any = {};

            if (campaign.campaignType === "fixed") {
              const fixedPrice = Number(submittedCampaignData.pricing.fixedPrice);

              if (isNaN(fixedPrice) || fixedPrice <= 0) {
                message.error("Please enter a valid fixed price");
                setLoading(false);
                return;
              }
              pricingData.fixedPrice = fixedPrice;
            } else if (campaign.campaignType === "positional") {
              const basePrice = Number(submittedCampaignData.pricing.basePrice);
              const pricePerPosition = Number(
                submittedCampaignData.pricing.pricePerPosition,
              );

              if (isNaN(basePrice) || basePrice < 0) {
                message.error("Please enter a valid base price");
                setLoading(false);
                return;
              }
              if (isNaN(pricePerPosition) || pricePerPosition < 0) {
                message.error("Please enter a valid price per position");
                setLoading(false);
                return;
              }

              pricingData.basePrice = basePrice;
              pricingData.pricePerPosition = pricePerPosition;
            }

            await campaignService.updatePricing(campaign._id, pricingData);
          }
        }

        message.success("Campaign updated successfully");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Update error:", error);
      message.error(
        error.response?.data?.message || "Failed to update campaign",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Edit Campaign"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      destroyOnClose
    >
      {initializing ? (
        <div style={{ padding: "40px 0", textAlign: "center" }}>
          Loading campaign details...
        </div>
      ) : (
        <CampaignWizard
          mode="edit"
          initialCampaignData={campaignData}
          initialLayoutData={{}}
          onSubmit={handleSubmit}
          submitButtonText="Save Changes"
          loading={loading}
          hasSponsors={hasSponsors}
        />
      )}
    </Modal>
  );
};

export default EditCampaignModal;
