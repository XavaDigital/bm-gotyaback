import React, { useEffect, useState } from 'react';
import { useParams } from '@tanstack/react-router';
import { Card, Spin, message, Tag, Statistic, List, Empty, Button } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import type { Campaign, ShirtLayout as ShirtLayoutType, SponsorEntry } from '../types/campaign.types';
import campaignService from '../services/campaign.service';
import sponsorshipService from '../services/sponsorship.service';
import ShirtLayout from '../components/ShirtLayout';
import SponsorCheckoutModal from '../components/SponsorCheckoutModal';
import PublicHeader from '../components/PublicHeader';
import PublicFooter from '../components/PublicFooter';

const PublicCampaign: React.FC = () => {
    const { slug } = useParams({ from: '/campaign/$slug' });
    const [campaign, setCampaign] = useState<Campaign | null>(null);
    const [layout, setLayout] = useState<ShirtLayoutType | null>(null);
    const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPosition, setSelectedPosition] = useState<string | undefined>();
    const [selectedAmount, setSelectedAmount] = useState<number>(0);
    const [checkoutVisible, setCheckoutVisible] = useState(false);

    useEffect(() => {
        if (slug) {
            loadCampaignData();
        }
    }, [slug]);

    const loadCampaignData = async () => {
        try {
            const campaignData = await campaignService.getPublicCampaign(slug!);
            setCampaign(campaignData);

            // Load public sponsors
            const sponsorsData = await sponsorshipService.getPublicSponsors(campaignData._id);
            setSponsors(sponsorsData);

            // Load layout if needed
            if (campaignData.campaignType !== 'donation') {
                try {
                    const layoutData = await campaignService.getLayout(campaignData._id);
                    setLayout(layoutData);
                } catch (error) {
                    console.error('No layout found');
                }
            }
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Campaign not found');
        } finally {
            setLoading(false);
        }
    };

    const handlePositionSelect = (positionId: string, price: number) => {
        setSelectedPosition(positionId);
        setSelectedAmount(price);
        setCheckoutVisible(true);
    };

    const handleSponsorshipSubmit = async (data: any) => {
        try {
            await sponsorshipService.createSponsorship(campaign!._id, data);
            setCheckoutVisible(false);
            setSelectedPosition(undefined);
            await loadCampaignData(); // Reload to update layout
            message.success('Sponsorship submitted successfully!');
        } catch (error) {
            throw error;
        }
    };

    // Auto-reload campaign data periodically after modal closes to catch webhook updates
    useEffect(() => {
        if (!checkoutVisible && campaign) {
            // Poll for updates every 2 seconds for 10 seconds after modal closes
            // This catches webhook updates for card payments
            let pollCount = 0;
            const maxPolls = 5;

            const pollInterval = setInterval(() => {
                pollCount++;
                loadCampaignData();

                if (pollCount >= maxPolls) {
                    clearInterval(pollInterval);
                }
            }, 2000);

            return () => clearInterval(pollInterval);
        }
    }, [checkoutVisible]);

    if (loading) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: 60,
                    background: '#1f1f1f',
                    minHeight: '100vh',
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    if (!campaign) {
        return (
            <div
                style={{
                    textAlign: 'center',
                    padding: 60,
                    background: '#1f1f1f',
                    minHeight: '100vh',
                }}
            >
                <Empty description="Campaign not found" />
            </div>
        );
    }

    const isClosed = campaign.isClosed || (campaign.endDate && new Date() > new Date(campaign.endDate));
    const deadline = campaign.endDate ? new Date(campaign.endDate).getTime() : undefined;
    const totalSpots = layout?.placements.length || 0;
    const takenSpots = layout?.placements.filter((p) => p.isTaken).length || 0;

    return (
        <div
            style={{
                background: '#1f1f1f',
                minHeight: '100vh',
            }}
        >
            <div
                style={{
                    maxWidth: 900,
                    margin: '0 auto',
                    padding: '0 20px',
                }}
            >
                <PublicHeader />

                {/* Title and Time Remaining Row */}
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 24,
                    }}
                >
                    <h1 style={{ margin: 0, color: '#ffffff' }}>{campaign.title}</h1>
                    {!isClosed && deadline && (
                        <Card variant="borderless" style={{ textAlign: 'center' }}>
                            <Statistic.Timer
                                type="countdown"
                                title={
                                    <>
                                        <ClockCircleOutlined /> Time Remaining
                                    </>
                                }
                                value={deadline}
                                format="D [days] H [hrs] m [min]"
                            />
                        </Card>
                    )}
                </div>

                {/* Header Image */}
                {campaign.headerImageUrl && (
                    <div style={{ marginBottom: 24 }}>
                        <img
                            src={campaign.headerImageUrl}
                            alt={campaign.title}
                            style={{
                                width: '100%',
                                height: 'auto',
                                borderRadius: 8,
                                objectFit: 'cover',
                            }}
                        />
                    </div>
                )}

                {/* Description - Full Width */}
                {campaign.description && (
                    <Card style={{ marginBottom: 24 }}>
                        <div
                            style={{ fontSize: 16, lineHeight: 1.6 }}
                            dangerouslySetInnerHTML={{ __html: campaign.description }}
                        />
                    </Card>
                )}

                {/* Campaign Info Card */}
            <Card style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ marginTop: 16 }}>
                            <Tag>{campaign.garmentType}</Tag>
                            <Tag>
                                {campaign.campaignType === 'fixed'
                                    ? 'Fixed Price'
                                    : campaign.campaignType === 'placement'
                                        ? 'Placement-Based'
                                        : 'Donation Only'}
                            </Tag>
                            {isClosed ? (
                                <Tag color="red">Campaign Closed</Tag>
                            ) : (
                                <Tag color="green">Active</Tag>
                            )}
                        </div>
                    </div>
                </div>
            </Card>

            {layout && (
                <Card
                    title="Select Your Sponsorship Spot"
                    style={{ marginBottom: 24 }}
                    extra={
                        <div style={{ fontSize: 14 }}>
                            {takenSpots} / {totalSpots} spots filled
                        </div>
                    }
                >
                    {isClosed ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
                            <h3>This campaign has ended</h3>
                            <p>No more sponsorships can be accepted.</p>
                        </div>
                    ) : (
                        <>
                            <div style={{ marginBottom: 16, padding: 12, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
                                <strong>Legend:</strong>
                                <span style={{ marginLeft: 16 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 16,
                                            height: 16,
                                            backgroundColor: '#52c41a',
                                            borderRadius: 2,
                                            marginRight: 4,
                                        }}
                                    />
                                    Available
                                </span>
                                <span style={{ marginLeft: 16 }}>
                                    <span
                                        style={{
                                            display: 'inline-block',
                                            width: 16,
                                            height: 16,
                                            backgroundColor: '#d9d9d9',
                                            borderRadius: 2,
                                            marginRight: 4,
                                        }}
                                    />
                                    Taken
                                </span>
                            </div>
                            <ShirtLayout
                                layout={layout}
                                selectedPosition={selectedPosition}
                                onPositionSelect={handlePositionSelect}
                                currency={campaign.currency}
                            />
                            <div style={{ marginTop: 24, textAlign: 'center', backgroundColor: '#f9f9f9', padding: 20, borderRadius: 8 }}>
                                <h4 style={{ marginBottom: 12, color: '#333' }}>Not looking for a spot on the shirt?</h4>
                                <p style={{ marginBottom: 16, color: '#666' }}>You can still support this campaign by making a general donation of any amount.</p>
                                <Button
                                    type="primary"
                                    onClick={() => {
                                        setSelectedPosition(undefined);
                                        setSelectedAmount(0);
                                        setCheckoutVisible(true);
                                    }}
                                >
                                    Make a General Donation
                                </Button>
                            </div>
                        </>
                    )}
                </Card>
            )}



            <Card title={`Our Sponsors (${sponsors.length})`}>
                {sponsors.length === 0 ? (
                    <Empty description="No sponsors yet. Be the first!" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                ) : (
                    <List
                        dataSource={sponsors}
                        renderItem={(sponsor) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={sponsor.name}
                                    description={sponsor.message || 'No message'}
                                />
                                {sponsor.positionId && (
                                    <Tag>{sponsor.positionId}</Tag>
                                )}
                            </List.Item>
                        )}
                    />
                )}
            </Card>

            <SponsorCheckoutModal
                visible={checkoutVisible}
                onCancel={() => {
                    setCheckoutVisible(false);
                    setSelectedPosition(undefined);
                }}
                onSubmit={handleSponsorshipSubmit}
                positionId={selectedPosition}
                amount={selectedAmount}
                currency={campaign.currency}
                campaignId={campaign._id}
            />

                <PublicFooter />
            </div>
        </div>
    );
};

export default PublicCampaign;
