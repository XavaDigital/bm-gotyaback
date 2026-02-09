import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import { AuthGuard } from './AuthGuard';
import { renderWithProviders, createMockUser, setupAuthToken, clearAuth } from '~/test/testUtils';
import authService from '~/services/auth.service';

// Mock TanStack Router
const mockNavigate = vi.fn();
const mockLocation = { pathname: '/dashboard', search: '', hash: '' };

vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    Navigate: ({ to }: any) => <div data-testid="navigate">{to}</div>,
    Outlet: () => <div data-testid="outlet">Protected Content</div>,
    useLocation: () => mockLocation,
  };
});

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAuth();
  });

  it('should render outlet when user is authenticated', () => {
    const mockUser = createMockUser();
    setupAuthToken('test-token');
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(mockUser);

    renderWithProviders(<AuthGuard />);

    expect(screen.getByTestId('outlet')).toBeInTheDocument();
    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should redirect to login when user is not authenticated', () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

    renderWithProviders(<AuthGuard />);

    expect(screen.getByTestId('navigate')).toBeInTheDocument();
    expect(screen.getByText('/login')).toBeInTheDocument();
  });

  it('should not render protected content when not authenticated', () => {
    vi.spyOn(authService, 'getCurrentUser').mockReturnValue(null);

    renderWithProviders(<AuthGuard />);

    expect(screen.queryByTestId('outlet')).not.toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });
});

