'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Typography,
  Card,
  Button,
  Row,
  Col,
  Statistic,
  Tag,
  Spin,
  Alert,
  Space,
  Progress,
} from 'antd';
import {
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  HeartOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import campaignService from '@/lib/services/campaign.service';
import type { Campaign } from '@/types/campaign.types';
import { formatDate } from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;

export default function CampaignPublicPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCampaign();
  }, [slug]);

  const loadCampaign = async () => {
    try {
      const data = await campaignService.getCampaignBySlug(slug);
      setCampaign(data);
    } catch (err: any) {
      console.error('Failed to load campaign:', err);
      setError(err.response?.data?.message || 'Campaign not found');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Alert
            message="Campaign Not Found"
            description={error || 'The campaign you are looking for does not exist.'}
            type="error"
            showIcon
          />
        </Card>
      </div>
    );
  }

  const progressPercent = campaign.stats?.totalPositions
    ? Math.round((campaign.stats.claimedPositions / campaign.stats.totalPositions) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Image */}
      {campaign.headerImageUrl ? (
        <div
          className="h-64 md:h-96 bg-cover bg-center relative"
          style={{ backgroundImage: `url(${campaign.headerImageUrl})` }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-40" />
        </div>
      ) : (
        <div className="h-64 md:h-96 bg-gradient-to-br from-blue-500 to-purple-600 relative">
          <div className="absolute inset-0 flex items-center justify-center">
            <TrophyOutlined className="text-9xl text-white opacity-20" />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 -mt-20 relative z-10 pb-12">
        <Card className="shadow-xl mb-6">
          <Space direction="vertical" size="large" className="w-full">
            <div>
              <div className="flex items-start justify-between mb-2">
                <Title level={1} className="!mb-0">
                  {campaign.title}
                </Title>
                {campaign.isClosed && (
                  <Tag color="red" className="text-base px-4 py-1">
                    Closed
                  </Tag>
                )}
              </div>
              {campaign.shortDescription && (
                <Paragraph className="text-lg text-gray-600">
                  {campaign.shortDescription}
                </Paragraph>
              )}
            </div>

            {/* Stats */}
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card className="bg-blue-50 border-blue-200">
                  <Statistic
                    title="Total Sponsors"
                    value={campaign.stats?.sponsorCount || 0}
                    prefix={<TeamOutlined />}
                    styles={{ content: { color: '#1890ff' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="bg-green-50 border-green-200">
                  <Statistic
                    title="Positions Claimed"
                    value={campaign.stats?.claimedPositions || 0}
                    suffix={`/ ${campaign.stats?.totalPositions || 0}`}
                    prefix={<DollarOutlined />}
                    styles={{ content: { color: '#52c41a' } }}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card className="bg-purple-50 border-purple-200">
                  <Statistic
                    title="Remaining"
                    value={campaign.stats?.remainingPositions || 0}
                    prefix={<TrophyOutlined />}
                    styles={{ content: { color: '#722ed1' } }}
                  />
                </Card>
              </Col>
            </Row>

            {/* Progress */}
            <div>
              <Text strong className="block mb-2">
                Campaign Progress
              </Text>
              <Progress percent={progressPercent} status="active" />
            </div>

            {/* Description */}
            {campaign.description && (
              <div>
                <Title level={3}>About This Campaign</Title>
                <Paragraph className="text-base whitespace-pre-wrap">
                  {campaign.description}
                </Paragraph>
              </div>
            )}

            {/* CTA Button */}
            {!campaign.isClosed && (
              <Button
                type="primary"
                size="large"
                icon={<HeartOutlined />}
                block
                href={`/c/${campaign.slug}/sponsor`}
              >
                Become a Sponsor
              </Button>
            )}

            {/* Campaign Info */}
            <div className="pt-4 border-t border-gray-200">
              <Space split="|" className="text-gray-500">
                <Text type="secondary">
                  <ClockCircleOutlined className="mr-1" />
                  Created {formatDate(campaign.createdAt)}
                </Text>
                {campaign.endDate && (
                  <Text type="secondary">
                    Ends {formatDate(campaign.endDate)}
                  </Text>
                )}
                <Text type="secondary">
                  {campaign.garmentType.charAt(0).toUpperCase() + campaign.garmentType.slice(1)}
                </Text>
              </Space>
            </div>
          </Space>
        </Card>
      </div>
    </div>
  );
}

