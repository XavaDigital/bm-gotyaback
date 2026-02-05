import apiClient from './apiClient';
import type { UpdateProfileRequest, OrganizerProfile, OrganizerPublicProfile } from '~/types/campaign.types';

const userService = {
    // Update user's organizer profile
    updateProfile: async (
        data: UpdateProfileRequest,
        logoFile?: File | null,
        coverFile?: File | null
    ): Promise<{ message: string; user: any }> => {
        const formData = new FormData();

        // Add profile data as JSON string
        formData.append('data', JSON.stringify(data));

        // Add files if provided
        if (logoFile) {
            formData.append('logoFile', logoFile);
        }
        if (coverFile) {
            formData.append('coverFile', coverFile);
        }

        const response = await apiClient.put('/users/profile', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    // Get public organizer profile by slug
    getPublicProfile: async (slug: string): Promise<OrganizerPublicProfile> => {
        const response = await apiClient.get(`/public/organizers/${slug}`);
        return response.data;
    },
};

export default userService;

