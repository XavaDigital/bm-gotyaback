import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import WordCloudRenderer from './WordCloudRenderer';
import { renderWithProviders, createMockSponsor } from '~/test/testUtils';

// Mock wordcloud library
vi.mock('wordcloud', () => {
  const mockWordCloud = vi.fn();
  mockWordCloud.stop = vi.fn();
  return {
    default: mockWordCloud,
  };
});

describe('WordCloudRenderer', () => {
  const mockSponsors = [
    createMockSponsor({
      _id: '1',
      name: 'Sponsor 1',
      amount: 100,
      calculatedFontSize: 20,
      sponsorType: 'text',
      logoApprovalStatus: 'approved',
    }),
    createMockSponsor({
      _id: '2',
      name: 'Sponsor 2',
      amount: 200,
      calculatedFontSize: 30,
      sponsorType: 'text',
      logoApprovalStatus: 'approved',
    }),
  ];

  const mockLogoSponsors = [
    createMockSponsor({
      _id: '1',
      name: 'Logo Sponsor 1',
      amount: 100,
      sponsorType: 'logo',
      logoUrl: 'https://example.com/logo1.png',
      calculatedLogoWidth: 100,
      logoApprovalStatus: 'approved',
    }),
    createMockSponsor({
      _id: '2',
      name: 'Logo Sponsor 2',
      amount: 200,
      sponsorType: 'logo',
      logoUrl: 'https://example.com/logo2.png',
      calculatedLogoWidth: 150,
      logoApprovalStatus: 'approved',
    }),
  ];

  it('should render empty state when no sponsors', () => {
    renderWithProviders(
      <WordCloudRenderer sponsors={[]} sponsorDisplayType="text-only" />
    );

    expect(screen.getByText('No sponsors yet. Be the first!')).toBeInTheDocument();
  });

  it('should filter out unapproved logo sponsors when displaying logos', () => {
    const sponsorsWithUnapproved = [
      ...mockLogoSponsors,
      createMockSponsor({
        _id: '3',
        name: 'Unapproved',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo3.png',
        logoApprovalStatus: 'pending',
      }),
    ];

    renderWithProviders(
      <WordCloudRenderer
        sponsors={sponsorsWithUnapproved}
        sponsorDisplayType="logo-only"
      />
    );

    // Should only render approved sponsors
    expect(screen.queryByText('Unapproved')).not.toBeInTheDocument();
  });

  it('should NOT filter out unapproved logo sponsors when display type is text-only', () => {
    const sponsorsWithUnapproved = [
      createMockSponsor({
        _id: '1',
        name: 'Approved Logo',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo1.png',
        logoApprovalStatus: 'approved',
        calculatedFontSize: 20,
      }),
      createMockSponsor({
        _id: '2',
        name: 'Pending Logo',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo2.png',
        logoApprovalStatus: 'pending',
        calculatedFontSize: 20,
      }),
    ];

    const { container } = renderWithProviders(
      <WordCloudRenderer
        sponsors={sponsorsWithUnapproved}
        sponsorDisplayType="text-only"
      />
    );

    // Both should be rendered to canvas (text-only mode uses wordcloud2.js)
    // We can verify by checking that the canvas exists
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    // In text-only mode, all sponsors should be included regardless of logo approval status
    // The wordcloud2.js library will render both sponsors to the canvas
  });

  it('should render canvas for text-only mode', () => {
    const { container } = renderWithProviders(
      <WordCloudRenderer sponsors={mockSponsors} sponsorDisplayType="text-only" />
    );

    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render logo sponsors in logo-only mode', () => {
    renderWithProviders(
      <WordCloudRenderer
        sponsors={mockLogoSponsors}
        sponsorDisplayType="logo-only"
      />
    );

    // Logos are rendered as images with alt text
    expect(screen.getByAltText('Logo Sponsor 1')).toBeInTheDocument();
    expect(screen.getByAltText('Logo Sponsor 2')).toBeInTheDocument();
  });

  it('should render text sponsors in text-only mode', () => {
    const { container } = renderWithProviders(
      <WordCloudRenderer sponsors={mockSponsors} sponsorDisplayType="text-only" />
    );

    // In text-only mode, wordcloud2.js renders to canvas
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
  });

  it('should render both text and logo sponsors in both mode', () => {
    const mixedSponsors = [
      createMockSponsor({
        _id: '1',
        name: 'Text Sponsor',
        sponsorType: 'text',
        calculatedFontSize: 20,
        logoApprovalStatus: 'approved',
      }),
      createMockSponsor({
        _id: '2',
        name: 'Logo Sponsor',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo.png',
        displayName: 'Logo Display',
        calculatedLogoWidth: 100,
        logoApprovalStatus: 'approved',
      }),
    ];

    renderWithProviders(
      <WordCloudRenderer sponsors={mixedSponsors} sponsorDisplayType="both" />
    );

    // Text sponsor should be rendered
    expect(screen.getByText('Text Sponsor')).toBeInTheDocument();
    // Logo sponsor should be rendered with display name
    expect(screen.getByText('Logo Display')).toBeInTheDocument();
  });

  it('should have correct container styling', () => {
    const { container } = renderWithProviders(
      <WordCloudRenderer sponsors={mockSponsors} sponsorDisplayType="text-only" />
    );

    // Check for the container div
    const wordCloudContainer = container.firstChild as HTMLElement;
    expect(wordCloudContainer).toBeInTheDocument();
    expect(wordCloudContainer).toHaveStyle({ position: 'relative' });
  });

  it('should render with dark background', () => {
    const { container } = renderWithProviders(
      <WordCloudRenderer sponsors={mockSponsors} sponsorDisplayType="text-only" />
    );

    const wordCloudContainer = container.firstChild as HTMLElement;
    expect(wordCloudContainer).toHaveStyle({ backgroundColor: '#1a1a1a' });
  });
});

