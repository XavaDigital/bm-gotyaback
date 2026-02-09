import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import LogoWithNameSponsor from './LogoWithNameSponsor';
import { renderWithProviders } from '~/test/testUtils';

describe('LogoWithNameSponsor', () => {
  const defaultProps = {
    name: 'Test Sponsor',
    displayName: 'Test Sponsor Inc.',
    logoUrl: 'https://example.com/logo.png',
    logoWidth: 100,
  };

  it('should render sponsor logo', () => {
    renderWithProviders(<LogoWithNameSponsor {...defaultProps} />);

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('should render display name', () => {
    renderWithProviders(<LogoWithNameSponsor {...defaultProps} />);

    expect(screen.getByText('Test Sponsor Inc.')).toBeInTheDocument();
  });

  it('should apply correct logo width', () => {
    renderWithProviders(<LogoWithNameSponsor {...defaultProps} logoWidth={150} />);

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toHaveStyle({ width: '150px', maxHeight: '150px' });
  });

  it('should render with tooltip when message is provided', () => {
    renderWithProviders(
      <LogoWithNameSponsor {...defaultProps} message="Thank you for your support!" />
    );

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toBeInTheDocument();
  });

  it('should apply pending opacity when isPending is true', () => {
    const { container } = renderWithProviders(
      <LogoWithNameSponsor {...defaultProps} isPending={true} />
    );

    const wrapper = container.querySelector('div[style*="opacity"]');
    expect(wrapper).toHaveStyle({ opacity: 0.6 });
  });

  it('should apply full opacity when isPending is false', () => {
    const { container } = renderWithProviders(
      <LogoWithNameSponsor {...defaultProps} isPending={false} />
    );

    const wrapper = container.querySelector('div[style*="opacity"]');
    expect(wrapper).toHaveStyle({ opacity: 1 });
  });

  it('should render without tooltip when no message is provided', () => {
    const { container } = renderWithProviders(<LogoWithNameSponsor {...defaultProps} />);

    // Should not have tooltip wrapper
    expect(container.querySelector('.ant-tooltip')).not.toBeInTheDocument();
  });

  it('should display logo and name in column layout', () => {
    const { container } = renderWithProviders(<LogoWithNameSponsor {...defaultProps} />);

    const wrapper = container.querySelector('div[style*="flex-direction"]');
    expect(wrapper).toHaveStyle({ flexDirection: 'column' });
  });
});

