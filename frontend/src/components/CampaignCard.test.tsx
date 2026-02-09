import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import CampaignCard from './CampaignCard';
import { renderWithProviders, createMockCampaign } from '~/test/testUtils';

// Mock TanStack Router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CampaignCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render campaign card with title and description', () => {
    const campaign = createMockCampaign({
      title: 'Test Campaign',
      shortDescription: 'This is a test campaign',
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    expect(screen.getByText('This is a test campaign')).toBeInTheDocument();
  });

  it('should show active status for active campaign', () => {
    const campaign = createMockCampaign({
      isClosed: false,
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should show closed status for closed campaign', () => {
    const campaign = createMockCampaign({
      isClosed: true,
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText('Closed')).toBeInTheDocument();
  });

  it('should show ended status for expired campaign', () => {
    const campaign = createMockCampaign({
      isClosed: false,
      endDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText('Ended')).toBeInTheDocument();
  });

  it('should display sponsor count', () => {
    const campaign = createMockCampaign({
      stats: {
        sponsorCount: 5,
        totalPositions: 10,
        claimedPositions: 5,
        remainingPositions: 5,
      },
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText(/5 sponsors/i)).toBeInTheDocument();
  });

  it('should display remaining days', () => {
    const campaign = createMockCampaign({
      isClosed: false,
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText(/3 days remaining/i)).toBeInTheDocument();
  });

  it('should navigate to campaign page when clicked', () => {
    const campaign = createMockCampaign({
      slug: 'test-campaign',
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    const card = screen.getByText('Test Campaign').closest('.ant-card');
    fireEvent.click(card!);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/campaign/test-campaign' });
  });

  it('should navigate when view button is clicked', () => {
    const campaign = createMockCampaign({
      slug: 'test-campaign',
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    const viewButton = screen.getByRole('button', { name: /view campaign/i });
    fireEvent.click(viewButton);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/campaign/test-campaign' });
  });

  it('should display positions filled for non-PWYW campaigns', () => {
    const campaign = createMockCampaign({
      campaignType: 'fixed-price',
      stats: {
        sponsorCount: 5,
        totalPositions: 10,
        claimedPositions: 5,
        remainingPositions: 5,
      },
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.getByText(/5 \/ 10 positions filled/i)).toBeInTheDocument();
    expect(screen.getByText(/\(5 remaining\)/i)).toBeInTheDocument();
  });

  it('should not display positions for PWYW campaigns', () => {
    const campaign = createMockCampaign({
      campaignType: 'pay-what-you-want',
      stats: {
        sponsorCount: 5,
        totalPositions: 10,
        claimedPositions: 5,
        remainingPositions: 5,
      },
    });

    renderWithProviders(<CampaignCard campaign={campaign} />);

    expect(screen.queryByText(/positions filled/i)).not.toBeInTheDocument();
  });
});

