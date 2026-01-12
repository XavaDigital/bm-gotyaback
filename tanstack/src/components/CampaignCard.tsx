import React from 'react';
import { Card, Tag, Typography, Button, Row, Col, Space } from 'antd';
import {
    ClockCircleOutlined,
    EyeOutlined,
    UserOutlined,
    CheckCircleOutlined,
} from '@ant-design/icons';
import { useNavigate } from '@tanstack/react-router';
import type { Campaign } from '~/types/campaign.types';

const { Text } = Typography;

interface CampaignCardProps {
    campaign: Campaign;
}

const CampaignCard: React.FC<CampaignCardProps> = ({ campaign }) => {
    const navigate = useNavigate();

    const getStatusTag = () => {
        if (campaign.isClosed) {
            return <Tag color="red">Closed</Tag>;
        }
        if (campaign.endDate && new Date(campaign.endDate) < new Date()) {
            return <Tag color="orange">Ended</Tag>;
        }
        return <Tag color="green">Active</Tag>;
    };

    const getRemainingDays = () => {
        if (!campaign.endDate || campaign.isClosed) return null;
        const end = new Date(campaign.endDate);
        const now = new Date();
        const diff = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 0;
    };

    const handleViewCampaign = () => {
        navigate({ to: `/campaign/${campaign.slug}` });
    };

    const remainingDays = getRemainingDays();

    return (
        <Card
            hoverable
            onClick={handleViewCampaign}
            style={{
                cursor: 'pointer',
                width: '100%',
                boxSizing: 'border-box',
            }}
            bodyStyle={{
                padding: 'clamp(16px, 3vw, 24px)',
            }}
        >
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'clamp(12px, 2vw, 16px)',
                }}
            >
                {/* Title and Status */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 'clamp(8px, 2vw, 12px)',
                        flexWrap: 'wrap',
                    }}
                >
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 'clamp(16px, 4vw, 20px)',
                            flex: '1 1 auto',
                        }}
                    >
                        {campaign.title}
                    </h2>
                    {getStatusTag()}
                </div>

                {/* Short Description */}
                {campaign.shortDescription && (
                    <p
                        style={{
                            color: '#999',
                            marginBottom: 0,
                            fontSize: 'clamp(13px, 2.5vw, 14px)',
                            lineHeight: '1.5',
                        }}
                    >
                        {campaign.shortDescription}
                    </p>
                )}

                {/* Stats - Responsive Grid */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'clamp(6px, 1.5vw, 8px)',
                        marginTop: 'clamp(4px, 1vw, 8px)',
                    }}
                >
                    {/* Sponsor count */}
                    {campaign.stats && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                color: '#999',
                            }}
                        >
                            <UserOutlined />
                            <span>
                                {campaign.stats.sponsorCount}{' '}
                                {campaign.stats.sponsorCount === 1 ? 'sponsor' : 'sponsors'}
                            </span>
                        </div>
                    )}

                    {/* Positions for fixed/positional campaigns */}
                    {campaign.stats &&
                        campaign.campaignType !== 'pay-what-you-want' &&
                        campaign.stats.totalPositions > 0 && (
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    fontSize: 'clamp(12px, 2.5vw, 14px)',
                                    color: '#999',
                                }}
                            >
                                <CheckCircleOutlined />
                                <span>
                                    {campaign.stats.claimedPositions} / {campaign.stats.totalPositions}{' '}
                                    positions filled
                                    {campaign.stats.remainingPositions > 0 && (
                                        <span style={{ color: '#1890ff', marginLeft: 4 }}>
                                            ({campaign.stats.remainingPositions} remaining)
                                        </span>
                                    )}
                                </span>
                            </div>
                        )}

                    {/* Days remaining */}
                    {remainingDays !== null && (
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                fontSize: 'clamp(12px, 2.5vw, 14px)',
                                color: '#999',
                            }}
                        >
                            <ClockCircleOutlined />
                            <span>
                                {remainingDays} {remainingDays === 1 ? 'day' : 'days'} remaining
                            </span>
                        </div>
                    )}
                </div>

                {/* Action Button - Full Width on Mobile */}
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleViewCampaign();
                    }}
                    style={{
                        marginTop: 'clamp(8px, 2vw, 12px)',
                        height: 'clamp(36px, 7vw, 40px)',
                        fontSize: 'clamp(13px, 2.5vw, 14px)',
                        width: '100%',
                    }}
                >
                    View Campaign
                </Button>
            </div>
        </Card>
    );
};

export default CampaignCard;

