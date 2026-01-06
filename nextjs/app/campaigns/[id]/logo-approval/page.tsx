'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  Spin,
  Empty,
  message,
  Button,
  Typography,
  Alert,
  Tabs,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import sponsorshipService from '@/lib/services/sponsorship.service';
import campaignService from '@/lib/services/campaign.service';
import LogoApprovalCard from '@/components/ui/LogoApprovalCard';
import type { SponsorEntry, Campaign } from '@/types/campaign.types';

const { Title, Text } = Typography;

export default function LogoApprovalPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [pendingLogos, setPendingLogos] = useState<SponsorEntry[]>([]);
  const [allSponsors, setAllSponsors] = useState<SponsorEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('pending');

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    try {
      // Load campaign details
      const campaignData = await campaignService.getCampaignById(id);
      setCampaign(campaignData);

      // Load pending logos
      const pending = await sponsorshipService.getPendingLogos(id);
      setPendingLogos(pending);

      // Load all sponsors to show approved/rejected
      const all = await sponsorshipService.getSponsors(id);
      setAllSponsors(all);
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Failed to load logo approvals'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (sponsorId: string) => {
    try {
      await sponsorshipService.approveLogo(sponsorId, {
        approved: true,
      });
      message.success('Logo approved successfully!');
      await loadData(); // Reload data
    } catch (error: any) {
      message.error(
        error.response?.data?.message || 'Failed to approve logo'
      );
    }
  };

  const handleReject = async (sponsorId: string, reason: string) => {
    try {
      await sponsorshipService.approveLogo(sponsorId, {
        approved: false,
        rejectionReason: reason,
      });
      message.success('Logo rejected');
      await loadData(); // Reload data
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to reject logo');
    }
  };

  const approvedLogos = allSponsors.filter(
    (s) => s.sponsorType === 'logo' && s.logoApprovalStatus === 'approved'
  );
  const rejectedLogos = allSponsors.filter(
    (s) => s.sponsorType === 'logo' && s.logoApprovalStatus === 'rejected'
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 20px' }}>
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>Loading logo approvals...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push(`/campaigns/${id}`)}
          style={{ marginBottom: 16 }}
        >
          Back to Campaign
        </Button>

        <Title level={2}>Logo Approvals</Title>
        {campaign && (
          <Text type="secondary">
            Campaign: {campaign.title}
          </Text>
        )}
      </div>

      {pendingLogos.length > 0 && (
        <Alert
          message={`${pendingLogos.length} logo${pendingLogos.length === 1 ? '' : 's'} pending approval`}
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'pending',
            label: `Pending (${pendingLogos.length})`,
            children: (
              <div>
                {pendingLogos.length === 0 ? (
                  <Empty description="No pending logo approvals" />
                ) : (
                  pendingLogos.map((sponsor) => (
                    <LogoApprovalCard
                      key={sponsor._id}
                      sponsor={sponsor}
                      onApprove={handleApprove}
                      onReject={handleReject}
                    />
                  ))
                )}
              </div>
            ),
          },
          {
            key: 'approved',
            label: `Approved (${approvedLogos.length})`,
            children: (
              <div>
                {approvedLogos.length === 0 ? (
                  <Empty description="No approved logos yet" />
                ) : (
                  approvedLogos.map((sponsor) => (
                    <Card key={sponsor._id} style={{ marginBottom: 16 }}>
                      <Text strong>{sponsor.name}</Text> - Approved
                    </Card>
                  ))
                )}
              </div>
            ),
          },
        ]}
      />
    </div>
  );
}

