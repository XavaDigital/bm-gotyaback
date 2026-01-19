import apiClient from "./apiClient";
import type {
  SponsorEntry,
  CreateSponsorshipRequest,
} from "~/types/campaign.types";

const sponsorshipService = {
  // Create a sponsorship (public - no auth required)
  // Supports both JSON and multipart/form-data for logo uploads
  createSponsorship: async (
    campaignId: string,
    data: CreateSponsorshipRequest,
  ): Promise<SponsorEntry> => {
    // If there's a logo file, use FormData
    if (data.logoFile) {
      const formData = new FormData();
      formData.append(
        "data",
        JSON.stringify({
          positionId: data.positionId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          message: data.message,
          amount: data.amount,
          paymentMethod: data.paymentMethod,
          sponsorType: data.sponsorType,
        }),
      );
      formData.append("logoFile", data.logoFile);

      const response = await apiClient.post<SponsorEntry>(
        `/campaigns/${campaignId}/sponsor`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } else {
      // Regular JSON request
      const response = await apiClient.post<SponsorEntry>(
        `/campaigns/${campaignId}/sponsor`,
        data,
      );
      return response.data;
    }
  },

  // Get all sponsors for a campaign (owner only)
  getSponsors: async (campaignId: string): Promise<SponsorEntry[]> => {
    const response = await apiClient.get<SponsorEntry[]>(
      `/campaigns/${campaignId}/sponsors`,
    );
    return response.data;
  },

  // Get public sponsor list (paid sponsors only)
  getPublicSponsors: async (campaignId: string): Promise<SponsorEntry[]> => {
    const response = await apiClient.get<SponsorEntry[]>(
      `/campaigns/${campaignId}/public-sponsors`,
    );
    return response.data;
  },

  // Mark sponsorship as paid (owner only)
  markAsPaid: async (sponsorshipId: string): Promise<SponsorEntry> => {
    const response = await apiClient.post<SponsorEntry>(
      `/sponsorships/${sponsorshipId}/mark-paid`,
    );
    return response.data;
  },

  // Get pending logo approvals for a campaign (owner only)
  getPendingLogos: async (campaignId: string): Promise<SponsorEntry[]> => {
    const response = await apiClient.get<SponsorEntry[]>(
      `/campaigns/${campaignId}/pending-logos`,
    );
    return response.data;
  },

  // Approve or reject a logo (owner only)
  approveLogo: async (
    sponsorshipId: string,
    data: { approved: boolean; rejectionReason?: string },
  ): Promise<SponsorEntry> => {
    const response = await apiClient.post<SponsorEntry>(
      `/sponsorships/${sponsorshipId}/approve-logo`,
      data,
    );
    return response.data;
  },

  // Approve all pending logos for a campaign (owner only)
  approveAllLogos: async (campaignId: string): Promise<any> => {
    const response = await apiClient.post(
      `/campaigns/${campaignId}/approve-all-logos`,
    );
    return response.data;
  },

  // Update payment status (owner only)
  updatePaymentStatus: async (
    sponsorshipId: string,
    status: "pending" | "paid" | "failed",
  ): Promise<SponsorEntry> => {
    const response = await apiClient.patch<SponsorEntry>(
      `/sponsorships/${sponsorshipId}/payment-status`,
      { status },
    );
    return response.data;
  },

  // Upload logo before payment (for card payments)
  uploadLogo: async (
    campaignId: string,
    logoFile: File,
  ): Promise<{ logoUrl: string }> => {
    const formData = new FormData();
    formData.append("logoFile", logoFile);

    const response = await apiClient.post<{ logoUrl: string }>(
      `/campaigns/${campaignId}/upload-logo`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },
};

export default sponsorshipService;
