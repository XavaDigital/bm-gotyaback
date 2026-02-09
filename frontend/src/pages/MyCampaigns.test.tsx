import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import MyCampaigns from './MyCampaigns';
import { renderWithProviders, createMockCampaign } from '~/test/testUtils';
import campaignService from '~/services/campaign.service';

// Mock services
vi.mock('~/services/campaign.service', () => ({
  default: {
    getMyCampaigns: vi.fn(),
    deleteCampaign: vi.fn(),
  },
}));

// Mock the route file
vi.mock('~/routes/dashboard.index', () => ({
  Route: {
    useLoaderData: () => [],
  },
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe('MyCampaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (campaignService.getMyCampaigns as any).mockResolvedValue([]);
  });

  it('should render my campaigns page', async () => {
    renderWithProviders(<MyCampaigns />);

    await waitFor(() => {
      expect(screen.getByText(/No campaigns yet/i)).toBeInTheDocument();
    });
  });

  it('should load campaigns on mount', async () => {
    const mockCampaigns = [
      createMockCampaign({ _id: '1', title: 'Campaign 1' }),
      createMockCampaign({ _id: '2', title: 'Campaign 2' }),
    ];
    (campaignService.getMyCampaigns as any).mockResolvedValue(mockCampaigns);

    renderWithProviders(<MyCampaigns />);

    await waitFor(() => {
      expect(campaignService.getMyCampaigns).toHaveBeenCalled();
    });
  });

  it('should display campaigns', async () => {
    const mockCampaigns = [
      createMockCampaign({ _id: '1', title: 'Test Campaign 1' }),
      createMockCampaign({ _id: '2', title: 'Test Campaign 2' }),
    ];
    (campaignService.getMyCampaigns as any).mockResolvedValue(mockCampaigns);

    renderWithProviders(<MyCampaigns />);

    await waitFor(() => {
      expect(screen.getByText('Test Campaign 1')).toBeInTheDocument();
      expect(screen.getByText('Test Campaign 2')).toBeInTheDocument();
    });
  });

  it('should show empty state when no campaigns', async () => {
    (campaignService.getMyCampaigns as any).mockResolvedValue([]);

    renderWithProviders(<MyCampaigns />);

    await waitFor(() => {
      expect(screen.getByText(/No campaigns yet/i)).toBeInTheDocument();
    });
  });

  it('should have create campaign button', async () => {
    renderWithProviders(<MyCampaigns />);

    await waitFor(() => {
      expect(screen.getByText(/Create Your First Campaign/i)).toBeInTheDocument();
    });
  });
});

