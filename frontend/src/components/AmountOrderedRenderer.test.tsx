import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import AmountOrderedRenderer from './AmountOrderedRenderer';
import { renderWithProviders, createMockSponsor } from '~/test/testUtils';

describe('AmountOrderedRenderer', () => {
  it('should render "No sponsors yet" message when no sponsors', () => {
    renderWithProviders(
      <AmountOrderedRenderer
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
      <AmountOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="logo-only"
      />
    );

    expect(screen.getByAltText('Approved')).toBeInTheDocument();
    expect(screen.queryByAltText('Pending')).not.toBeInTheDocument();
  });

  it('should group sponsors into single tier when only one price point', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Sponsor 1', amount: 100 }),
      createMockSponsor({ _id: '2', name: 'Sponsor 2', amount: 100 }),
    ];

    renderWithProviders(
      <AmountOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('Sponsor 1')).toBeInTheDocument();
    expect(screen.getByText('Sponsor 2')).toBeInTheDocument();
  });

  it('should group sponsors into two tiers when two price points', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'High Sponsor', amount: 200 }),
      createMockSponsor({ _id: '2', name: 'Low Sponsor', amount: 50 }),
    ];

    renderWithProviders(
      <AmountOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('High Sponsor')).toBeInTheDocument();
    expect(screen.getByText('Low Sponsor')).toBeInTheDocument();
  });

  it('should group sponsors into three tiers when multiple price points', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Highest', amount: 300 }),
      createMockSponsor({ _id: '2', name: 'High', amount: 200 }),
      createMockSponsor({ _id: '3', name: 'Medium', amount: 100 }),
      createMockSponsor({ _id: '4', name: 'Low', amount: 50 }),
    ];

    renderWithProviders(
      <AmountOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('Highest')).toBeInTheDocument();
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Low')).toBeInTheDocument();
  });

  it('should render text sponsors with text-only display type', () => {
    const sponsors = [
      createMockSponsor({ _id: '1', name: 'Text Sponsor', sponsorType: 'text', amount: 100 }),
    ];

    renderWithProviders(
      <AmountOrderedRenderer
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
        logoApprovalStatus: 'approved',
        amount: 100
      }),
    ];

    renderWithProviders(
      <AmountOrderedRenderer
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
        logoApprovalStatus: 'approved',
        amount: 100
      }),
    ];

    renderWithProviders(
      <AmountOrderedRenderer
        sponsors={sponsors}
        sponsorDisplayType="both"
      />
    );

    expect(screen.getByText('Display Name')).toBeInTheDocument();
    expect(screen.getByAltText('Logo Sponsor')).toBeInTheDocument();
  });
});

