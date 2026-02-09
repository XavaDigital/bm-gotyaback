import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import PublicHeader from './PublicHeader';
import { renderWithProviders } from '~/test/testUtils';

describe('PublicHeader', () => {
  it('should render the Beast Mode logo', () => {
    renderWithProviders(<PublicHeader />);

    const logo = screen.getByAltText('Beast Mode Logo');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src');
  });

  it('should render the "Got Your Back" heading', () => {
    renderWithProviders(<PublicHeader />);

    expect(screen.getByText('Got Your Back')).toBeInTheDocument();
  });

  it('should render heading as h1', () => {
    renderWithProviders(<PublicHeader />);

    const heading = screen.getByText('Got Your Back');
    expect(heading.tagName).toBe('H1');
  });
});

