import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import Admin from './Admin';
import { renderWithProviders } from '~/test/testUtils';

// Mock router
vi.mock('@tantml:react-router', async () => {
  const actual = await vi.importActual('@tanstack/react-router');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

describe('Admin', () => {
  it('should render admin page', () => {
    renderWithProviders(<Admin />);

    expect(screen.getByText(/Admin/i)).toBeInTheDocument();
  });

  it('should render admin settings', () => {
    renderWithProviders(<Admin />);

    // Admin page should have some settings
    expect(screen.getByText(/Settings/i)).toBeInTheDocument();
  });
});

