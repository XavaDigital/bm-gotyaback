import React from 'react';
import type { ShirtLayout as ShirtLayoutType, Position } from '~/types/campaign.types';

interface ShirtLayoutProps {
    layout: ShirtLayoutType;
    selectedPosition?: string;
    onPositionSelect?: (positionId: string, price: number) => void;
    readonly?: boolean;
    currency?: string;
}

const ShirtLayout: React.FC<ShirtLayoutProps> = ({
    layout,
    selectedPosition,
    onPositionSelect,
    readonly = false,
    currency = 'NZD',
}) => {
    const handlePositionClick = (position: Position) => {
        if (readonly || position.isTaken) return;
        if (onPositionSelect) {
            onPositionSelect(position.positionId, position.price);
        }
    };

    const getPositionColor = (position: Position) => {
        if (position.positionId === selectedPosition) {
            return '#1890ff'; // Selected - blue
        }
        if (position.isTaken) {
            return '#d9d9d9'; // Taken - gray
        }
        return '#52c41a'; // Available - green
    };

    const getPositionCursor = (position: Position) => {
        if (readonly) return 'default';
        if (position.isTaken) return 'not-allowed';
        return 'pointer';
    };

    return (
        <div
            style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${layout.columns}, 1fr)`,
                gap: '8px',
                maxWidth: '600px',
                margin: '0 auto',
            }}
        >
            {layout.placements.map((position) => (
                <div
                    key={position.positionId}
                    onClick={() => handlePositionClick(position)}
                    style={{
                        backgroundColor: getPositionColor(position),
                        border: '2px solid #fff',
                        borderRadius: '4px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: getPositionCursor(position),
                        transition: 'all 0.3s',
                        minHeight: '80px',
                        opacity: position.isTaken && !readonly ? 0.5 : 1,
                    }}
                    onMouseEnter={(e) => {
                        if (!readonly && !position.isTaken) {
                            e.currentTarget.style.transform = 'scale(1.05)';
                            e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                        }
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = 'none';
                    }}
                >
                    <div
                        style={{
                            color: '#fff',
                            fontWeight: 'bold',
                            fontSize: '12px',
                            marginBottom: '4px',
                        }}
                    >
                        {position.positionId}
                    </div>
                    <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>
                        {currency} ${position.price}
                    </div>
                    {position.isTaken && (
                        <div style={{ color: '#fff', fontSize: '10px', marginTop: '4px' }}>
                            TAKEN
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default ShirtLayout;
