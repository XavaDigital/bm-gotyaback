'use client';

import React, { useEffect, useState } from 'react';
import { Modal, message } from 'antd';
import type { Campaign, UpdateCampaignRequest } from '@/types/campaign.types';
import campaignService from '@/lib/services/campaign.service';
import sponsorshipService from '@/lib/services/sponsorship.service';
import CampaignWizard from './CampaignWizard';

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
        console.error('Failed to check sponsors', error);
        setHasSponsors(false);
      }

      // Initialize form values
      const formValues: any = {
        title: campaign.title,
        shortDescription: campaign.shortDescription || '',
        description: campaign.description || '',
        enableStripePayments: campaign.enableStripePayments ?? true,
        allowOfflinePayments: campaign.allowOfflinePayments ?? false,
        garmentType: campaign.garmentType,
        currency: campaign.currency,
        campaignType: campaign.campaignType,
        slug: campaign.slug,
      };

      setCampaignData(formValues);
    } catch (error) {
      console.error('Failed to initialize form', error);
      message.error('Failed to load campaign data');
    } finally {
      setInitializing(false);
    }
  };

  const handleSubmit = async (updatedCampaignData: any, layoutData: any) => {
    if (!campaign) return;

    setLoading(true);
    try {
      const updateData: UpdateCampaignRequest = {
        title: updatedCampaignData.title,
        shortDescription: updatedCampaignData.shortDescription,
        description: updatedCampaignData.description,
        enableStripePayments: updatedCampaignData.enableStripePayments,
        allowOfflinePayments: updatedCampaignData.allowOfflinePayments,
        garmentType: updatedCampaignData.garmentType,
        currency: updatedCampaignData.currency,
      };

      await campaignService.updateCampaign(campaign._id, updateData);
      message.success('Campaign updated successfully!');
      onSuccess();
      onCancel();
    } catch (error: any) {
      console.error('Failed to update campaign', error);
      message.error(
        error.response?.data?.message || 'Failed to update campaign'
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
      {!initializing && campaign && (
        <CampaignWizard
          mode="edit"
          initialCampaignData={campaignData}
          initialLayoutData={{}}
          onSubmit={handleSubmit}
          submitButtonText="Update Campaign"
          loading={loading}
          hasSponsors={hasSponsors}
        />
      )}
    </Modal>
  );
};

export default EditCampaignModal;

