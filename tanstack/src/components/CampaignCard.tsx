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
        <Card hoverable onClick={handleViewCampaign} style={{ cursor: 'pointer' }}>
            <Row gutter={24} align="middle">
                {/* Left side - Campaign Info */}
                <Col flex="auto">
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: 12,
                        }}
                    >
                        <h2 style={{ margin: 0, fontSize: 20 }}>{campaign.title}</h2>
                        {getStatusTag()}
                    </div>

                    {campaign.shortDescription && (
                        <p style={{ color: '#666', marginBottom: 12, fontSize: 14 }}>
                            {campaign.shortDescription}
                        </p>
                    )}

                    <Space size="large" style={{ marginTop: 8 }}>
                        {/* Sponsor count */}
                        {campaign.stats && (
                            <Text type="secondary" style={{ fontSize: 14 }}>
                                <UserOutlined /> {campaign.stats.sponsorCount}{' '}
                                {campaign.stats.sponsorCount === 1 ? 'sponsor' : 'sponsors'}
                            </Text>
                        )}

                        {/* Positions for fixed/positional campaigns */}
                        {campaign.stats &&
                            campaign.campaignType !== 'pay-what-you-want' &&
                            campaign.stats.totalPositions > 0 && (
                                <Text type="secondary" style={{ fontSize: 14 }}>
                                    <CheckCircleOutlined /> {campaign.stats.claimedPositions} /{' '}
                                    {campaign.stats.totalPositions} positions filled
                                    {campaign.stats.remainingPositions > 0 && (
                                        <span style={{ color: '#1890ff', marginLeft: 4 }}>
                                            ({campaign.stats.remainingPositions} remaining)
                                        </span>
                                    )}
                                </Text>
                            )}

                        {/* Days remaining */}
                        {remainingDays !== null && (
                            <Text type="secondary" style={{ fontSize: 14 }}>
                                <ClockCircleOutlined /> {remainingDays}{' '}
                                {remainingDays === 1 ? 'day' : 'days'} remaining
                            </Text>
                        )}
                    </Space>
                </Col>

                {/* Right side - Action Button */}
                <Col flex="none">
                    <Button
                        type="primary"
                        size="large"
                        icon={<EyeOutlined />}
                        onClick={(e) => {
                            e.stopPropagation();
                            handleViewCampaign();
                        }}
                    >
                        View Campaign
                    </Button>
                </Col>
            </Row>
        </Card>
    );
};

export default CampaignCard;

