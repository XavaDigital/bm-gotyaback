import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { message } from "antd";
import campaignService from "../services/campaign.service";
import CampaignWizard from "../components/CampaignWizard";

const CreateCampaign: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (campaignData: any, layoutData: any) => {
    try {
      setLoading(true);
      console.log("=== CreateCampaign handleSubmit ===");
      console.log("campaignData:", campaignData);
      console.log("layoutData:", layoutData);

      const campaign = await campaignService.createCampaign(
        campaignData as any
      );
      console.log("Campaign created:", campaign);

      // Create layout based on campaign type
      if (
        campaign.campaignType === "fixed" ||
        campaign.campaignType === "positional"
      ) {
        // Grid layout for fixed and positional pricing
        if (layoutData.totalPositions && layoutData.columns) {
          console.log("Creating grid layout with:", {
            totalPositions: layoutData.totalPositions,
            columns: layoutData.columns,
            arrangement: layoutData.arrangement || "horizontal",
            campaignType: campaign.campaignType,
            pricingConfig: campaign.pricingConfig,
          });

          await campaignService.createLayout(campaign._id, {
            totalPositions: layoutData.totalPositions,
            columns: layoutData.columns,
            arrangement: layoutData.arrangement || "horizontal",
            campaignType: campaign.campaignType,
            pricingConfig: campaign.pricingConfig,
          });
          console.log("Grid layout created successfully");
        } else {
          console.error("Missing layout data for grid campaign:", layoutData);
          message.warning(
            "Campaign created but layout is missing. Please contact support."
          );
        }
      } else if (campaign.campaignType === "pay-what-you-want") {
        // Flexible layout for pay-what-you-want
        console.log(
          "Creating flexible layout with maxSponsors:",
          layoutData.maxSponsors
        );

        await campaignService.createLayout(campaign._id, {
          maxSponsors: layoutData.maxSponsors || 0, // 0 = unlimited
          campaignType: campaign.campaignType,
          pricingConfig: campaign.pricingConfig,
        });
        console.log("Flexible layout created successfully");
      }

      message.success("Campaign created successfully!");
      navigate(`/campaigns/${campaign._id}`);
    } catch (error: any) {
      console.error("Campaign creation error:", error);
      message.error(
        error.response?.data?.message || "Failed to create campaign"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "40px auto", padding: "0 20px" }}>
      <h1>Create Campaign</h1>
      <CampaignWizard
        mode="create"
        onSubmit={handleSubmit}
        submitButtonText="Create Campaign"
        loading={loading}
      />
    </div>
  );
};

export default CreateCampaign;
