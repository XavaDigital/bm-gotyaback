import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LogoApprovalCard from './LogoApprovalCard';
import { renderWithProviders, createMockSponsor } from '~/test/testUtils';

describe('LogoApprovalCard', () => {
  const mockOnApprove = vi.fn();
  const mockOnReject = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render sponsor information', () => {
    const sponsor = createMockSponsor({
      name: 'Test Sponsor',
      email: 'test@example.com',
      amount: 100,
      displaySize: 'medium',
    });

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('Test Sponsor')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('$100')).toBeInTheDocument();
    expect(screen.getByText('medium')).toBeInTheDocument();
  });

  it('should render logo image when logoUrl is provided', () => {
    const sponsor = createMockSponsor({
      name: 'Test Sponsor',
      logoUrl: 'https://example.com/logo.png',
    });

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const logo = screen.getByAltText("Test Sponsor's logo");
    expect(logo).toBeInTheDocument();
  });

  it('should render "No Logo" when logoUrl is not provided', () => {
    const sponsor = createMockSponsor({
      name: 'Test Sponsor',
      logoUrl: undefined,
    });

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText('No Logo')).toBeInTheDocument();
  });

  it('should display position ID when provided', () => {
    const sponsor = createMockSponsor({
      name: 'Test Sponsor',
      positionId: 'A1',
    });

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText(/Position:/)).toBeInTheDocument();
    expect(screen.getByText('A1')).toBeInTheDocument();
  });

  it('should display message when provided', () => {
    const sponsor = createMockSponsor({
      name: 'Test Sponsor',
      message: 'Thank you for your support!',
    });

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText(/Message:/)).toBeInTheDocument();
    expect(screen.getByText('Thank you for your support!')).toBeInTheDocument();
  });

  it('should call onApprove when approve button is clicked', async () => {
    const user = userEvent.setup();
    const sponsor = createMockSponsor({ _id: 'sponsor-1' });
    mockOnApprove.mockResolvedValue(undefined);

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const approveButton = screen.getByRole('button', { name: /approve/i });
    await user.click(approveButton);

    await waitFor(() => {
      expect(mockOnApprove).toHaveBeenCalledWith('sponsor-1');
    });
  });

  it('should open reject modal when reject button is clicked', async () => {
    const user = userEvent.setup();
    const sponsor = createMockSponsor();

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await user.click(rejectButton);

    await waitFor(() => {
      expect(screen.getByText('Reject Logo')).toBeInTheDocument();
    });
  });

  it('should call onReject with reason when reject is confirmed', async () => {
    const user = userEvent.setup();
    const sponsor = createMockSponsor({ _id: 'sponsor-1' });
    mockOnReject.mockResolvedValue(undefined);

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    // Open reject modal
    const rejectButton = screen.getByRole('button', { name: /reject/i });
    await user.click(rejectButton);

    // Enter rejection reason
    const textarea = screen.getByPlaceholderText(/e.g., Logo quality/i);
    await user.type(textarea, 'Logo quality is too low');

    // Confirm rejection
    const okButton = screen.getByRole('button', { name: 'Reject' });
    await user.click(okButton);

    await waitFor(() => {
      expect(mockOnReject).toHaveBeenCalledWith('sponsor-1', 'Logo quality is too low');
    });
  });

  it('should display payment status', () => {
    const sponsor = createMockSponsor({
      paymentStatus: 'paid',
    });

    renderWithProviders(
      <LogoApprovalCard
        sponsor={sponsor}
        onApprove={mockOnApprove}
        onReject={mockOnReject}
      />
    );

    expect(screen.getByText(/Payment Status:/)).toBeInTheDocument();
    expect(screen.getByText('paid')).toBeInTheDocument();
  });
});

