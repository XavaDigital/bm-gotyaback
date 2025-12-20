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
      const campaign = await campaignService.createCampaign(
        campaignData as any
      );

      // Create layout based on campaign type
      if (
        campaign.campaignType === "fixed" ||
        campaign.campaignType === "positional"
      ) {
        // Grid layout for fixed and positional pricing
        if (layoutData.totalPositions && layoutData.columns) {
          await campaignService.createLayout(campaign._id, {
            totalPositions: layoutData.totalPositions,
            columns: layoutData.columns,
            arrangement: layoutData.arrangement || "horizontal",
            campaignType: campaign.campaignType,
            pricingConfig: campaign.pricingConfig,
          });
        }
      } else if (campaign.campaignType === "pay-what-you-want") {
        // Flexible layout for pay-what-you-want
        await campaignService.createLayout(campaign._id, {
          maxSponsors: layoutData.maxSponsors || 0, // 0 = unlimited
          campaignType: campaign.campaignType,
          pricingConfig: campaign.pricingConfig,
        });
      }

      message.success("Campaign created successfully!");
      navigate(`/campaigns/${campaign._id}`);
    } catch (error: any) {
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
