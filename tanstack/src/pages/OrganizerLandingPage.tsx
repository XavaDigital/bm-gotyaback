import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Spin, message, Empty, Row, Col, Typography, Divider, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import userService from '~/services/user.service';
import authService from '~/services/auth.service';
import OrganizerProfileHeader from '~/components/OrganizerProfileHeader';
import CampaignCard from '~/components/CampaignCard';
import PublicHeader from '~/components/PublicHeader';
import PublicFooter from '~/components/PublicFooter';
import type { OrganizerPublicProfile } from '~/types/campaign.types';

const { Title } = Typography;

const OrganizerLandingPage: React.FC = () => {
    const { slug } = useParams({ from: '/u/$slug' });
    const navigate = useNavigate();
    const [data, setData] = useState<OrganizerPublicProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        if (slug) {
            loadOrganizerProfile();
            checkOwnership();
        }
    }, [slug]);

    const checkOwnership = () => {
        const currentUser = authService.getCurrentUser();
        if (currentUser?.organizerProfile?.slug === slug) {
            setIsOwner(true);
        }
    };

    const loadOrganizerProfile = async () => {
        try {
            const profileData = await userService.getPublicProfile(slug!);
            setData(profileData);
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Organizer not found');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div
                style={{
                    background: '#1f1f1f',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Spin size="large" />
            </div>
        );
    }

    if (!data) {
        return (
            <div
                style={{
                    background: '#1f1f1f',
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Empty description="Organizer not found" />
            </div>
        );
    }

    return (
        <div style={{ background: '#1f1f1f', minHeight: '100vh' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
                <PublicHeader />

                {/* Edit Button for Owner */}
                {isOwner && (
                    <div style={{ textAlign: 'right', marginBottom: 16 }}>
                        <Button
                            type="primary"
                            icon={<SettingOutlined />}
                            onClick={() => navigate({ to: '/dashboard/profile' })}
                        >
                            Edit Profile
                        </Button>
                    </div>
                )}

                {/* Organizer Profile Header */}
                <OrganizerProfileHeader profile={data.profile} />

                <Divider style={{ borderColor: '#3a3a3a' }} />

                {/* Active Campaigns Section */}
                <div>
                    <Title level={3} style={{ color: '#ffffff' }}>
                        Active Campaigns
                    </Title>
                    {data.campaigns.length === 0 ? (
                        <Empty description="No active campaigns at the moment" />
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {data.campaigns.map((campaign) => (
                                <CampaignCard key={campaign._id} campaign={campaign} />
                            ))}
                        </div>
                    )}
                </div>

                <PublicFooter />
            </div>
        </div>
    );
};

export default OrganizerLandingPage;

