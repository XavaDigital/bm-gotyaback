import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import ProfileSettings from './ProfileSettings';
import { renderWithProviders } from '~/test/testUtils';
import userService from '~/services/user.service';
import authService from '~/services/auth.service';

// Mock services
vi.mock('~/services/user.service', () => ({
  default: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
  },
}));

vi.mock('~/services/auth.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
  },
}));

// Mock router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('ProfileSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authService.getCurrentUser as any).mockReturnValue({
      _id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
      organizerProfile: {
        displayName: 'Test User',
        slug: 'test-user',
        bio: 'Test bio',
      },
    });
    (userService.getProfile as any).mockResolvedValue({
      name: 'Test User',
      email: 'test@example.com',
    });
  });

  it('should render profile settings page', async () => {
    renderWithProviders(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByText(/Organizer Profile Settings/i)).toBeInTheDocument();
    });
  });

  it('should load user profile', async () => {
    renderWithProviders(<ProfileSettings />);

    await waitFor(() => {
      expect(authService.getCurrentUser).toHaveBeenCalled();
    });
  });

  it('should display user information', async () => {
    renderWithProviders(<ProfileSettings />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
    });
  });
});

