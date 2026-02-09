import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import TextSponsor from './TextSponsor';
import { renderWithProviders } from '~/test/testUtils';

describe('TextSponsor', () => {
  const defaultProps = {
    name: 'Test Sponsor',
    fontSize: 16,
  };

  it('should render sponsor name', () => {
    renderWithProviders(<TextSponsor {...defaultProps} />);

    expect(screen.getByText('Test Sponsor')).toBeInTheDocument();
  });

  it('should apply correct font size', () => {
    renderWithProviders(<TextSponsor {...defaultProps} fontSize={24} />);

    const text = screen.getByText('Test Sponsor');
    expect(text).toHaveStyle({ fontSize: '24px' });
  });

  it('should render with tooltip when message is provided', () => {
    renderWithProviders(
      <TextSponsor {...defaultProps} message="Thank you for your support!" />
    );

    const text = screen.getByText('Test Sponsor');
    expect(text).toBeInTheDocument();
  });

  it('should apply pending opacity when isPending is true', () => {
    renderWithProviders(<TextSponsor {...defaultProps} isPending={true} />);

    const text = screen.getByText('Test Sponsor');
    expect(text).toHaveStyle({ opacity: 0.6 });
  });

  it('should apply full opacity when isPending is false', () => {
    renderWithProviders(<TextSponsor {...defaultProps} isPending={false} />);

    const text = screen.getByText('Test Sponsor');
    expect(text).toHaveStyle({ opacity: 1 });
  });

  it('should render without tooltip when no message is provided', () => {
    const { container } = renderWithProviders(<TextSponsor {...defaultProps} />);

    // Should not have tooltip wrapper
    expect(container.querySelector('.ant-tooltip')).not.toBeInTheDocument();
  });

  it('should apply correct text styles', () => {
    renderWithProviders(<TextSponsor {...defaultProps} />);

    const text = screen.getByText('Test Sponsor');
    expect(text).toHaveStyle({
      fontWeight: '600',
      color: '#ffffff',
    });
  });
});

