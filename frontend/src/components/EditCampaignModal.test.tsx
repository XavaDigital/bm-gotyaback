import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import EditCampaignModal from './EditCampaignModal';
import { renderWithProviders, createMockCampaign } from '~/test/testUtils';
import campaignService from '~/services/campaign.service';
import sponsorshipService from '~/services/sponsorship.service';

// Mock services
vi.mock('~/services/campaign.service', () => ({
  default: {
    getLayout: vi.fn(),
    updateCampaign: vi.fn(),
  },
}));

vi.mock('~/services/sponsorship.service', () => ({
  default: {
    getSponsors: vi.fn(),
  },
}));

describe('EditCampaignModal', () => {
  const mockOnCancel = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockCampaign = createMockCampaign({
    _id: 'campaign-1',
    title: 'Test Campaign',
    shortDescription: 'Test Description',
    campaignType: 'fixed',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (sponsorshipService.getSponsors as any).mockResolvedValue([]);
    (campaignService.getLayout as any).mockResolvedValue(null);
  });

  it('should not render when not visible', () => {
    renderWithProviders(
      <EditCampaignModal
        visible={false}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    expect(screen.queryByText('Edit Campaign')).not.toBeInTheDocument();
  });

  it('should render modal when visible', async () => {
    renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Campaign')).toBeInTheDocument();
    });
  });

  it('should load campaign data when visible', async () => {
    renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    await waitFor(() => {
      expect(sponsorshipService.getSponsors).toHaveBeenCalledWith('campaign-1');
    });
  });

  it('should check for sponsors on mount', async () => {
    (sponsorshipService.getSponsors as any).mockResolvedValue([
      { _id: 'sponsor-1', name: 'Test Sponsor' },
    ]);

    renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    await waitFor(() => {
      expect(sponsorshipService.getSponsors).toHaveBeenCalled();
    });
  });

  it('should load layout for positional campaigns', async () => {
    const positionalCampaign = createMockCampaign({
      _id: 'campaign-2',
      campaignType: 'positional',
    });

    (campaignService.getLayout as any).mockResolvedValue({
      totalPositions: 10,
      columns: 5,
    });

    renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={positionalCampaign}
      />
    );

    await waitFor(() => {
      expect(campaignService.getLayout).toHaveBeenCalledWith('campaign-2');
    });
  });

  it('should render CampaignWizard in edit mode', async () => {
    renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Basic Info')).toBeInTheDocument();
    });
  });

  it('should handle null campaign gracefully', () => {
    renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={null}
      />
    );

    // Should not crash
    expect(screen.queryByText('Edit Campaign')).toBeInTheDocument();
  });

  it('should reset state when modal closes', async () => {
    const { rerender } = renderWithProviders(
      <EditCampaignModal
        visible={true}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    await waitFor(() => {
      expect(screen.getByText('Edit Campaign')).toBeInTheDocument();
    });

    rerender(
      <EditCampaignModal
        visible={false}
        onCancel={mockOnCancel}
        onSuccess={mockOnSuccess}
        campaign={mockCampaign}
      />
    );

    expect(screen.queryByText('Edit Campaign')).not.toBeInTheDocument();
  });
});

