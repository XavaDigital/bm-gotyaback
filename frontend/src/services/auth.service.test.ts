import { describe, it, expect, vi, beforeEach } from 'vitest';
import authService from './auth.service';
import apiClient from './apiClient';
import { createMockUser, mockApiResponse, clearAuth } from '~/test/testUtils';

// Mock apiClient
vi.mock('./apiClient');

describe('Auth Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
  });

  describe('register', () => {
    it('should register a new user and store credentials', async () => {
      const mockUser = createMockUser();
      const mockResponse = mockApiResponse({
        ...mockUser,
        token: 'test-token',
      });

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.register(userData);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data));
    });

    it('should handle registration error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Registration failed'));

      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await expect(authService.register(userData)).rejects.toThrow('Registration failed');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('login', () => {
    it('should login user and store credentials', async () => {
      const mockUser = createMockUser();
      const mockResponse = mockApiResponse({
        ...mockUser,
        token: 'test-token',
      });

      vi.spyOn(apiClient, 'post').mockResolvedValue(mockResponse);

      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await authService.login(credentials);

      expect(apiClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('test-token');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockResponse.data));
    });

    it('should handle login error', async () => {
      vi.spyOn(apiClient, 'post').mockRejectedValue(new Error('Invalid credentials'));

      const credentials = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('logout', () => {
    it('should clear localStorage and redirect', async () => {
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('user', JSON.stringify(createMockUser()));

      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      await authService.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(window.location.href).toBe('/login');
    });
  });

  describe('getCurrentUser', () => {
    it('should return user from localStorage', () => {
      const mockUser = createMockUser();
      const userWithToken = { ...mockUser, token: 'test-token' };
      localStorage.setItem('user', JSON.stringify(userWithToken));

      const result = authService.getCurrentUser();

      expect(result).toEqual(userWithToken);
    });

    it('should return null if no user in localStorage', () => {
      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });

    it('should return null if user data is invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json');

      const result = authService.getCurrentUser();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true if user is authenticated', () => {
      const mockUser = createMockUser();
      localStorage.setItem('user', JSON.stringify({ ...mockUser, token: 'test-token' }));

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
    });

    it('should return false if user is not authenticated', () => {
      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});

