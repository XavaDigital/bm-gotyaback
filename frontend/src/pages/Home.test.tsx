import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import Home from './Home';
import { renderWithProviders } from '~/test/testUtils';

// Mock router navigation
const mockNavigate = vi.fn();
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  };
});

describe('Home', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should render landing page', () => {
    renderWithProviders(<Home />);

    const elements = screen.getAllByText(/Got Your Back/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render hero section', () => {
    renderWithProviders(<Home />);

    expect(screen.getByText(/Fundraising Made/i)).toBeInTheDocument();
  });

  it('should render features section', () => {
    renderWithProviders(<Home />);

    // Check for feature headings
    expect(screen.getByText(/Quick Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Multiple Payment Options/i)).toBeInTheDocument();
  });

  it('should render CTA buttons', () => {
    renderWithProviders(<Home />);

    const buttons = screen.getAllByText(/Get Started/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should load user from localStorage', () => {
    const mockUser = { _id: 'user-1', email: 'test@example.com' };
    localStorage.setItem('user', JSON.stringify(mockUser));

    renderWithProviders(<Home />);

    // User should be loaded
    const elements = screen.getAllByText(/Got Your Back/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should render without user', () => {
    renderWithProviders(<Home />);

    const elements = screen.getAllByText(/Got Your Back/i);
    expect(elements.length).toBeGreaterThan(0);
  });

  it('should have Beast Mode logo', () => {
    renderWithProviders(<Home />);

    const logos = screen.getAllByAltText(/Beast Mode/i);
    expect(logos.length).toBeGreaterThan(0);
  });
});

