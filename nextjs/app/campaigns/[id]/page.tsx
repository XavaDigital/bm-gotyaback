'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Button,
  Card,
  Spin,
  message,
  Descriptions,
  Tag,
  Space,
  Statistic,
  Row,
  Col,
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  EyeOutlined,
  TeamOutlined,
  DollarOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import campaignService from '@/lib/services/campaign.service';
import sponsorshipService from '@/lib/services/sponsorship.service';
import type { Campaign, SponsorEntry } from '@/types/campaign.types';
import { formatCurrency, formatDate } from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sponsors, setSponsors] = useState<SponsorEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCampaign();
  }, [id]);

  const loadCampaign = async () => {
    try {
      const [campaignData, sponsorsData] = await Promise.all([
        campaignService.getCampaignById(id),
        sponsorshipService.getSponsors(id),
      ]);
      setCampaign(campaignData);
      setSponsors(sponsorsData);
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return <div>Campaign not found</div>;
  }

  const paidSponsors = sponsors.filter((s) => s.paymentStatus === 'paid');
  const pendingSponsors = sponsors.filter((s) => s.paymentStatus === 'pending');
  const totalRevenue = paidSponsors.reduce((sum, s) => sum + s.amount, 0);
  const pendingRevenue = pendingSponsors.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard">
          <Button icon={<ArrowLeftOutlined />} className="mb-4">
            Back to Dashboard
          </Button>
        </Link>

        <div className="flex justify-between items-start">
          <div>
            <Title level={2} className="!mb-2">
              {campaign.title}
            </Title>
            <Space>
              <Tag color={campaign.isClosed ? 'red' : 'green'}>
                {campaign.isClosed ? 'Closed' : 'Active'}
              </Tag>
              <Tag>{campaign.campaignType}</Tag>
              <Tag>{campaign.garmentType}</Tag>
            </Space>
          </div>
          <Space>
            <Link href={`/c/${campaign.slug}`} target="_blank">
              <Button icon={<EyeOutlined />}>View Public Page</Button>
            </Link>
            <Link href={`/campaigns/${id}/layout-config`}>
              <Button icon={<EditOutlined />}>Configure Layout</Button>
            </Link>
            <Link href={`/campaigns/${id}/logo-approval`}>
              <Button>Logo Approvals</Button>
            </Link>
          </Space>
        </div>
      </div>

      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Sponsors"
              value={sponsors.length}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Paid Sponsors"
              value={paidSponsors.length}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Revenue"
              value={totalRevenue}
              prefix={campaign.currency}
              precision={2}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Revenue"
              value={pendingRevenue}
              prefix={campaign.currency}
              precision={2}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      <Card title="Campaign Details" className="mb-6">
        <Descriptions column={{ xs: 1, sm: 2 }}>
          <Descriptions.Item label="Slug">{campaign.slug}</Descriptions.Item>
          <Descriptions.Item label="Currency">{campaign.currency}</Descriptions.Item>
          <Descriptions.Item label="Created">{formatDate(campaign.createdAt)}</Descriptions.Item>
          <Descriptions.Item label="Updated">{formatDate(campaign.updatedAt)}</Descriptions.Item>
          <Descriptions.Item label="Stripe Payments">
            {campaign.enableStripePayments ? 'Enabled' : 'Disabled'}
          </Descriptions.Item>
          <Descriptions.Item label="Offline Payments">
            {campaign.allowOfflinePayments ? 'Allowed' : 'Not Allowed'}
          </Descriptions.Item>
        </Descriptions>
      </Card>
    </div>
  );
}

