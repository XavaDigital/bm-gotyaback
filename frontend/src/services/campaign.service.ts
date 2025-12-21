import apiClient from "./apiClient";
import type {
  Campaign,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  ShirtLayout,
  CreateLayoutRequest,
  UpdatePricingRequest,
} from "../types/campaign.types";

const campaignService = {
  // Create a new campaign
  createCampaign: async (data: CreateCampaignRequest): Promise<Campaign> => {
    // If there's a header image file, use FormData
    if (data.headerImageFile) {
      const formData = new FormData();

      // Create a copy of data without the file
      const { headerImageFile, ...campaignData } = data;

      formData.append("data", JSON.stringify(campaignData));
      formData.append("headerImageFile", headerImageFile);

      const response = await apiClient.post<Campaign>("/campaigns", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    }

    // Otherwise, send as JSON
    const response = await apiClient.post<Campaign>("/campaigns", data);
    return response.data;
  },

  // Get user's campaigns
  getMyCampaigns: async (): Promise<Campaign[]> => {
    const response = await apiClient.get<Campaign[]>("/campaigns/my-campaigns");
    return response.data;
  },

  // Get campaign by ID (owner only)
  getCampaignById: async (id: string): Promise<Campaign> => {
    const response = await apiClient.get<Campaign>(`/campaigns/${id}`);
    return response.data;
  },

  // Get public campaign by slug
  getPublicCampaign: async (slug: string): Promise<Campaign> => {
    const response = await apiClient.get<Campaign>(`/campaigns/public/${slug}`);
    return response.data;
  },

  // Update campaign
  updateCampaign: async (
    id: string,
    data: UpdateCampaignRequest
  ): Promise<Campaign> => {
    // If there's a header image file, use FormData
    if (data.headerImageFile) {
      const formData = new FormData();

      // Create a copy of data without the file
      const { headerImageFile, ...campaignData } = data;

      formData.append("data", JSON.stringify(campaignData));
      formData.append("headerImageFile", headerImageFile);

      const response = await apiClient.put<Campaign>(
        `/campaigns/${id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    }

    // Otherwise, send as JSON
    const response = await apiClient.put<Campaign>(`/campaigns/${id}`, data);
    return response.data;
  },

  // Close campaign
  closeCampaign: async (id: string): Promise<Campaign> => {
    const response = await apiClient.post<Campaign>(`/campaigns/${id}/close`);
    return response.data;
  },

  // Create shirt layout for campaign
  createLayout: async (
    campaignId: string,
    layout: CreateLayoutRequest
  ): Promise<ShirtLayout> => {
    const response = await apiClient.post<ShirtLayout>(
      `/campaigns/${campaignId}/layout`,
      layout
    );
    return response.data;
  },

  // Update campaign pricing
  updatePricing: async (
    id: string,
    data: UpdatePricingRequest
  ): Promise<void> => {
    await apiClient.put(`/campaigns/${id}/pricing`, data);
  },

  // Get layout for campaign
  getLayout: async (campaignId: string): Promise<ShirtLayout> => {
    const response = await apiClient.get<ShirtLayout>(
      `/campaigns/${campaignId}/layout`
    );
    return response.data;
  },
};

export default campaignService;
