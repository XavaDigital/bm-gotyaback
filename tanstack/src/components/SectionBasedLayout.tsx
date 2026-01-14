import React from 'react';
import { Button, Card } from 'antd';
import type { Position } from '~/types/campaign.types';

interface SectionBasedLayoutProps {
    placements: Position[];
    selectedPosition?: string;
    onPositionSelect?: (positionId: string, price: number) => void;
    readonly?: boolean;
    currency?: string;
    isClosed?: boolean;
}

const SectionBasedLayout: React.FC<SectionBasedLayoutProps> = ({
    placements,
    selectedPosition,
    onPositionSelect,
    readonly = false,
    currency = 'NZD',
    isClosed = false,
}) => {
    // Group placements by section
    const sections = {
        top: placements.filter(p => p.section === 'top'),
        middle: placements.filter(p => p.section === 'middle'),
        bottom: placements.filter(p => p.section === 'bottom'),
    };

    const getSectionTitle = (section: 'top' | 'middle' | 'bottom') => {
        const titles = {
            middle: 'Middle Section (Premium)',
            top: 'Top Section',
            bottom: 'Bottom Section',
        };
        return titles[section];
    };

    const getSectionColor = (section: 'top' | 'middle' | 'bottom') => {
        const colors = {
            middle: '#ffd700', // Gold - Premium tier
            top: '#c0c0c0',    // Silver - Mid tier
            bottom: '#cd7f32', // Bronze - Base tier
        };
        return colors[section];
    };

    const renderSection = (section: 'top' | 'middle' | 'bottom') => {
        const sectionPlacements = sections[section];
        if (sectionPlacements.length === 0) return null;

        const price = sectionPlacements[0]?.price || 0;
        const availableCount = sectionPlacements.filter(p => !p.isTaken).length;
        const totalCount = sectionPlacements.length;

        return (
            <Card
                key={section}
                style={{
                    marginBottom: 24,
                    borderColor: getSectionColor(section),
                    borderWidth: 2,
                }}
                title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontSize: 'clamp(16px, 3.5vw, 20px)', fontWeight: 600 }}>
                            {getSectionTitle(section)}
                        </span>
                        <span style={{ fontSize: 'clamp(14px, 3vw, 18px)', color: getSectionColor(section), fontWeight: 600 }}>
                            ${price} {currency}
                        </span>
                    </div>
                }
                extra={
                    <span style={{ fontSize: 'clamp(12px, 2.5vw, 14px)' }}>
                        {availableCount} / {totalCount} available
                    </span>
                }
            >
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(clamp(60px, 15vw, 100px), 1fr))',
                    gap: 'clamp(8px, 2vw, 12px)',
                }}>
                    {sectionPlacements.map((position) => {
                        const isSelected = position.positionId === selectedPosition;
                        const isTaken = position.isTaken;
                        const isAvailable = !isTaken && !readonly && !isClosed;

                        return (
                            <div
                                key={position.positionId}
                                onClick={() => {
                                    if (isAvailable && onPositionSelect) {
                                        onPositionSelect(position.positionId, position.price);
                                    }
                                }}
                                style={{
                                    backgroundColor: isSelected ? '#1890ff' : isTaken ? '#d9d9d9' : '#52c41a',
                                    border: `2px solid ${isSelected ? '#096dd9' : '#fff'}`,
                                    borderRadius: 4,
                                    padding: 'clamp(8px, 2vw, 12px)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: isAvailable ? 'pointer' : isTaken ? 'not-allowed' : 'default',
                                    transition: 'all 0.3s',
                                    minHeight: 'clamp(50px, 12vw, 70px)',
                                    opacity: isTaken && !readonly ? 0.5 : 1,
                                }}
                                onMouseEnter={(e) => {
                                    if (isAvailable) {
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (isAvailable) {
                                        e.currentTarget.style.transform = 'scale(1)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }
                                }}
                            >
                                <div style={{
                                    fontSize: 'clamp(12px, 2.5vw, 16px)',
                                    fontWeight: 'bold',
                                    color: '#fff',
                                }}>
                                    #{position.positionId}
                                </div>
                                <div style={{
                                    fontSize: 'clamp(10px, 2vw, 12px)',
                                    color: '#fff',
                                    marginTop: 4,
                                }}>
                                    {isTaken ? 'Taken' : 'Available'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        );
    };

    return (
        <div>
            {renderSection('middle')}
            {renderSection('top')}
            {renderSection('bottom')}
        </div>
    );
};

export default SectionBasedLayout;

