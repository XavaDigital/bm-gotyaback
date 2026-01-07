import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Card, Button, Spin, message, Tag, Descriptions, Table, Modal, Statistic } from 'antd';
import { CloseCircleOutlined, ExportOutlined } from '@ant-design/icons';
import type { Campaign, SponsorEntry, ShirtLayout } from '../types/campaign.types';
import campaignService from '../services/campaign.service';
import sponsorshipService from '../services/sponsorship.service';
import ShareButton from '../components/ShareButton';

const CampaignDetail: React.FC = () => {
    const { id } = useParams({ from: '/campaigns/$id' });
    const navigate = useNavigate();
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
    const [layout, setLayout] = useState<ShirtLayout | null>(null);
    const [loading, setLoading] = useState(true);
    const [closingCampaign, setClosingCampaign] = useState(false);
    const [markingAsPaid, setMarkingAsPaid] = useState<string | null>(null);

    useEffect(() => {
        if (id) {
            loadCampaignData();
        }
    }, [id]);

    const loadCampaignData = async () => {
        try {
            const [campaignData, sponsorsData] = await Promise.all([
                campaignService.getCampaignById(id!),
                sponsorshipService.getSponsors(id!),
            ]);

            setCampaign(campaignData);
            setSponsors(sponsorsData);

            // Load layout if campaign is placement or fixed type
            if (campaignData.campaignType !== 'donation') {
                try {
                    const layoutData = await campaignService.getLayout(id!);
                    setLayout(layoutData);
                } catch (error) {
                    // Layout might not exist yet
                }
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to load campaign');
            navigate({ to: '/dashboard' });
        } finally {
            setLoading(false);
        }
    };

    const handleCloseCampaign = () => {
        Modal.confirm({
            title: 'Close Campaign?',
            content: 'Are you sure you want to close this campaign? This action cannot be undone.',
            okText: 'Yes, Close Campaign',
            okType: 'danger',
            onOk: async () => {
                setClosingCampaign(true);
                try {
                    await campaignService.closeCampaign(id!);
                    message.success('Campaign closed successfully');
                    loadCampaignData();
                } catch (error: any) {
                    message.error(error.response?.data?.message || 'Failed to close campaign');
                } finally {
                    setClosingCampaign(false);
                }
            },
        });
    };

    const handleMarkAsPaid = async (sponsorshipId: string) => {
        setMarkingAsPaid(sponsorshipId);
        try {
            await sponsorshipService.markAsPaid(sponsorshipId);
            message.success('Marked as paid');
            loadCampaignData();
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to mark as paid');
        } finally {
            setMarkingAsPaid(null);
        }
    };

    const sponsorColumns = [
        {
            title: 'Name',
            dataIndex: 'name',
            key: 'name',
        },
        {
            title: 'Email',
            dataIndex: 'email',
            key: 'email',
        },
        {
            title: 'Phone',
            dataIndex: 'phone',
            key: 'phone',
            render: (phone?: string) => phone || 'N/A',
        },
        {
            title: 'Position',
            dataIndex: 'positionId',
            key: 'positionId',
            render: (positionId?: string) => positionId || 'N/A',
        },
        {
            title: 'Amount',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number) => `${campaign?.currency || 'NZD'} $${amount}`,
        },
        {
            title: 'Payment Method',
            dataIndex: 'paymentMethod',
            key: 'paymentMethod',
        },
        {
            title: 'Status',
            dataIndex: 'paymentStatus',
            key: 'paymentStatus',
            render: (status: string) => (
                <Tag color={status === 'paid' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
                    {status.toUpperCase()}
                </Tag>
            ),
        },
        {
            title: 'Action',
            key: 'action',
            render: (_: any, record: SponsorEntry) =>
                record.paymentStatus === 'pending' ? (
                    <Button
                        size="small"
                        onClick={() => handleMarkAsPaid(record._id)}
                        loading={markingAsPaid === record._id}
                    >
                        Mark as Paid
                    </Button>
                ) : null,
        },
    ];

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: 60 }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!campaign) {
        return null;
    }

    const totalRaised = sponsors
        .filter((s) => s.paymentStatus === 'paid')
        .reduce((sum, s) => sum + s.amount, 0);

    const pendingAmount = sponsors
        .filter((s) => s.paymentStatus === 'pending')
        .reduce((sum, s) => sum + s.amount, 0);

    const spotsTaken = layout?.placements.filter((p) => p.isTaken).length || 0;
    const totalSpots = layout?.placements.length || 0;

    const publicUrl = `${window.location.origin}/campaign/${campaign.slug}`;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1>{campaign.title}</h1>
                <div>
                    <ShareButton
                        url={publicUrl}
                        title={campaign.title}
                        description={campaign.description || `Support ${campaign.title}`}
                    />
                    <Button
                        onClick={() => window.open(`/campaign/${campaign.slug}`, '_blank')}
                        style={{ marginLeft: 8, marginRight: 8 }}
                        icon={<ExportOutlined />}
                    >
                        View Public Page
                    </Button>
                    {!campaign.isClosed && (
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            onClick={handleCloseCampaign}
                            loading={closingCampaign}
                        >
                            Close Campaign
                        </Button>
                    )}
                </div>
            </div>

            <Card title="Campaign Statistics" style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', gap: 24 }}>
                    <Statistic
                        title="Total Raised"
                        value={totalRaised}
                        prefix={campaign.currency}
                        suffix="$"
                        valueStyle={{ color: '#3f8600' }}
                    />
                    <Statistic
                        title="Pending Payments"
                        value={pendingAmount}
                        prefix={campaign.currency}
                        suffix="$"
                        valueStyle={{ color: '#cf1322' }}
                    />
                    {layout && (
                        <Statistic
                            title="Spots Filled"
                            value={spotsTaken}
                            suffix={`/ ${totalSpots}`}
                        />
                    )}
                    <Statistic title="Total Sponsors" value={sponsors.length} />
                </div>
            </Card>

            <Card title="Campaign Details" style={{ marginBottom: 24 }}>
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Status">
                        {campaign.isClosed ? (
                            <Tag color="red">Closed</Tag>
                        ) : (
                            <Tag color="green">Active</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Campaign Type">
                        {campaign.campaignType}
                    </Descriptions.Item>
                    <Descriptions.Item label="Garment">{campaign.garmentType}</Descriptions.Item>
                    <Descriptions.Item label="Currency">{campaign.currency}</Descriptions.Item>
                    <Descriptions.Item label="Online Payments (Stripe)">
                        {campaign.enableStripePayments ? (
                            <Tag color="green">Enabled</Tag>
                        ) : (
                            <Tag color="red">Disabled</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Offline Payments">
                        {campaign.allowOfflinePayments ? (
                            <Tag color="green">Enabled</Tag>
                        ) : (
                            <Tag color="red">Disabled</Tag>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Public URL">
                        <a href={`/campaign/${campaign.slug}`} target="_blank" rel="noopener noreferrer">
                            /campaign/{campaign.slug}
                        </a>
                    </Descriptions.Item>
                    <Descriptions.Item label="End Date">
                        {campaign.endDate
                            ? new Date(campaign.endDate).toLocaleDateString()
                            : 'No end date'}
                    </Descriptions.Item>
                </Descriptions>
            </Card>

            <Card title="Sponsors">
                <Table
                    dataSource={sponsors}
                    columns={sponsorColumns}
                    rowKey="_id"
                    pagination={{ pageSize: 10 }}
                />
            </Card>
        </div>
    );
};

export default CampaignDetail;
