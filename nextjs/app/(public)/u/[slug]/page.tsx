'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Spin,
  message,
  Empty,
  Typography,
  Divider,
  Button,
} from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import userService from '@/lib/services/user.service';
import authService from '@/lib/services/auth.service';
import OrganizerProfileHeader from '@/components/ui/OrganizerProfileHeader';
import CampaignCard from '@/components/ui/CampaignCard';
import PublicHeader from '@/components/layouts/PublicHeader';
import PublicFooter from '@/components/layouts/PublicFooter';
import type { OrganizerPublicProfile } from '@/types/campaign.types';

const { Title } = Typography;

export default function OrganizerLandingPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
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
      const profile = await userService.getPublicProfile(slug);
      setData(profile);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Failed to load organizer profile'
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#1f1f1f',
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
          minHeight: '100vh',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          background: '#1f1f1f',
        }}
      >
        <Empty description="Organizer not found" />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1f1f1f',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        <PublicHeader />

        {/* Edit Button for Owner */}
        {isOwner && (
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button
              icon={<SettingOutlined />}
              onClick={() => router.push('/dashboard/profile')}
              style={{
                background: '#C8102E',
                borderColor: '#C8102E',
                color: '#ffffff',
              }}
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
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
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
}

