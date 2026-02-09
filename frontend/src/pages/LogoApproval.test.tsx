import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import LogoApproval from './LogoApproval';
import { renderWithProviders } from '~/test/testUtils';
import sponsorshipService from '~/services/sponsorship.service';
import campaignService from '~/services/campaign.service';

// Mock services
vi.mock('~/services/sponsorship.service', () => ({
  default: {
    getPendingLogos: vi.fn(),
    approveLogo: vi.fn(),
    approveAllLogos: vi.fn(),
  },
}));

vi.mock('~/services/campaign.service', () => ({
  default: {
    getCampaignById: vi.fn(),
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

describe('LogoApproval', () => {
  const mockCampaign = {
    _id: 'campaign-1',
    title: 'Test Campaign',
    slug: 'test-campaign',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (campaignService.getCampaignById as any).mockResolvedValue(mockCampaign);
    (sponsorshipService.getPendingLogos as any).mockResolvedValue([]);
  });

  it('should render logo approval page', async () => {
    renderWithProviders(<LogoApproval />);

    await waitFor(() => {
      expect(screen.getByText(/Logo Approval - Test Campaign/i)).toBeInTheDocument();
    });
  });

  it('should load pending logos', async () => {
    renderWithProviders(<LogoApproval />);

    await waitFor(() => {
      expect(sponsorshipService.getPendingLogos).toHaveBeenCalledWith('campaign-1');
    });
  });

  it('should show empty state when no pending logos', async () => {
    renderWithProviders(<LogoApproval />);

    await waitFor(() => {
      expect(screen.getByText(/No pending logo approvals/i)).toBeInTheDocument();
    });
  });
});

