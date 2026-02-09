import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import PublicCampaign from './PublicCampaign';
import { renderWithProviders, createMockCampaign } from '~/test/testUtils';
import campaignService from '~/services/campaign.service';
import sponsorshipService from '~/services/sponsorship.service';

// Mock services
vi.mock('~/services/campaign.service', () => ({
  default: {
    getPublicCampaign: vi.fn(),
    getLayout: vi.fn(),
  },
}));

vi.mock('~/services/sponsorship.service', () => ({
  default: {
    getPublicSponsors: vi.fn(),
  },
}));

// Mock router with proper routeApi
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    getRouteApi: () => ({
      useParams: () => ({ slug: 'test-campaign' }),
      useLoaderData: () => ({
        campaign: {
          _id: 'campaign-1',
          slug: 'test-campaign',
          title: 'Test Public Campaign',
          description: 'Test description',
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
    }),
  };
});

describe('PublicCampaign', () => {
  const mockCampaign = createMockCampaign({
    _id: 'campaign-1',
    slug: 'test-campaign',
    title: 'Test Public Campaign',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (campaignService.getPublicCampaign as any).mockResolvedValue(mockCampaign);
    (campaignService.getLayout as any).mockResolvedValue(null);
    (sponsorshipService.getPublicSponsors as any).mockResolvedValue([]);
  });

  it('should render public campaign page', async () => {
    renderWithProviders(<PublicCampaign />);

    await waitFor(() => {
      expect(campaignService.getPublicCampaign).toHaveBeenCalledWith('test-campaign');
    });
  });

  it('should display campaign title', async () => {
    renderWithProviders(<PublicCampaign />);

    await waitFor(() => {
      expect(screen.getByText('Test Public Campaign')).toBeInTheDocument();
    });
  });

  it('should load sponsors', async () => {
    renderWithProviders(<PublicCampaign />);

    await waitFor(() => {
      expect(sponsorshipService.getPublicSponsors).toHaveBeenCalledWith('campaign-1');
    });
  });
});

