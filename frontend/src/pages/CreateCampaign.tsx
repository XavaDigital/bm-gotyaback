import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { message } from 'antd';
import campaignService from '~/services/campaign.service';
import CampaignWizard from '~/components/CampaignWizard';

const CreateCampaign: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (campaignData: any, layoutData: any) => {
        try {
            setLoading(true);
            const campaign = await campaignService.createCampaign(campaignData as any);

            // Create layout based on campaign type and layout style
            if (campaign.campaignType === 'fixed' || campaign.campaignType === 'positional') {
                // Check if this is a section-based layout
                const isSectionLayout = campaign.campaignType === 'positional' &&
                                       campaign.layoutStyle === 'amount-ordered' &&
                                       campaign.pricingConfig?.sections;

                const isWordCloud = campaign.layoutStyle === 'word-cloud';

                if (isSectionLayout) {
                    // Section-based layout for positional campaigns
                    await campaignService.createLayout(campaign._id, {
                        campaignType: campaign.campaignType,
                        layoutStyle: campaign.layoutStyle,
                        pricingConfig: campaign.pricingConfig,
                    });
                } else if (isWordCloud) {
                    // Flexible layout for word-cloud (no grid needed)
                    await campaignService.createLayout(campaign._id, {
                        maxSponsors: 0, // 0 = unlimited for word cloud
                        campaignType: campaign.campaignType,
                        pricingConfig: campaign.pricingConfig,
                        layoutStyle: campaign.layoutStyle,
                    });
                } else if (layoutData.totalPositions && layoutData.columns) {
                    // Grid layout for size-ordered fixed and positional pricing
                    await campaignService.createLayout(campaign._id, {
                        totalPositions: layoutData.totalPositions,
                        columns: layoutData.columns,
                        arrangement: layoutData.arrangement || 'horizontal',
                        campaignType: campaign.campaignType,
                        pricingConfig: campaign.pricingConfig,
                        layoutStyle: campaign.layoutStyle,
                    });
                }
            } else if (campaign.campaignType === 'pay-what-you-want') {
                // Flexible layout for pay-what-you-want
                await campaignService.createLayout(campaign._id, {
                    maxSponsors: layoutData.maxSponsors || 0, // 0 = unlimited
                    campaignType: campaign.campaignType,
                    pricingConfig: campaign.pricingConfig,
                    layoutStyle: campaign.layoutStyle,
                });
            }

            message.success('Campaign created successfully!');
            navigate({ to: '/campaigns/$id', params: { id: campaign._id } });
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create campaign');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            style={{
                maxWidth: 800,
                margin: '0 auto',
                padding: 0,
            }}
        >
            <h1 style={{ fontSize: 'clamp(20px, 5vw, 28px)', marginBottom: 24 }}>Create Campaign</h1>
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
