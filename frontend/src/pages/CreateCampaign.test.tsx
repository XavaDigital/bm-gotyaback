import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import CreateCampaign from './CreateCampaign';
import { renderWithProviders } from '~/test/testUtils';
import campaignService from '~/services/campaign.service';

// Mock services
vi.mock('~/services/campaign.service', () => ({
  default: {
    createCampaign: vi.fn(),
    createLayout: vi.fn(),
  },
}));

// Mock router
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('CreateCampaign', () => {
  it('should render create campaign page', () => {
    renderWithProviders(<CreateCampaign />);

    expect(screen.getByText(/Create Campaign/i)).toBeInTheDocument();
  });

  it('should render campaign wizard', () => {
    renderWithProviders(<CreateCampaign />);

    expect(screen.getByText('Basic Info')).toBeInTheDocument();
  });

  it('should have campaign form fields', () => {
    renderWithProviders(<CreateCampaign />);

    expect(screen.getByLabelText(/Campaign Title/i)).toBeInTheDocument();
  });
});

