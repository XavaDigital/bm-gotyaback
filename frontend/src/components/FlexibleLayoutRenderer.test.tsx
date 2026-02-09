import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import FlexibleLayoutRenderer from './FlexibleLayoutRenderer';
import { renderWithProviders, createMockSponsor } from '~/test/testUtils';

// Mock the child renderers
vi.mock('./SizeOrderedRenderer', () => ({
  default: ({ sponsors }: any) => <div data-testid="size-ordered-renderer">Size Ordered: {sponsors.length} sponsors</div>,
}));

vi.mock('./AmountOrderedRenderer', () => ({
  default: ({ sponsors }: any) => <div data-testid="amount-ordered-renderer">Amount Ordered: {sponsors.length} sponsors</div>,
}));

vi.mock('./WordCloudRenderer', () => ({
  default: ({ sponsors }: any) => <div data-testid="word-cloud-renderer">Word Cloud: {sponsors.length} sponsors</div>,
}));

describe('FlexibleLayoutRenderer', () => {
  const mockSponsors = [
    createMockSponsor({ _id: '1', name: 'Sponsor 1', amount: 100 }),
    createMockSponsor({ _id: '2', name: 'Sponsor 2', amount: 50 }),
  ];

  it('should render SizeOrderedRenderer for size-ordered layout', () => {
    renderWithProviders(
      <FlexibleLayoutRenderer
        sponsors={mockSponsors}
        layoutStyle="size-ordered"
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByTestId('size-ordered-renderer')).toBeInTheDocument();
    expect(screen.getByText(/Size Ordered: 2 sponsors/)).toBeInTheDocument();
  });

  it('should render AmountOrderedRenderer for amount-ordered layout', () => {
    renderWithProviders(
      <FlexibleLayoutRenderer
        sponsors={mockSponsors}
        layoutStyle="amount-ordered"
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByTestId('amount-ordered-renderer')).toBeInTheDocument();
    expect(screen.getByText(/Amount Ordered: 2 sponsors/)).toBeInTheDocument();
  });

  it('should render WordCloudRenderer for word-cloud layout', () => {
    renderWithProviders(
      <FlexibleLayoutRenderer
        sponsors={mockSponsors}
        layoutStyle="word-cloud"
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByTestId('word-cloud-renderer')).toBeInTheDocument();
    expect(screen.getByText(/Word Cloud: 2 sponsors/)).toBeInTheDocument();
  });

  it('should fallback to AmountOrderedRenderer for grid layout', () => {
    renderWithProviders(
      <FlexibleLayoutRenderer
        sponsors={mockSponsors}
        layoutStyle="grid"
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByTestId('amount-ordered-renderer')).toBeInTheDocument();
  });

  it('should pass campaignType to SizeOrderedRenderer', () => {
    renderWithProviders(
      <FlexibleLayoutRenderer
        sponsors={mockSponsors}
        layoutStyle="size-ordered"
        sponsorDisplayType="logo-only"
        campaignType="fixed"
      />
    );

    expect(screen.getByTestId('size-ordered-renderer')).toBeInTheDocument();
  });

  it('should pass sponsorDisplayType to renderers', () => {
    renderWithProviders(
      <FlexibleLayoutRenderer
        sponsors={mockSponsors}
        layoutStyle="word-cloud"
        sponsorDisplayType="both"
      />
    );

    expect(screen.getByTestId('word-cloud-renderer')).toBeInTheDocument();
  });
});

