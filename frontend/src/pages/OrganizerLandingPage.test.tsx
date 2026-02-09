import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import OrganizerLandingPage from './OrganizerLandingPage';
import { renderWithProviders, createMockCampaign } from '~/test/testUtils';
import userService from '~/services/user.service';
import authService from '~/services/auth.service';

// Mock services
vi.mock('~/services/user.service', () => ({
  default: {
    getPublicProfile: vi.fn(),
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
    useParams: () => ({ slug: 'test-organizer' }),
    useNavigate: () => vi.fn(),
  };
});

describe('OrganizerLandingPage', () => {
  const mockProfileData = {
    profile: {
      displayName: 'Test Organizer',
      slug: 'test-organizer',
      bio: 'Test bio',
      coverImageUrl: 'https://example.com/cover.jpg',
      logoUrl: 'https://example.com/logo.jpg',
    },
    campaigns: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (authService.getCurrentUser as any).mockReturnValue(null);
    (userService.getPublicProfile as any).mockResolvedValue(mockProfileData);
  });

  it('should render organizer landing page', async () => {
    renderWithProviders(<OrganizerLandingPage />);

    await waitFor(() => {
      expect(userService.getPublicProfile).toHaveBeenCalledWith('test-organizer');
    });
  });

  it('should display organizer name', async () => {
    renderWithProviders(<OrganizerLandingPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Organizer')).toBeInTheDocument();
    });
  });

  it('should load organizer campaigns', async () => {
    renderWithProviders(<OrganizerLandingPage />);

    await waitFor(() => {
      expect(userService.getPublicProfile).toHaveBeenCalledWith('test-organizer');
    });
  });
});

