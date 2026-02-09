import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import GridLayoutRenderer from './GridLayoutRenderer';
import { renderWithProviders, createMockSponsor } from '~/test/testUtils';
import type { ShirtLayout } from '~/types/campaign.types';

describe('GridLayoutRenderer', () => {
  const createMockLayout = (overrides?: Partial<ShirtLayout>): ShirtLayout => ({
    _id: 'layout-1',
    campaignId: 'campaign-1',
    layoutType: 'grid',
    columns: 3,
    placements: [
      { positionId: '1', price: 100, isTaken: false },
      { positionId: '2', price: 100, isTaken: false },
      { positionId: '3', price: 100, isTaken: false },
    ],
    ...overrides,
  });

  it('should render grid with correct number of columns', () => {
    const layout = createMockLayout({ columns: 3 });

    const { container } = renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={[]}
        sponsorDisplayType="text-only"
      />
    );

    const grid = container.querySelector('[style*="grid-template-columns"]');
    expect(grid).toBeInTheDocument();
  });

  it('should render available positions with "Available" text', () => {
    const layout = createMockLayout();

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={[]}
        sponsorDisplayType="text-only"
      />
    );

    const availableTexts = screen.getAllByText('Available');
    expect(availableTexts).toHaveLength(3);
  });

  it('should render position numbers for available positions', () => {
    const layout = createMockLayout();

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={[]}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('#2')).toBeInTheDocument();
    expect(screen.getByText('#3')).toBeInTheDocument();
  });

  it('should render reserved positions', () => {
    const layout = createMockLayout({
      placements: [
        { positionId: '1', price: 100, isTaken: true },
      ],
    });

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={[]}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('Reserved')).toBeInTheDocument();
  });

  it('should render sponsor in correct position', () => {
    const layout = createMockLayout();
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Test Sponsor', 
        positionId: '1',
        paymentStatus: 'paid',
        sponsorType: 'text'
      }),
    ];

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={sponsors}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('Test Sponsor')).toBeInTheDocument();
  });

  it('should only render paid sponsors', () => {
    const layout = createMockLayout();
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Paid Sponsor', 
        positionId: '1',
        paymentStatus: 'paid'
      }),
      createMockSponsor({ 
        _id: '2', 
        name: 'Pending Sponsor', 
        positionId: '2',
        paymentStatus: 'pending'
      }),
    ];

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={sponsors}
        sponsorDisplayType="text-only"
      />
    );

    expect(screen.getByText('Paid Sponsor')).toBeInTheDocument();
    expect(screen.queryByText('Pending Sponsor')).not.toBeInTheDocument();
  });

  it('should render logo sponsor with approved logo', () => {
    const layout = createMockLayout();
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Logo Sponsor',
        positionId: '1',
        paymentStatus: 'paid',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo.png',
        logoApprovalStatus: 'approved'
      }),
    ];

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={sponsors}
        sponsorDisplayType="logo-only"
      />
    );

    const logo = screen.getByAltText('Logo Sponsor');
    expect(logo).toBeInTheDocument();
  });

  it('should show pending approval for unapproved logos', () => {
    const layout = createMockLayout();
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Logo Sponsor',
        positionId: '1',
        paymentStatus: 'paid',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo.png',
        logoApprovalStatus: 'pending'
      }),
    ];

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={sponsors}
        sponsorDisplayType="logo-only"
      />
    );

    expect(screen.getByText(/Pending/)).toBeInTheDocument();
    expect(screen.getByText(/Approval/)).toBeInTheDocument();
  });

  it('should render logo with name when display type is both', () => {
    const layout = createMockLayout();
    const sponsors = [
      createMockSponsor({ 
        _id: '1', 
        name: 'Logo Sponsor',
        displayName: 'Display Name',
        positionId: '1',
        paymentStatus: 'paid',
        sponsorType: 'logo',
        logoUrl: 'https://example.com/logo.png',
        logoApprovalStatus: 'approved'
      }),
    ];

    renderWithProviders(
      <GridLayoutRenderer
        layout={layout}
        sponsors={sponsors}
        sponsorDisplayType="both"
      />
    );

    expect(screen.getByText('Display Name')).toBeInTheDocument();
  });
});

