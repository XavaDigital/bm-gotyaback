import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { GuestGuard } from './GuestGuard';
import { renderWithProviders, createMockUser, setupAuthToken, clearAuth } from '~/test/testUtils';
import authService from '~/services/auth.service';

// Mock TanStack Router
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Navigate: ({ to }: any) => <div data-testid="navigate">{to}</div>,
    Outlet: () => <div data-testid="outlet">Guest Content</div>,
  };
});

describe('GuestGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
  });

  it('should render outlet when user is not authenticated', () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

    renderWithProviders(<GuestGuard />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Guest Content')).toBeInTheDocument();
  });

  it('should redirect to home when user is authenticated', () => {
    const mockUser = createMockUser();
    setupAuthToken('test-token');
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser);

    renderWithProviders(<GuestGuard />);

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('/')).toBeInTheDocument();
  });

  it('should not render guest content when authenticated', () => {
    const mockUser = createMockUser();
    setupAuthToken('test-token');
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser);

    renderWithProviders(<GuestGuard />);

    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(screen.queryByText('Guest Content')).not.toBeInTheDocument();
  });
});

