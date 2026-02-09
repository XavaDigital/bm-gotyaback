import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { AppLayout } from './AppLayout';
import { renderWithProviders } from '~/test/testUtils';
import authService from '~/services/auth.service';

// Mock authService
vi.mock('~/services/auth.service', () => ({
  default: {
    getCurrentUser: vi.fn(),
  },
}));

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
    Outlet: () => <div>Outlet Content</div>,
  };
});

describe('AppLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (authService.getCurrentUser as any).mockReturnValue({
      _id: 'user-1',
      email: 'test@example.com',
      organizerProfile: {
        slug: 'test-organizer',
      },
    });

    // Mock scrollTo method for the contentRef
    Element.prototype.scrollTo = vi.fn();
  });

  it('should render layout with sidebar', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Got Your Back')).toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Create Campaign')).toBeInTheDocument();
  });

  it('should render admin panel header', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('should render logout button', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('should call onLogout and navigate when logout clicked', async () => {
    const onLogout = vi.fn();
    renderWithProviders(<AppLayout onLogout={onLogout} />);

    const logoutButton = screen.getByText('Logout');
    fireEvent.click(logoutButton);

    expect(onLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith({ to: '/login' });
  });

  it('should navigate when menu item clicked', () => {
    renderWithProviders(<AppLayout />);

    const homeMenuItem = screen.getByText('Home');
    fireEvent.click(homeMenuItem);

    expect(mockNavigate).toHaveBeenCalledWith({ to: '/' });
  });

  it('should render public profile link when user has organizer profile', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getByText('View Public Profile')).toBeInTheDocument();
  });

  it('should not render public profile link when user has no organizer profile', () => {
    (authService.getCurrentUser as any).mockReturnValue({
      _id: 'user-1',
      email: 'test@example.com',
    });

    renderWithProviders(<AppLayout />);

    expect(screen.queryByText('View Public Profile')).not.toBeInTheDocument();
  });

  it('should render children when provided', () => {
    renderWithProviders(
      <AppLayout>
        <div>Custom Content</div>
      </AppLayout>
    );

    expect(screen.getByText('Custom Content')).toBeInTheDocument();
  });

  it('should render Outlet when no children provided', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Outlet Content')).toBeInTheDocument();
  });

  it('should have all menu items for regular users (without Admin Settings)', () => {
    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Create Campaign')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();
  });

  it('should show Admin Settings menu item for admin users', () => {
    (authService.getCurrentUser as any).mockReturnValue({
      _id: 'admin-1',
      email: 'admin@example.com',
      role: 'admin',
      organizerProfile: {
        slug: 'admin-organizer',
      },
    });

    renderWithProviders(<AppLayout />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('My Campaigns')).toBeInTheDocument();
    expect(screen.getByText('Create Campaign')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Admin Settings')).toBeInTheDocument();
  });

  it('should not show Admin Settings menu item for non-admin users', () => {
    (authService.getCurrentUser as any).mockReturnValue({
      _id: 'user-1',
      email: 'user@example.com',
      role: 'user',
      organizerProfile: {
        slug: 'user-organizer',
      },
    });

    renderWithProviders(<AppLayout />);

    expect(screen.queryByText('Admin Settings')).not.toBeInTheDocument();
  });

  it('should add has-admin-layout class to body on mount', () => {
    renderWithProviders(<AppLayout />);

    expect(document.body.classList.contains('has-admin-layout')).toBe(true);
  });

  it('should remove has-admin-layout class from body on unmount', () => {
    const { unmount } = renderWithProviders(<AppLayout />);

    expect(document.body.classList.contains('has-admin-layout')).toBe(true);

    unmount();

    expect(document.body.classList.contains('has-admin-layout')).toBe(false);
  });
});

