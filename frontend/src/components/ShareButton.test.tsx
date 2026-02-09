import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import ShareButton from './ShareButton';
import { renderWithProviders } from '~/test/testUtils';
import { message } from 'antd';

// Mock antd message
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    message: {
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

describe('ShareButton', () => {
  const mockUrl = 'https://example.com/campaign';
  const mockTitle = 'Test Campaign';
  const mockDescription = 'Test Description';

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock window.open
    global.window.open = vi.fn();
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('should render share button', () => {
    renderWithProviders(
      <ShareButton url={mockUrl} title={mockTitle} description={mockDescription} />
    );

    expect(screen.getByRole('button', { name: /share/i })).toBeInTheDocument();
  });

  it('should copy link to clipboard when copy link is clicked', async () => {
    renderWithProviders(
      <ShareButton url={mockUrl} title={mockTitle} description={mockDescription} />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    // Wait for dropdown to appear and click copy link
    await waitFor(() => {
      const copyLink = screen.getByText('Copy Link');
      expect(copyLink).toBeInTheDocument();
      fireEvent.click(copyLink);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockUrl);
    expect(message.success).toHaveBeenCalledWith('Link copied to clipboard!');
  });

  it('should handle clipboard error', async () => {
    // Mock clipboard error
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Clipboard error')),
      },
    });

    renderWithProviders(
      <ShareButton url={mockUrl} title={mockTitle} description={mockDescription} />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      const copyLink = screen.getByText('Copy Link');
      fireEvent.click(copyLink);
    });

    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('Failed to copy link');
    });
  });

  it('should open Facebook share window', async () => {
    renderWithProviders(
      <ShareButton url={mockUrl} title={mockTitle} description={mockDescription} />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      const facebookOption = screen.getByText('Share on Facebook');
      fireEvent.click(facebookOption);
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('facebook.com/sharer'),
      '_blank',
      'width=600,height=400'
    );
  });

  it('should open Twitter share window', async () => {
    renderWithProviders(
      <ShareButton url={mockUrl} title={mockTitle} description={mockDescription} />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      const twitterOption = screen.getByText('Share on Twitter');
      fireEvent.click(twitterOption);
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('twitter.com/intent/tweet'),
      '_blank',
      'width=600,height=400'
    );
  });

  it('should open LinkedIn share window', async () => {
    renderWithProviders(
      <ShareButton url={mockUrl} title={mockTitle} description={mockDescription} />
    );

    const shareButton = screen.getByRole('button', { name: /share/i });
    fireEvent.click(shareButton);

    await waitFor(() => {
      const linkedinOption = screen.getByText('Share on LinkedIn');
      fireEvent.click(linkedinOption);
    });

    expect(window.open).toHaveBeenCalledWith(
      expect.stringContaining('linkedin.com/sharing'),
      '_blank',
      'width=600,height=400'
    );
  });
});

