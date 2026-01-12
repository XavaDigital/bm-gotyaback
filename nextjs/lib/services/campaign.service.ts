import apiClient from '../api-client';
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  UpdatePricingRequest,
  ShirtLayout,
  CreateLayoutRequest,
  SponsorEntry,
  CreateSponsorshipRequest,
  ApproveLogoRequest,
  CampaignPaymentConfig,
} from '@/types/campaign.types';

// Campaign CRUD operations
const getCampaigns = async (): Promise<Campaign[]> => {
  const response = await apiClient.get('/campaigns/my-campaigns');
  return response.data;
};

const getCampaignById = async (id: string): Promise<Campaign> => {
  const response = await apiClient.get(`/campaigns/${id}`);
  return response.data;
};

const getCampaignBySlug = async (slug: string): Promise<Campaign> => {
  const response = await apiClient.get(`/campaigns/public/${slug}`);
  return response.data;
};

const createCampaign = async (data: CreateCampaignRequest): Promise<Campaign> => {
  // If there's a header image file, use FormData
  if (data.headerImageFile) {
    const formData = new FormData();

    // Create a copy of data without the file
    const { headerImageFile, ...campaignData } = data;

    formData.append('data', JSON.stringify(campaignData));
    formData.append('headerImageFile', headerImageFile);

    const response = await apiClient.post('/campaigns', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Otherwise, send as JSON
  const response = await apiClient.post('/campaigns', data);
  return response.data;
};

const updateCampaign = async (
  id: string,
  data: UpdateCampaignRequest
): Promise<Campaign> => {
  // If there's a header image file, use FormData
  if (data.headerImageFile) {
    const formData = new FormData();

    // Create a copy of data without the file
    const { headerImageFile, ...campaignData } = data;

    formData.append('data', JSON.stringify(campaignData));
    formData.append('headerImageFile', headerImageFile);

    const response = await apiClient.put(`/campaigns/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  // Otherwise, send as JSON
  const response = await apiClient.put(`/campaigns/${id}`, data);
  return response.data;
};

const updatePricing = async (
  id: string,
  data: UpdatePricingRequest
): Promise<Campaign> => {
  const response = await apiClient.put(`/campaigns/${id}/pricing`, data);
  return response.data;
};

const deleteCampaign = async (id: string): Promise<void> => {
  await apiClient.delete(`/campaigns/${id}`);
};

const closeCampaign = async (id: string): Promise<Campaign> => {
  const response = await apiClient.post(`/campaigns/${id}/close`);
  return response.data;
};

const reopenCampaign = async (id: string): Promise<Campaign> => {
  const response = await apiClient.post(`/campaigns/${id}/reopen`);
  return response.data;
};

// Layout operations
const getLayout = async (campaignId: string): Promise<ShirtLayout> => {
  const response = await apiClient.get(`/campaigns/${campaignId}/layout`);
  return response.data;
};

const createLayout = async (
  campaignId: string,
  data: CreateLayoutRequest
): Promise<ShirtLayout> => {
  const response = await apiClient.post(`/campaigns/${campaignId}/layout`, data);
  return response.data;
};

const updateLayout = async (
  campaignId: string,
  data: Partial<CreateLayoutRequest>
): Promise<ShirtLayout> => {
  const response = await apiClient.put(`/campaigns/${campaignId}/layout`, data);
  return response.data;
};

// Sponsor operations
const getSponsors = async (campaignId: string): Promise<SponsorEntry[]> => {
  const response = await apiClient.get(`/campaigns/${campaignId}/sponsors`);
  return response.data;
};

const createSponsorship = async (
  campaignId: string,
  data: CreateSponsorshipRequest
): Promise<SponsorEntry> => {
  // If there's a logo file, use FormData
  if (data.logoFile) {
    const formData = new FormData();

    // Create a copy of data without the file
    const { logoFile, ...sponsorshipData } = data;

    formData.append('data', JSON.stringify(sponsorshipData));
    formData.append('logoFile', logoFile);

    const response = await apiClient.post(
      `/campaigns/${campaignId}/sponsor`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data;
  }

  // Otherwise, send as JSON
  const response = await apiClient.post(
    `/campaigns/${campaignId}/sponsor`,
    data
  );
  return response.data;
};

const approveLogo = async (
  sponsorId: string,
  data: ApproveLogoRequest
): Promise<SponsorEntry> => {
  const response = await apiClient.post(
    `/sponsorships/${sponsorId}/approve-logo`,
    data
  );
  return response.data;
};

// Payment configuration
const getPaymentConfig = async (campaignId: string): Promise<CampaignPaymentConfig> => {
  const response = await apiClient.get(`/payment/campaigns/${campaignId}/config`);
  return response.data;
};

const campaignService = {
  getCampaigns,
  getCampaignById,
  getCampaignBySlug,
  createCampaign,
  updateCampaign,
  updatePricing,
  deleteCampaign,
  closeCampaign,
  reopenCampaign,
  getLayout,
  createLayout,
  updateLayout,
  getSponsors,
  createSponsorship,
  approveLogo,
  getPaymentConfig,
};

export default campaignService;

