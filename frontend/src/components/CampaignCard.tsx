import React from 'react';
import { Card, Tag, Typography, Space, Button } from 'antd';
import { ClockCircleOutlined, EyeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Campaign } from '../types/campaign.types';

const { Title, Text, Paragraph } = Typography;

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

    const getCampaignTypeLabel = () => {
        switch (campaign.campaignType) {
            case 'fixed':
                return 'Fixed Price';
            case 'placement':
                return 'Placement';
            case 'donation':
                return 'Donation';
            default:
                return campaign.campaignType;
        }
    };

    const handleViewCampaign = () => {
        navigate(`/campaign/${campaign.slug}`);
    };

    return (
        <Card
            hoverable
            style={{ height: '100%' }}
            actions={[
                <Button
                    type="link"
                    icon={<EyeOutlined />}
                    onClick={handleViewCampaign}
                    key="view"
                >
                    View Campaign
                </Button>,
            ]}
        >
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <Title level={4} style={{ margin: 0 }}>
                        {campaign.title}
                    </Title>
                    {getStatusTag()}
                </div>

                {campaign.description && (
                    <Paragraph
                        ellipsis={{ rows: 2 }}
                        style={{ marginBottom: 8, color: '#666' }}
                    >
                        {campaign.description}
                    </Paragraph>
                )}

                <Space size="small" wrap>
                    <Tag>{getCampaignTypeLabel()}</Tag>
                    <Tag>{campaign.garmentType}</Tag>
                    <Tag>{campaign.currency}</Tag>
                </Space>

                {campaign.endDate && !campaign.isClosed && (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        <ClockCircleOutlined /> Ends: {new Date(campaign.endDate).toLocaleDateString()}
                    </Text>
                )}
            </Space>
        </Card>
    );
};

export default CampaignCard;

