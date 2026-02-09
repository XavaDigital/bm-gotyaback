import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as userService from './user.service';
import { User } from '../models/User';
import { createTestUser, cleanupTestData } from '../test/testUtils';
import bcrypt from 'bcryptjs';
import * as tokenService from './token.service';

// Mock the token service
vi.mock('./token.service');
vi.mock('./email.service');

describe('User Service', () => {
  beforeEach(async () => {
    await cleanupTestData();
    vi.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register a new user successfully', async () => {
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValue('access-token');
      vi.spyOn(tokenService, 'generateRefreshToken').mockResolvedValue('refresh-token');

      const result = await userService.registerUser(
        'New User',
        'newuser@example.com',
        'password123',
        false
      );

      expect(result).toBeDefined();
      expect(result.name).toBe('New User');
      expect(result.email).toBe('newuser@example.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');

      // Verify user was created in database
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user).toBeDefined();
      expect(user?.name).toBe('New User');
    });

    it('should throw error if user already exists', async () => {
      await createTestUser({ email: 'existing@example.com' });

      await expect(
        userService.registerUser('New User', 'existing@example.com', 'password123')
      ).rejects.toThrow('User already exists');
    });

    it('should hash the password', async () => {
      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValue('access-token');
      vi.spyOn(tokenService, 'generateRefreshToken').mockResolvedValue('refresh-token');

      await userService.registerUser('New User', 'newuser@example.com', 'password123');

      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user?.passwordHash).toBeDefined();
      expect(user?.passwordHash).not.toBe('password123');

      // Verify password can be compared
      const isMatch = await bcrypt.compare('password123', user!.passwordHash);
      expect(isMatch).toBe(true);
    });
  });

  describe('loginUser', () => {
    it('should login user with valid credentials', async () => {
      // Create a user with known password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      await createTestUser({
        email: 'test@example.com',
        passwordHash,
      });

      vi.spyOn(tokenService, 'generateAccessToken').mockReturnValue('access-token');
      vi.spyOn(tokenService, 'generateRefreshToken').mockResolvedValue('refresh-token');

      const result = await userService.loginUser('test@example.com', 'password123');

      expect(result).toBeDefined();
      expect(result.email).toBe('test@example.com');
      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('should throw error with invalid email', async () => {
      await expect(
        userService.loginUser('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error with invalid password', async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('password123', salt);
      await createTestUser({
        email: 'test@example.com',
        passwordHash,
      });

      await expect(
        userService.loginUser('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('updateProfile', () => {
    it('should update user profile successfully', async () => {
      const user = await createTestUser();

      const profileData = {
        organizerProfile: {
          displayName: 'Test Organizer',
          bio: 'Test bio',
          slug: 'test-organizer',
        },
      };

      const updatedUser = await userService.updateProfile(
        user._id.toString(),
        profileData
      );

      expect(updatedUser).toBeDefined();
      expect(updatedUser.organizerProfile?.displayName).toBe('Test Organizer');
      expect(updatedUser.organizerProfile?.bio).toBe('Test bio');
      expect(updatedUser.organizerProfile?.slug).toBe('test-organizer');
    });

    it('should throw error if user not found', async () => {
      await expect(
        userService.updateProfile('507f1f77bcf86cd799439011', {})
      ).rejects.toThrow('User not found');
    });

    it('should throw error if slug already taken', async () => {
      const user1 = await createTestUser();
      await userService.updateProfile(user1._id.toString(), {
        organizerProfile: { slug: 'taken-slug' },
      });

      const user2 = await createTestUser({ email: 'user2@example.com' });

      await expect(
        userService.updateProfile(user2._id.toString(), {
          organizerProfile: { slug: 'taken-slug' },
        })
      ).rejects.toThrow('Slug already taken');
    });
  });

  describe('getPublicProfile', () => {
    it('should throw error if organizer not found', async () => {
      await expect(
        userService.getPublicProfile('non-existent-slug')
      ).rejects.toThrow('Organizer not found');
    });
  });

  describe('refreshAccessToken', () => {
    it('should throw error with invalid refresh token', async () => {
      await expect(
        userService.refreshAccessToken('invalid-token', 'test-agent', '127.0.0.1')
      ).rejects.toThrow();
    });
  });

  describe('logoutUser', () => {
    it('should logout user by revoking refresh token', async () => {
      const email = `logout-test-${Date.now()}@example.com`;
      const registerResult = await userService.registerUser(
        'Logout Test',
        email,
        'password123',
        true,
        'test-agent'
      );

      const result = await userService.logoutUser(registerResult.refreshToken!);

      expect(result).toBeDefined();
      expect(result.message).toBe('Logged out successfully');
    });
  });

  describe('logoutAllDevices', () => {
    it('should logout from all devices', async () => {
      const email = `logout-all-test-${Date.now()}@example.com`;
      const registerResult = await userService.registerUser(
        'Logout All Test',
        email,
        'password123',
        true,
        'agent1'
      );

      // Login from another device
      await userService.loginUser(email, 'password123', true, 'agent2', '127.0.0.2');

      const result = await userService.logoutAllDevices(registerResult._id.toString());

      expect(result).toBeDefined();
      expect(result.message).toBe('Logged out from all devices successfully');
    });
  });

  describe('requestPasswordReset', () => {
    it('should send password reset email for existing user', async () => {
      const user = await createTestUser({ email: 'reset@example.com' });

      const result = await userService.requestPasswordReset('reset@example.com');

      expect(result).toBeDefined();
      expect(result.message).toBe('Password reset email sent successfully');
    });

    it('should throw error for non-existent user (security)', async () => {
      await expect(
        userService.requestPasswordReset('nonexistent@example.com')
      ).rejects.toThrow('If an account with that email exists, a password reset link has been sent.');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const user = await createTestUser({ email: 'reset2@example.com' });
      await userService.requestPasswordReset('reset2@example.com');

      // Get the reset token from the user
      const updatedUser = await User.findById(user._id);
      const resetToken = updatedUser!.resetPasswordToken!;

      // Decrypt the token to get the original value
      const crypto = require('crypto');
      // We need to use the raw token, not the hashed one
      // For testing, we'll create a new token
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      updatedUser!.resetPasswordToken = hashedToken;
      updatedUser!.resetPasswordExpires = new Date(Date.now() + 3600000);
      await updatedUser!.save();

      const result = await userService.resetPassword(rawToken, 'newpassword123');

      expect(result).toBeDefined();
      expect(result.message).toBe('Password has been reset successfully');
    });

    it('should throw error with invalid token', async () => {
      await expect(
        userService.resetPassword('invalid-token', 'newpassword123')
      ).rejects.toThrow('Password reset token is invalid or has expired');
    });

    it('should throw error with expired token', async () => {
      const user = await createTestUser({ email: 'expired@example.com' });
      const crypto = require('crypto');
      const rawToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() - 3600000); // Expired 1 hour ago
      await user.save();

      await expect(
        userService.resetPassword(rawToken, 'newpassword123')
      ).rejects.toThrow('Password reset token is invalid or has expired');
    });
  });
});

