import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import ThankYouPage from './ThankYouPage';
import { renderWithProviders } from '~/test/testUtils';

// Mock campaign service
vi.mock('~/services/campaign.service', () => ({
  default: {
    getPublicCampaign: vi.fn(),
  },
}));

// Mock router with proper routeApi
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');

  return {
    ...actual,
    useNavigate: () => vi.fn(),
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
    getRouteApi: () => ({
      useParams: () => ({ slug: 'test-campaign' }),
      useLoaderData: () => ({
        campaign: {
          _id: '1',
          title: 'Test Campaign',
          slug: 'test-campaign',
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
      }),
    }),
  };
});

describe('ThankYouPage', () => {
  it('should render thank you page', () => {
    renderWithProviders(<ThankYouPage />);

    expect(screen.getByText(/Thank You/i)).toBeInTheDocument();
  });

  it('should display success message', () => {
    renderWithProviders(<ThankYouPage />);

    // Use getAllByText since there are multiple instances of "sponsorship"
    const sponsorshipTexts = screen.getAllByText(/sponsorship/i);
    expect(sponsorshipTexts.length).toBeGreaterThan(0);
  });

  it('should have link to campaign', () => {
    renderWithProviders(<ThankYouPage />);

    const link = screen.getByText(/Return to Campaign/i);
    expect(link).toBeInTheDocument();
  });
});

