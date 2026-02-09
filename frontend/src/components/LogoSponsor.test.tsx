import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import LogoSponsor from './LogoSponsor';
import { renderWithProviders } from '~/test/testUtils';

describe('LogoSponsor', () => {
  const defaultProps = {
    name: 'Test Sponsor',
    logoUrl: 'https://example.com/logo.png',
    logoWidth: 100,
  };

  it('should render sponsor logo', () => {
    renderWithProviders(<LogoSponsor {...defaultProps} />);

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', 'https://example.com/logo.png');
  });

  it('should apply correct width styles', () => {
    renderWithProviders(<LogoSponsor {...defaultProps} logoWidth={150} />);

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toHaveStyle({ maxWidth: '150px', maxHeight: '150px' });
  });

  it('should render with tooltip when message is provided', () => {
    renderWithProviders(
      <LogoSponsor {...defaultProps} message="Thank you for your support!" />
    );

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toBeInTheDocument();
  });

  it('should apply pending opacity when isPending is true', () => {
    renderWithProviders(<LogoSponsor {...defaultProps} isPending={true} />);

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toHaveStyle({ opacity: 0.6 });
  });

  it('should apply full opacity when isPending is false', () => {
    renderWithProviders(<LogoSponsor {...defaultProps} isPending={false} />);

    const logo = screen.getByAltText('Test Sponsor');
    expect(logo).toHaveStyle({ opacity: 1 });
  });

  it('should render without tooltip when no message is provided', () => {
    const { container } = renderWithProviders(<LogoSponsor {...defaultProps} />);

    // Should not have tooltip wrapper
    expect(container.querySelector('.ant-tooltip')).not.toBeInTheDocument();
  });
});

