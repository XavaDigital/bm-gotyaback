import React, { useEffect, useState } from "react";
import { Modal, message } from "antd";
import dayjs from "dayjs";
import type { Campaign, UpdateCampaignRequest } from "../types/campaign.types";
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
        console.log(`Campaign has ${sponsors.length} sponsors`);
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

      // Load pricing if applicable
      if (campaign.campaignType !== "pay-what-you-want") {
        try {
          const layout = await campaignService.getLayout(campaign._id);
          console.log("Loaded layout:", layout);

          if (layout && layout.placements && layout.placements.length > 0) {
            const pricingValues: any = {};
            if (campaign.campaignType === "fixed") {
              pricingValues.fixedPrice = layout.placements[0]?.price;
              console.log("Loaded fixed price:", pricingValues.fixedPrice);
            } else if (campaign.campaignType === "positional") {
              const firstPrice = layout.placements[0]?.price || 0;
              const secondPrice = layout.placements[1]?.price || 0;

              // Calculate base price and price per position from the first two placements
              pricingValues.basePrice = firstPrice;
              pricingValues.pricePerPosition = secondPrice - firstPrice;
              console.log("Loaded positional pricing:", pricingValues);
            }
            formValues.pricing = pricingValues;

            // Store layout configuration for display
            formValues.layoutConfig = {
              totalPositions: layout.totalPositions,
              columns: layout.columns,
              arrangement: layout.arrangement || "horizontal",
            };
          }
        } catch (error) {
          console.error("Failed to load layout pricing", error);
        }
      }

      console.log("Setting form values:", formValues);

      // Set campaignData for wizard
      setCampaignData({
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
      });
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

      console.log("Submitted campaign data:", submittedCampaignData);
      console.log("Has sponsors:", hasSponsors);
      console.log("Campaign type:", campaign?.campaignType);

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

      if (campaign) {
        await campaignService.updateCampaign(campaign._id, updateData);

        // 2. Update pricing ONLY if:
        // - Campaign is grid-based (fixed or positional)
        // - No sponsors exist yet
        // - Pricing values are actually provided
        // - NOT a "sections" layout (pricing is defined in tiers)
        if (
          campaign.campaignType !== "pay-what-you-want" &&
          !hasSponsors &&
          submittedCampaignData.pricing &&
          campaign.layoutStyle !== "sections"
        ) {
          console.log(
            "Attempting to update pricing:",
            submittedCampaignData.pricing
          );

          // Backend expects pricing values directly in the body, NOT nested under pricingConfig
          const pricingData: any = {};

          if (campaign.campaignType === "fixed") {
            const fixedPrice = Number(submittedCampaignData.pricing.fixedPrice);
            console.log("Fixed price value:", fixedPrice);

            if (isNaN(fixedPrice) || fixedPrice <= 0) {
              message.error("Please enter a valid fixed price");
              setLoading(false);
              return;
            }
            pricingData.fixedPrice = fixedPrice;
          } else if (campaign.campaignType === "positional") {
            const basePrice = Number(submittedCampaignData.pricing.basePrice);
            const pricePerPosition = Number(
              submittedCampaignData.pricing.pricePerPosition
            );

            console.log("Positional pricing values:", {
              basePrice,
              pricePerPosition,
            });

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

          console.log("Sending pricing update:", pricingData);
          await campaignService.updatePricing(campaign._id, pricingData);
        } else {
          console.log(
            "Skipping pricing update - conditions not met or sections layout"
          );
        }

        message.success("Campaign updated successfully");
        onSuccess();
      }
    } catch (error: any) {
      console.error("Update error:", error);
      message.error(
        error.response?.data?.message || "Failed to update campaign"
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
