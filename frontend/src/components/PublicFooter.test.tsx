import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import PublicFooter from './PublicFooter';
import { renderWithProviders } from '~/test/testUtils';

describe('PublicFooter', () => {
  it('should render the call-to-action heading', () => {
    renderWithProviders(<PublicFooter />);

    expect(screen.getByText(/Want to create your own fundraising campaign/i)).toBeInTheDocument();
  });

  it('should render the description text', () => {
    renderWithProviders(<PublicFooter />);

    expect(
      screen.getByText(/Join Got Your Back and start raising funds/i)
    ).toBeInTheDocument();
  });

  it('should render "Get Started" button', () => {
    renderWithProviders(<PublicFooter />);

    const button = screen.getByRole('link', { name: /get started/i });
    expect(button).toBeInTheDocument();
  });

  it('should link to register page', () => {
    renderWithProviders(<PublicFooter />);

    const button = screen.getByRole('link', { name: /get started/i });
    expect(button).toHaveAttribute('href', '/register');
  });

  it('should display rocket icon', () => {
    renderWithProviders(<PublicFooter />);

    const icon = document.querySelector('.anticon-rocket');
    expect(icon).toBeInTheDocument();
  });
});

