import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock vinxi/http module
const mockUpdate = vi.fn();
const mockSessionData = { userId: undefined, token: undefined, user: undefined };

vi.mock('vinxi/http', () => ({
  useSession: vi.fn(() => ({
    data: mockSessionData,
    update: mockUpdate,
  })),
}));

// Import after mocking
import { setUserSession, clearUserSession, getCurrentUserFromSession, isAuthenticatedServer } from './session';

describe('Session Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionData.userId = undefined;
    mockSessionData.token = undefined;
    mockSessionData.user = undefined;
  });

  describe('setUserSession', () => {
    it('should set user session data', async () => {
      const userData = {
        _id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        token: 'test-token',
      };

      await setUserSession(userData);

      expect(mockUpdate).toHaveBeenCalledWith({
        userId: 'user-123',
        token: 'test-token',
        user: userData,
      });
    });
  });

  describe('clearUserSession', () => {
    it('should clear user session', async () => {
      await clearUserSession();

      expect(mockUpdate).toHaveBeenCalledWith({
        userId: undefined,
        token: undefined,
        user: undefined,
      });
    });
  });

  describe('getCurrentUserFromSession', () => {
    it('should return user from session', async () => {
      const userData = {
        _id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        token: 'test-token',
      };
      mockSessionData.user = userData;

      const result = await getCurrentUserFromSession();

      expect(result).toEqual(userData);
    });

    it('should return null when no user in session', async () => {
      mockSessionData.user = undefined;

      const result = await getCurrentUserFromSession();

      expect(result).toBeNull();
    });
  });

  describe('isAuthenticatedServer', () => {
    it('should return true when user and token exist', async () => {
      mockSessionData.token = 'test-token';
      mockSessionData.user = {
        _id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        token: 'test-token',
      };

      const result = await isAuthenticatedServer();

      expect(result).toBe(true);
    });

    it('should return false when token is missing', async () => {
      mockSessionData.user = {
        _id: 'user-123',
        name: 'Test User',
        email: 'user@example.com',
        token: 'test-token',
      };

      const result = await isAuthenticatedServer();

      expect(result).toBe(false);
    });

    it('should return false when user is missing', async () => {
      mockSessionData.token = 'test-token';

      const result = await isAuthenticatedServer();

      expect(result).toBe(false);
    });

    it('should return false when both are missing', async () => {
      const result = await isAuthenticatedServer();

      expect(result).toBe(false);
    });
  });
});

