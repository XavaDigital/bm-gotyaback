import { describe, it, expect, vi, beforeEach } from 'vitest';
import { requireAuth, requireGuest, requireAdmin } from './auth-helpers';

// Mock @tanstack/react-router
vi.mock('@tanstack/react-router', () => ({
  redirect: vi.fn((options) => {
    throw new Error(`Redirect to ${options.to}`);
  }),
}));

describe('Auth Helpers', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should not throw when user and token exist', async () => {
      const user = { _id: 'user-123', email: 'user@example.com', name: 'Test User' };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'test-token');

      await expect(requireAuth()).resolves.not.toThrow();
    });

    it('should throw redirect when user is missing', async () => {
      localStorage.setItem('token', 'test-token');

      await expect(requireAuth()).rejects.toThrow('Redirect to /login');
    });

    it('should throw redirect when token is missing', async () => {
      const user = { _id: 'user-123', email: 'user@example.com', name: 'Test User' };
      localStorage.setItem('user', JSON.stringify(user));

      await expect(requireAuth()).rejects.toThrow('Redirect to /login');
    });

    it('should throw redirect when both user and token are missing', async () => {
      await expect(requireAuth()).rejects.toThrow('Redirect to /login');
    });
  });

  describe('requireGuest', () => {
    it('should not throw when user is not logged in', async () => {
      await expect(requireGuest()).resolves.not.toThrow();
    });

    it('should throw redirect when user is logged in', async () => {
      const user = { _id: 'user-123', email: 'user@example.com', name: 'Test User' };
      localStorage.setItem('user', JSON.stringify(user));

      await expect(requireGuest()).rejects.toThrow('Redirect to /');
    });
  });

  describe('requireAdmin', () => {
    it('should not throw when admin user and token exist', async () => {
      const user = { _id: 'user-123', email: 'admin@example.com', name: 'Admin', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'test-token');

      await expect(requireAdmin()).resolves.not.toThrow();
    });

    it('should throw redirect to login when user is missing', async () => {
      localStorage.setItem('token', 'test-token');

      await expect(requireAdmin()).rejects.toThrow('Redirect to /login');
    });

    it('should throw redirect to login when token is missing', async () => {
      const user = { _id: 'user-123', email: 'admin@example.com', name: 'Admin', role: 'admin' };
      localStorage.setItem('user', JSON.stringify(user));

      await expect(requireAdmin()).rejects.toThrow('Redirect to /login');
    });

    it('should throw redirect to home when user is not admin', async () => {
      const user = { _id: 'user-123', email: 'user@example.com', name: 'User', role: 'user' };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'test-token');

      await expect(requireAdmin()).rejects.toThrow('Redirect to /');
    });

    it('should throw redirect to home when user has no role', async () => {
      const user = { _id: 'user-123', email: 'user@example.com', name: 'User' };
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('token', 'test-token');

      await expect(requireAdmin()).rejects.toThrow('Redirect to /');
    });
  });
});

