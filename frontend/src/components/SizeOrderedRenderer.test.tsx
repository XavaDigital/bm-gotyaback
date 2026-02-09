import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import SizeOrderedRenderer from './SizeOrderedRenderer';
import { renderWithProviders, createMockSponsor } from '~/test/testUtils';

describe('SizeOrderedRenderer', () => {
  it('should render "No sponsors yet" message when no sponsors', () => {
    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={[]}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText(/No sponsors yet/i)).toBeInTheDocument();
  });

  it('should filter out unapproved logo sponsors', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Approved', sponsorType: 'logo', logoUrl: 'logo.png', logoApprovalStatus: 'approved' }),
      createMockSponsor({ _id: '2', name: 'Pending', sponsorType: 'logo', logoUrl: 'logo.png', logoApprovalStatus: 'pending' }),
    ];

    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="logo-only"
      />
    );

    expect(screen.getByAltText('Approved')).toBeInTheDocument();
    expect(screen.queryByAltText('Pending')).not.toBeInTheDocument();
  });

  it('should sort sponsors by position ID for fixed campaigns', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Sponsor 3', positionId: '3' }),
      createMockSponsor({ _id: '2', name: 'Sponsor 1', positionId: '1' }),
      createMockSponsor({ _id: '3', name: 'Sponsor 2', positionId: '2' }),
    ];

    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
        campaignType="fixed"
      />
    );

    const sponsorElements = screen.getAllByText(/Sponsor \d/);
    expect(sponsorElements[0]).toHaveTextContent('Sponsor 1');
    expect(sponsorElements[1]).toHaveTextContent('Sponsor 2');
    expect(sponsorElements[2]).toHaveTextContent('Sponsor 3');
  });

  it('should sort sponsors by position ID in reverse for positional campaigns', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Sponsor 1', positionId: '1' }),
      createMockSponsor({ _id: '2', name: 'Sponsor 3', positionId: '3' }),
      createMockSponsor({ _id: '3', name: 'Sponsor 2', positionId: '2' }),
    ];

    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
        campaignType="positional"
      />
    );

    const sponsorElements = screen.getAllByText(/Sponsor \d/);
    expect(sponsorElements[0]).toHaveTextContent('Sponsor 3');
    expect(sponsorElements[1]).toHaveTextContent('Sponsor 2');
    expect(sponsorElements[2]).toHaveTextContent('Sponsor 1');
  });

  it('should render text sponsors with text-only display type', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Text Sponsor', sponsorType: 'text' }),
    ];

    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('Text Sponsor')).toBeInTheDocument();
  });

  it('should render logo sponsors with logo-only display type', () => {
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Logo Sponsor', 
        sponsorType: 'logo', 
        logoUrl: 'https://example.com/logo.png',
        logoApprovalStatus: 'approved'
      }),
    ];

    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="logo-only"
      />
    );

    const logo = screen.getByAltText('Logo Sponsor');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('should render logo with name when displayName is provided and display type is both', () => {
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Logo Sponsor',
        displayName: 'Display Name',
        sponsorType: 'logo', 
        logoUrl: 'https://example.com/logo.png',
        logoApprovalStatus: 'approved'
      }),
    ];

    renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="both"
      />
    );

    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByAltText('Logo Sponsor')).toBeInTheDocument();
  });

  it('should apply simple list style for fixed campaigns', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Sponsor 1' }),
    ];

    const { container } = renderWithProviders(
      <SizeOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
        campaignType="fixed"
      />
    );

    // Simple list should have transparent background
    const sponsorCard = container.querySelector('[style*="transparent"]');
    expect(sponsorCard).toBeInTheDocument();
  });
});

