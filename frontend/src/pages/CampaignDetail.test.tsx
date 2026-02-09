import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import CampaignDetail from './CampaignDetail';
import { renderWithProviders, createMockCampaign } from '~/test/testUtils';
import campaignService from '~/services/campaign.service';
import sponsorshipService from '~/services/sponsorship.service';

// Mock services
vi.mock('~/services/campaign.service', () => ({
  default: {
    getCampaignById: vi.fn(),
    getLayout: vi.fn(),
  },
}));

vi.mock('~/services/sponsorship.service', () => ({
  default: {
    getSponsors: vi.fn(),
    getPendingLogos: vi.fn(),
  },
}));

// Mock the route file
vi.mock('~/routes/campaigns.$id.index', () => ({
  Route: {
    useLoaderData: () => ({
      campaign: {
        _id: 'campaign-1',
        title: 'Test Campaign',
        slug: 'test-campaign',
        description: 'Test description',
        ownerId: 'user-123',
        campaignType: 'fixed',
        garmentType: 'tshirt',
        isClosed: false,
        pricingConfig: { fixedPrice: 25 },
        enableStripePayments: false,
        allowOfflinePayments: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      sponsors: [],
      layout: null,
    }),
  },
}));

// Mock router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useParams: () => ({ id: 'campaign-1' }),
    useNavigate: () => vi.fn(),
  };
});

describe('CampaignDetail', () => {
  const mockCampaign = createMockCampaign({
    _id: 'campaign-1',
    title: 'Test Campaign',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (campaignService.getCampaignById as any).mockResolvedValue(mockCampaign);
    (campaignService.getLayout as any).mockResolvedValue(null);
    (sponsorshipService.getSponsors as any).mockResolvedValue([]);
    (sponsorshipService.getPendingLogos as any).mockResolvedValue([]);
  });

  it('should render campaign detail page', async () => {
    renderWithProviders(<CampaignDetail />);

    await waitFor(() => {
      expect(campaignService.getCampaignById).toHaveBeenCalledWith('campaign-1');
    });
  });

  it('should display campaign title', async () => {
    renderWithProviders(<CampaignDetail />);

    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });
  });

  it('should load sponsors', async () => {
    renderWithProviders(<CampaignDetail />);

    await waitFor(() => {
      expect(sponsorshipService.getSponsors).toHaveBeenCalledWith('campaign-1');
    });
  });
});

