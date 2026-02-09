import { describe, it, expect, vi, beforeEach } from 'vitest';
import userService from './user.service';
import apiClient from './apiClient';

vi.mock('./apiClient');

describe('User Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile with data only', async () => {
      const mockResponse = {
        message: 'Profile updated successfully',
        user: {
          _id: 'user-123',
          email: 'user@example.com',
          organizerProfile: {
            displayName: 'Test Organizer',
            slug: 'test-organizer',
          },
        },
      };

      const profileData = {
        displayName: 'Test Organizer',
        bio: 'Test bio',
        websiteUrl: 'https://example.com',
      };

      vi.mocked(apiClient.put).mockResolvedValue({ data: mockResponse });

      const result = await userService.updateProfile(profileData);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/users/profile',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update profile with logo file', async () => {
      const mockResponse = {
        message: 'Profile updated successfully',
        user: { _id: 'user-123' },
      };

      const profileData = {
        displayName: 'Test Organizer',
      };

      const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' });

      vi.mocked(apiClient.put).mockResolvedValue({ data: mockResponse });

      const result = await userService.updateProfile(profileData, logoFile);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/users/profile',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update profile with cover file', async () => {
      const mockResponse = {
        message: 'Profile updated successfully',
        user: { _id: 'user-123' },
      };

      const profileData = {
        displayName: 'Test Organizer',
      };

      const coverFile = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' });

      vi.mocked(apiClient.put).mockResolvedValue({ data: mockResponse });

      const result = await userService.updateProfile(profileData, null, coverFile);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/users/profile',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should update profile with both logo and cover files', async () => {
      const mockResponse = {
        message: 'Profile updated successfully',
        user: { _id: 'user-123' },
      };

      const profileData = {
        displayName: 'Test Organizer',
      };

      const logoFile = new File(['logo'], 'logo.png', { type: 'image/png' });
      const coverFile = new File(['cover'], 'cover.jpg', { type: 'image/jpeg' });

      vi.mocked(apiClient.put).mockResolvedValue({ data: mockResponse });

      const result = await userService.updateProfile(profileData, logoFile, coverFile);

      expect(apiClient.put).toHaveBeenCalledWith(
        '/users/profile',
        expect.any(FormData),
        expect.objectContaining({
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getPublicProfile', () => {
    it('should fetch public organizer profile by slug', async () => {
      const mockProfile = {
        displayName: 'Test Organizer',
        slug: 'test-organizer',
        bio: 'Test bio',
        logoUrl: 'https://example.com/logo.png',
        coverImageUrl: 'https://example.com/cover.jpg',
        websiteUrl: 'https://example.com',
        socialLinks: {
          facebook: 'https://facebook.com/test',
          twitter: 'https://twitter.com/test',
        },
        campaigns: [],
      };

      vi.mocked(apiClient.get).mockResolvedValue({ data: mockProfile });

      const result = await userService.getPublicProfile('test-organizer');

      expect(apiClient.get).toHaveBeenCalledWith('/public/organizers/test-organizer');
      expect(result).toEqual(mockProfile);
    });
  });
});

