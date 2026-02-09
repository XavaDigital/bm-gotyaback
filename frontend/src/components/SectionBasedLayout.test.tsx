import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import SectionBasedLayout from './SectionBasedLayout';
import { renderWithProviders } from '~/test/testUtils';
import type { Position } from '~/types/campaign.types';

describe('SectionBasedLayout', () => {
  const mockPlacements: Position[] = [
    { positionId: '1', price: 100, isTaken: false, section: 'top' },
    { positionId: '2', price: 100, isTaken: true, section: 'top' },
    { positionId: '3', price: 200, isTaken: false, section: 'middle' },
    { positionId: '4', price: 200, isTaken: false, section: 'middle' },
    { positionId: '5', price: 50, isTaken: false, section: 'bottom' },
  ];

  it('should render all sections with placements', () => {
    renderWithProviders(
      <SectionBasedLayout placements={mockPlacements} />
    );

    expect(screen.getByText('Middle Section (Premium)')).toBeInTheDocument();
    expect(screen.getByText('Top Section')).toBeInTheDocument();
    expect(screen.getByText('Bottom Section')).toBeInTheDocument();
  });

  it('should display correct prices for each section', () => {
    renderWithProviders(
      <SectionBasedLayout placements={mockPlacements} currency="NZD" />
    );

    expect(screen.getByText('$200 NZD')).toBeInTheDocument(); // Middle
    expect(screen.getByText('$100 NZD')).toBeInTheDocument(); // Top
    expect(screen.getByText('$50 NZD')).toBeInTheDocument(); // Bottom
  });

  it('should show available count for each section', () => {
    renderWithProviders(
      <SectionBasedLayout placements={mockPlacements} />
    );

    // Middle: 2/2 available
    expect(screen.getByText('2 / 2 available')).toBeInTheDocument();
    // Top: 1/2 available (one is taken)
    expect(screen.getByText('1 / 2 available')).toBeInTheDocument();
    // Bottom: 1/1 available
    expect(screen.getByText('1 / 1 available')).toBeInTheDocument();
  });

  it('should call onPositionSelect when clicking available position', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <SectionBasedLayout
        placements={mockPlacements}
        onPositionSelect={onPositionSelect}
      />
    );

    const position1 = screen.getByText('#1');
    fireEvent.click(position1);

    expect(onPositionSelect).toHaveBeenCalledWith('1', 100);
  });

  it('should not call onPositionSelect when clicking taken position', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <SectionBasedLayout
        placements={mockPlacements}
        onPositionSelect={onPositionSelect}
      />
    );

    const position2 = screen.getByText('#2');
    fireEvent.click(position2);

    expect(onPositionSelect).not.toHaveBeenCalled();
  });

  it('should not call onPositionSelect in readonly mode', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <SectionBasedLayout
        placements={mockPlacements}
        onPositionSelect={onPositionSelect}
        readonly={true}
      />
    );

    const position1 = screen.getByText('#1');
    fireEvent.click(position1);

    expect(onPositionSelect).not.toHaveBeenCalled();
  });

  it('should not call onPositionSelect when campaign is closed', () => {
    const onPositionSelect = vi.fn();
    renderWithProviders(
      <SectionBasedLayout
        placements={mockPlacements}
        onPositionSelect={onPositionSelect}
        isClosed={true}
      />
    );

    const position1 = screen.getByText('#1');
    fireEvent.click(position1);

    expect(onPositionSelect).not.toHaveBeenCalled();
  });

  it('should highlight selected position', () => {
    renderWithProviders(
      <SectionBasedLayout
        placements={mockPlacements}
        selectedPosition="1"
      />
    );

    const position1 = screen.getByText('#1').parentElement;
    expect(position1).toHaveStyle({ backgroundColor: '#1890ff' });
  });

  it('should show "Taken" status for taken positions', () => {
    renderWithProviders(
      <SectionBasedLayout placements={mockPlacements} />
    );

    const takenPositions = screen.getAllByText('Taken');
    expect(takenPositions).toHaveLength(1);
  });

  it('should show "Available" status for available positions', () => {
    renderWithProviders(
      <SectionBasedLayout placements={mockPlacements} />
    );

    const availablePositions = screen.getAllByText('Available');
    expect(availablePositions).toHaveLength(4);
  });

  it('should not render section if no placements', () => {
    const placementsWithoutBottom: Position[] = [
      { positionId: '1', price: 100, isTaken: false, section: 'top' },
      { positionId: '3', price: 200, isTaken: false, section: 'middle' },
    ];

    renderWithProviders(
      <SectionBasedLayout placements={placementsWithoutBottom} />
    );

    expect(screen.queryByText('Bottom Section')).not.toBeInTheDocument();
  });
});

