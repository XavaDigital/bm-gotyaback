import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Button, Empty, Spin, Tag, Row, Col, message, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import type { Campaign } from '../types/campaign.types';
import campaignService from '../services/campaign.service';

const MyCampaigns: React.FC = () => {
    const [campaigns, setCampaigns] = useState<Campaign[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadCampaigns();
    }, []);

    const loadCampaigns = async () => {
        try {
            const data = await campaignService.getMyCampaigns();
            setCampaigns(data);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to load campaigns');
        } finally {
            setLoading(false);
        }
    };

    const getRemainingDays = (endDate?: string | Date) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (campaigns.length === 0) {
        return (
            <div style={{ padding: 40 }}>
                <Empty
                    description="No campaigns yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/campaigns/create')}>
                        Create Your First Campaign
                    </Button>
                </Empty>
            </div>
        );
    }

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1>My Campaigns</h1>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/campaigns/create')}>
                    Create Campaign
                </Button>
            </div>

            <Row gutter={[16, 16]}>
                {campaigns.map((campaign) => {
                    const remainingDays = getRemainingDays(campaign.endDate);

                    return (
                        <Col key={campaign._id} xs={24} sm={12} lg={8}>
                            <Card
                                title={campaign.title}
                                extra={
                                    campaign.isClosed ? (
                                        <Tag color="red">Closed</Tag>
                                    ) : (
                                        <Tag color="green">Active</Tag>
                                    )
                                }
                                actions={[
                                    <Button
                                        type="link"
                                        icon={<EyeOutlined />}
                                        onClick={() => navigate(`/campaigns/${campaign._id}`)}
                                    >
                                        View
                                    </Button>,
                                    <Button
                                        type="link"
                                        icon={<EditOutlined />}
                                        onClick={() => navigate(`/campaigns/${campaign._id}/edit`)}
                                        disabled={campaign.isClosed}
                                    >
                                        Edit
                                    </Button>,
                                ]}
                            >
                                <p style={{ color: '#888', marginBottom: 16 }}>
                                    {campaign.description || 'No description'}
                                </p>

                                <div style={{ marginBottom: 8 }}>
                                    <strong>Type:</strong>{' '}
                                    <Tag>
                                        {campaign.campaignType === 'fixed'
                                            ? 'Fixed Price'
                                            : campaign.campaignType === 'placement'
                                                ? 'Placement-Based'
                                                : 'Donation Only'}
                                    </Tag>
                                </div>

                                <div style={{ marginBottom: 8 }}>
                                    <strong>Garment:</strong> {campaign.garmentType}
                                </div>

                                {remainingDays !== null && !campaign.isClosed && (
                                    <Statistic
                                        title="Days Remaining"
                                        value={remainingDays}
                                        suffix="days"
                                        valueStyle={{ fontSize: 20 }}
                                    />
                                )}

                                {campaign.isClosed && (
                                    <div style={{ color: '#888', fontSize: 12 }}>
                                        Campaign ended
                                    </div>
                                )}
                            </Card>
                        </Col>
                    );
                })}
            </Row>
        </div>
    );
};

export default MyCampaigns;
