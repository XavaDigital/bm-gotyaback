import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import ShirtLayout from './ShirtLayout';
import { renderWithProviders } from '~/test/testUtils';
import type { ShirtLayout as ShirtLayoutType } from '~/types/campaign.types';

describe('ShirtLayout', () => {
  const mockLayout: ShirtLayoutType = {
    _id: 'layout-1',
    campaignId: 'campaign-1',
    layoutType: 'grid',
    columns: 3,
    placements: [
      { positionId: '1', price: 20, isTaken: false },
      { positionId: '2', price: 22, isTaken: true },
      { positionId: '3', price: 24, isTaken: false },
      { positionId: '4', price: 26, isTaken: false },
    ],
  };

  it('should render all positions', () => {
    renderWithProviders(<ShirtLayout layout={mockLayout} />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('should display prices for all positions', () => {
    renderWithProviders(<ShirtLayout layout={mockLayout} currency="NZD" />);

    expect(screen.getByText('NZD $20')).toBeInTheDocument();
    expect(screen.getByText('NZD $22')).toBeInTheDocument();
    expect(screen.getByText('NZD $24')).toBeInTheDocument();
    expect(screen.getByText('NZD $26')).toBeInTheDocument();
  });

  it('should show TAKEN label for taken positions', () => {
    renderWithProviders(<ShirtLayout layout={mockLayout} />);

    const takenLabels = screen.getAllByText('TAKEN');
    expect(takenLabels).toHaveLength(1);
  });

  it('should call onPositionSelect when clicking available position', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <ShirtLayout
        layout={mockLayout}
        onPositionSelect={onPositionSelect}
      />
    );

    const position1 = screen.getByText('1');
    fireEvent.click(position1.parentElement!);

    expect(onPositionSelect).toHaveBeenCalledWith('1', 20);
  });

  it('should not call onPositionSelect when clicking taken position', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <ShirtLayout
        layout={mockLayout}
        onPositionSelect={onPositionSelect}
      />
    );

    const position2 = screen.getByText('2');
    fireEvent.click(position2.parentElement!);

    expect(onPositionSelect).not.toHaveBeenCalled();
  });

  it('should not call onPositionSelect in readonly mode', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <ShirtLayout
        layout={mockLayout}
        onPositionSelect={onPositionSelect}
        readonly={true}
      />
    );

    const position1 = screen.getByText('1');
    fireEvent.click(position1.parentElement!);

    expect(onPositionSelect).not.toHaveBeenCalled();
  });

  it('should highlight selected position', () => {
    renderWithProviders(
      <ShirtLayout
        layout={mockLayout}
        selectedPosition="1"
      />
    );

    const position1 = screen.getByText('1').parentElement;
    expect(position1).toHaveStyle({ backgroundColor: '#1890ff' });
  });

  it('should show green color for available positions', () => {
    renderWithProviders(<ShirtLayout layout={mockLayout} />);

    const position1 = screen.getByText('1').parentElement;
    expect(position1).toHaveStyle({ backgroundColor: '#52c41a' });
  });

  it('should show gray color for taken positions', () => {
    renderWithProviders(<ShirtLayout layout={mockLayout} />);

    const position2 = screen.getByText('2').parentElement;
    expect(position2).toHaveStyle({ backgroundColor: '#d9d9d9' });
  });

  it('should render with correct grid columns', () => {
    const { container } = renderWithProviders(<ShirtLayout layout={mockLayout} />);

    const gridContainer = container.querySelector('div[style*="grid-template-columns"]');
    expect(gridContainer).toHaveStyle({ gridTemplateColumns: 'repeat(3, 1fr)' });
  });

  it('should use default currency when not provided', () => {
    renderWithProviders(<ShirtLayout layout={mockLayout} />);

    expect(screen.getByText('NZD $20')).toBeInTheDocument();
  });
});

