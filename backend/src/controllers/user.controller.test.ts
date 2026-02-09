import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as userController from './user.controller';
import * as userService from '../services/user.service';
import * as s3Upload from '../utils/s3Upload';
import { mockRequest, mockResponse, createTestUser } from '../test/testUtils';

// Mock the services
vi.mock('../services/user.service');
vi.mock('../utils/s3Upload');

describe('User Controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('updateProfile', () => {
    it('should update profile without files', async () => {
      const user = await createTestUser();
      const profileData = {
        organizerProfile: {
          displayName: 'Test Organizer',
          bio: 'Test bio',
        },
      };

      const req = mockRequest({
        user,
        body: profileData,
        files: undefined,
      });
      const res = mockResponse();

      const updatedUser = {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organizerProfile: profileData.organizerProfile,
      };

      vi.spyOn(userService, 'updateProfile').mockResolvedValue(updatedUser as any);

      await userController.updateProfile(req as any, res as any);

      expect(userService.updateProfile).toHaveBeenCalledWith(
        user._id.toString(),
        profileData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Profile updated successfully',
          user: expect.objectContaining({
            _id: user._id,
            email: user.email,
          }),
        })
      );
    });

    it('should update profile with logo file', async () => {
      const user = await createTestUser();
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'logo.jpg',
        mimetype: 'image/jpeg',
      };

      const req = mockRequest({
        user,
        body: {
          data: JSON.stringify({
            organizerProfile: {
              displayName: 'Test Organizer',
            },
          }),
        },
        files: {
          logoFile: [mockFile],
        },
      });
      const res = mockResponse();

      const mockLogoUrl = 'https://s3.amazonaws.com/logo.jpg';
      vi.spyOn(s3Upload, 'uploadToS3').mockResolvedValue(mockLogoUrl);
      vi.spyOn(userService, 'updateProfile').mockResolvedValue(user as any);

      await userController.updateProfile(req as any, res as any);

      expect(s3Upload.uploadToS3).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        mockFile.mimetype,
        'organizers/logos/'
      );
      expect(userService.updateProfile).toHaveBeenCalledWith(
        user._id.toString(),
        expect.objectContaining({
          logoUrl: mockLogoUrl,
        })
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should update profile with cover file', async () => {
      const user = await createTestUser();
      const mockFile = {
        buffer: Buffer.from('test'),
        originalname: 'cover.jpg',
        mimetype: 'image/jpeg',
      };

      const req = mockRequest({
        user,
        body: {
          data: JSON.stringify({
            organizerProfile: {
              displayName: 'Test Organizer',
            },
          }),
        },
        files: {
          coverFile: [mockFile],
        },
      });
      const res = mockResponse();

      const mockCoverUrl = 'https://s3.amazonaws.com/cover.jpg';
      vi.spyOn(s3Upload, 'uploadToS3').mockResolvedValue(mockCoverUrl);
      vi.spyOn(userService, 'updateProfile').mockResolvedValue(user as any);

      await userController.updateProfile(req as any, res as any);

      expect(s3Upload.uploadToS3).toHaveBeenCalledWith(
        mockFile.buffer,
        mockFile.originalname,
        mockFile.mimetype,
        'organizers/covers/'
      );
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 401 if user not authenticated', async () => {
      const req = mockRequest({
        user: undefined,
        body: {},
      });
      const res = mockResponse();

      await userController.updateProfile(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 400 on error', async () => {
      const user = await createTestUser();
      const req = mockRequest({
        user,
        body: {},
      });
      const res = mockResponse();

      vi.spyOn(userService, 'updateProfile').mockRejectedValue(new Error('Update failed'));

      await userController.updateProfile(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Update failed' });
    });
  });
});

