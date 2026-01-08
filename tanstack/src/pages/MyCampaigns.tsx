import React, { useEffect, useState } from 'react';
import { useNavigate, useRouteContext } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Card, Button, Empty, Spin, Tag, Row, Col, message, Statistic } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined } from '@ant-design/icons';
import type { Campaign } from '~/types/campaign.types';
import campaignService from '~/services/campaign.service';
import sponsorshipService from '~/services/sponsorship.service';
import EditCampaignModal from '~/components/EditCampaignModal';
import { Route } from '~/routes/dashboard.index';

interface CampaignStats {
    totalPledged: number;
    totalPending: number;
    sponsorCount: number;
    pendingCount: number;
    positionsClaimed: number;
    positionsTotal: number;
}

const MyCampaigns: React.FC = () => {
    // Get initial data from loader
    const loaderData = Route.useLoaderData();

    // Use TanStack Query for data fetching
    // Use placeholderData instead of initialData so it always refetches on mount
    const { data: campaigns = [], isLoading, refetch } = useQuery({
        queryKey: ['my-campaigns'],
        queryFn: async () => {
            const data = await campaignService.getMyCampaigns();
            return data;
        },
        placeholderData: loaderData?.campaigns || [],
        staleTime: 0, // Always refetch on mount
    });

    const [campaignStats, setCampaignStats] = useState<Map<string, CampaignStats>>(new Map());
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (campaigns.length > 0) {
            loadCampaignStats(campaigns);
        }
    }, [campaigns]);

    const loadCampaignStats = async (campaigns: Campaign[]) => {
        const statsMap = new Map<string, CampaignStats>();

        await Promise.all(
            campaigns.map(async (campaign) => {
                try {
                    // Fetch sponsors
                    const sponsors = await sponsorshipService.getSponsors(campaign._id);

                    // Calculate totals for paid and pending sponsors
                    const paidSponsors = sponsors.filter((s) => s.paymentStatus === 'paid');
                    const pendingSponsors = sponsors.filter((s) => s.paymentStatus === 'pending');

                    const totalPledged = paidSponsors.reduce((sum, s) => sum + s.amount, 0);
                    const totalPending = pendingSponsors.reduce((sum, s) => sum + s.amount, 0);

                    let positionsClaimed = 0;
                    let positionsTotal = 0;

                    // For fixed/positional campaigns, get layout info
                    if (campaign.campaignType !== 'pay-what-you-want') {
                        const layout = await campaignService.getLayout(campaign._id);
                        if (layout) {
                            positionsTotal = layout.placements.length;
                            positionsClaimed = layout.placements.filter((p) => p.isTaken).length;
                        }
                    }

                    statsMap.set(campaign._id, {
                        totalPledged,
                        totalPending,
                        sponsorCount: paidSponsors.length,
                        pendingCount: pendingSponsors.length,
                        positionsClaimed,
                        positionsTotal,
                    });
                } catch (error) {
                    console.error(`Failed to load stats for campaign ${campaign._id}`, error);
                }
            })
        );

        setCampaignStats(statsMap);
    };

    const handleEditClick = (campaign: Campaign) => {
        setEditingCampaign(campaign);
        setIsEditModalVisible(true);
    };

    const handleEditSuccess = () => {
        setIsEditModalVisible(false);
        setEditingCampaign(null);
        refetch(); // Refetch campaigns using TanStack Query
        message.success('Campaign updated successfully');
    };

    const handleEditCancel = () => {
        setIsEditModalVisible(false);
        setEditingCampaign(null);
    };

    const getRemainingDays = (endDate?: string | Date) => {
        if (!endDate) return null;
        const end = new Date(endDate);
        const now = new Date();
        const diff = end.getTime() - now.getTime();
        const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    if (isLoading) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!campaigns || campaigns.length === 0) {
        return (
            <div style={{ padding: 40 }}>
                <Empty
                    description="No campaigns yet"
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/campaigns/create' })}>
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
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate({ to: '/campaigns/create' })}>
                    Create Campaign
                </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {campaigns.map((campaign) => {
                    const remainingDays = getRemainingDays(campaign.endDate);
                    const stats = campaignStats.get(campaign._id);

                    return (
                        <div key={campaign._id}>
                            <Card>
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
                                            {campaign.isClosed ? (
                                                <Tag color="red">Closed</Tag>
                                            ) : (
                                                <Tag color="green">Active</Tag>
                                            )}
                                        </div>

                                        {campaign.shortDescription && (
                                            <p
                                                style={{
                                                    color: '#666',
                                                    marginBottom: 12,
                                                    fontSize: 14,
                                                }}
                                            >
                                                {campaign.shortDescription}
                                            </p>
                                        )}

                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                            <div>
                                                <strong>Type:</strong>{' '}
                                                <Tag>
                                                    {campaign.campaignType === 'fixed'
                                                        ? 'Fixed Price'
                                                        : campaign.campaignType === 'positional'
                                                            ? 'Positional Pricing'
                                                            : 'Pay What You Want'}
                                                </Tag>
                                            </div>
                                            <div>
                                                <strong>Garment:</strong> {campaign.garmentType}
                                            </div>
                                            <div>
                                                <strong>Currency:</strong> {campaign.currency}
                                            </div>
                                        </div>
                                    </Col>

                                    {/* Right side - Stats */}
                                    <Col flex="none" style={{ minWidth: 450 }}>
                                        {stats && (
                                            <Row gutter={16}>
                                                {/* Total Pledged */}
                                                <Col span={8}>
                                                    <Statistic
                                                        title="Total Raised"
                                                        value={stats.totalPledged + stats.totalPending}
                                                        prefix={campaign.currency}
                                                        precision={2}
                                                        valueStyle={{
                                                            fontSize: 20,
                                                            color: '#3f8600',
                                                            fontWeight: 600,
                                                        }}
                                                    />
                                                    {stats.totalPending > 0 && (
                                                        <div
                                                            style={{
                                                                fontSize: 12,
                                                                color: '#faad14',
                                                                marginTop: 4,
                                                            }}
                                                        >
                                                            {campaign.currency} ${stats.totalPending.toFixed(2)} pending
                                                        </div>
                                                    )}
                                                </Col>

                                                {/* Positions for fixed/positional campaigns */}
                                                {campaign.campaignType !== 'pay-what-you-want' &&
                                                    stats.positionsTotal > 0 && (
                                                        <Col span={8}>
                                                            <Statistic
                                                                title="Positions"
                                                                value={stats.positionsClaimed}
                                                                suffix={`/ ${stats.positionsTotal}`}
                                                                valueStyle={{ fontSize: 20, fontWeight: 600 }}
                                                            />
                                                            <div
                                                                style={{
                                                                    fontSize: 12,
                                                                    color: '#888',
                                                                    marginTop: 4,
                                                                }}
                                                            >
                                                                {stats.positionsTotal - stats.positionsClaimed} remaining
                                                            </div>
                                                        </Col>
                                                    )}

                                                {/* Sponsor count for pay-what-you-want campaigns */}
                                                {campaign.campaignType === 'pay-what-you-want' && (
                                                    <Col span={8}>
                                                        <Statistic
                                                            title="Sponsors"
                                                            value={stats.sponsorCount}
                                                            valueStyle={{ fontSize: 20, fontWeight: 600 }}
                                                        />
                                                    </Col>
                                                )}

                                                {/* Days Remaining */}
                                                {remainingDays !== null && !campaign.isClosed && (
                                                    <Col span={8}>
                                                        <Statistic
                                                            title="Days Left"
                                                            value={remainingDays}
                                                            suffix="days"
                                                            valueStyle={{
                                                                fontSize: 20,
                                                                fontWeight: 600,
                                                                color: remainingDays < 7 ? '#ff4d4f' : '#1890ff',
                                                            }}
                                                        />
                                                    </Col>
                                                )}
                                            </Row>
                                        )}
                                    </Col>

                                    {/* Action Buttons */}
                                    <Col flex="none">
                                        <div
                                            style={{
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '8px',
                                            }}
                                        >
                                            <Button
                                                type="primary"
                                                icon={<EyeOutlined />}
                                                onClick={() => navigate({ to: '/campaigns/$id', params: { id: campaign._id } })}
                                                block
                                            >
                                                View Details
                                            </Button>
                                            <Button
                                                icon={<EditOutlined />}
                                                onClick={() => handleEditClick(campaign)}
                                                disabled={campaign.isClosed}
                                                block
                                            >
                                                Edit Campaign
                                            </Button>
                                        </div>
                                    </Col>
                                </Row>
                            </Card>
                        </div>
                    );
                })}
            </div>

            <EditCampaignModal
                visible={isEditModalVisible}
                campaign={editingCampaign}
                onCancel={handleEditCancel}
                onSuccess={handleEditSuccess}
            />
        </div>
    );
};

export default MyCampaigns;
