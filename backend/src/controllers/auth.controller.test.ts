import { describe, it, expect, beforeEach, vi } from 'vitest';
import { register, login, forgotPassword, resetPassword } from './auth.controller';
import { User } from '../models/User';
import { mockRequest, mockResponse, mockNext, createTestUser } from '../test/testUtils';
import * as userService from '../services/user.service';

describe('Auth Controller', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const req = mockRequest({
        body: {
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      // Mock the service
      vi.spyOn(userService, 'registerUser').mockResolvedValue({
        _id: 'user123',
        name: 'New User',
        email: 'newuser@example.com',
        role: 'user',
        token: 'jwt-token',
      } as any);

      await register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'New User',
          email: 'newuser@example.com',
        })
      );
    });

    it('should return 400 if registration fails', async () => {
      const req = mockRequest({
        body: {
          name: 'New User',
          email: 'invalid-email',
          password: 'short',
        },
      });
      const res = mockResponse();

      vi.spyOn(userService, 'registerUser').mockRejectedValue(
        new Error('Email already exists')
      );

      await register(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Email already exists',
        })
      );
    });
  });

  describe('login', () => {
    it('should login user with valid credentials', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'password123',
        },
      });
      const res = mockResponse();

      vi.spyOn(userService, 'loginUser').mockResolvedValue({
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user',
        token: 'jwt-token',
      } as any);

      await login(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          token: 'jwt-token',
        })
      );
    });

    it('should return 401 with invalid credentials', async () => {
      const req = mockRequest({
        body: {
          email: 'test@example.com',
          password: 'wrongpassword',
        },
      });
      const res = mockResponse();

      vi.spyOn(userService, 'loginUser').mockRejectedValue(
        new Error('Invalid credentials')
      );

      await login(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Invalid credentials',
        })
      );
    });
  });

  describe('forgotPassword', () => {
    it('should always return 200 to prevent email enumeration', async () => {
      const req = mockRequest({
        body: {
          email: 'nonexistent@example.com',
        },
      });
      const res = mockResponse();

      vi.spyOn(userService, 'requestPasswordReset').mockRejectedValue(
        new Error('User not found')
      );

      await forgotPassword(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('password reset link'),
        })
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      const req = mockRequest({
        body: {
          token: 'valid-reset-token',
          password: 'newpassword123',
        },
      });
      const res = mockResponse();

      vi.spyOn(userService, 'resetPassword').mockResolvedValue({
        message: 'Password reset successful',
      } as any);

      await resetPassword(req as any, res as any);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Password reset successful',
        })
      );
    });
  });
});

