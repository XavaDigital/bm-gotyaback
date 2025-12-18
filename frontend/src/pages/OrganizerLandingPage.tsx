import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, message, Empty, Row, Col, Typography, Divider, Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import userService from '../services/user.service';
import authService from '../services/auth.service';
import OrganizerProfileHeader from '../components/OrganizerProfileHeader';
import CampaignCard from '../components/CampaignCard';
import type { OrganizerPublicProfile } from '../types/campaign.types';

const { Title } = Typography;

const OrganizerLandingPage: React.FC = () => {
    const { slug } = useParams<{ slug: string }>();
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
            <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ background: '#f5f5f5', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Empty description="Organizer not found" />
            </div>
        );
    }

    return (
        <div style={{ background: '#f5f5f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
                {/* Edit Button for Owner */}
                {isOwner && (
                    <div style={{ textAlign: 'right', marginBottom: 16 }}>
                        <Button
                            type="primary"
                            icon={<SettingOutlined />}
                            onClick={() => navigate('/dashboard/profile')}
                        >
                            Edit Profile
                        </Button>
                    </div>
                )}

                {/* Organizer Profile Header */}
                <OrganizerProfileHeader profile={data.profile} />

                <Divider />

                {/* Active Campaigns Section */}
                <div>
                    <Title level={3}>Active Campaigns</Title>
                    {data.campaigns.length === 0 ? (
                        <Empty description="No active campaigns at the moment" />
                    ) : (
                        <Row gutter={[16, 16]}>
                            {data.campaigns.map((campaign) => (
                                <Col xs={24} sm={12} md={8} key={campaign._id}>
                                    <CampaignCard campaign={campaign} />
                                </Col>
                            ))}
                        </Row>
                    )}
                </div>
            </div>
        </div>
    );
};

export default OrganizerLandingPage;

