import apiClient from './apiClient';
import type { SponsorEntry, CreateSponsorshipRequest } from '../types/campaign.types';

const sponsorshipService = {
    // Create a sponsorship (public - no auth required)
    createSponsorship: async (
        campaignId: string,
        data: CreateSponsorshipRequest
    ): Promise<SponsorEntry> => {
        const response = await apiClient.post<SponsorEntry>(
            `/campaigns/${campaignId}/sponsor`,
            data
        );
        return response.data;
    },

    // Get all sponsors for a campaign (owner only)
    getSponsors: async (campaignId: string): Promise<SponsorEntry[]> => {
        const response = await apiClient.get<SponsorEntry[]>(`/campaigns/${campaignId}/sponsors`);
        return response.data;
    },

    // Get public sponsor list (paid sponsors only)
    getPublicSponsors: async (campaignId: string): Promise<SponsorEntry[]> => {
        const response = await apiClient.get<SponsorEntry[]>(
            `/campaigns/${campaignId}/public-sponsors`
        );
        return response.data;
    },

    // Mark sponsorship as paid (owner only)
    markAsPaid: async (sponsorshipId: string): Promise<SponsorEntry> => {
        const response = await apiClient.post<SponsorEntry>(
            `/sponsorships/${sponsorshipId}/mark-paid`
        );
        return response.data;
    },
};

export default sponsorshipService;
