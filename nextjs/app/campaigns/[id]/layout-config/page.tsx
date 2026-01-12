'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Card,
  Form,
  InputNumber,
  Radio,
  Button,
  message,
  Spin,
  Space,
  Alert,
} from 'antd';
import { SaveOutlined, ArrowLeftOutlined, LayoutOutlined } from '@ant-design/icons';
import Link from 'next/link';
import campaignService from '@/lib/services/campaign.service';
import type { Campaign, ShirtLayout, CreateLayoutRequest } from '@/types/campaign.types';

const { Title, Text, Paragraph } = Typography;

export default function LayoutConfigPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const [form] = Form.useForm();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [layout, setLayout] = useState<ShirtLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, [campaignId]);

  const loadData = async () => {
    try {
      const [campaignData, layoutData] = await Promise.all([
        campaignService.getCampaignById(campaignId),
        campaignService.getLayout(campaignId).catch(() => null),
      ]);
      
      setCampaign(campaignData);
      setLayout(layoutData);

      if (layoutData) {
        form.setFieldsValue({
          totalPositions: layoutData.totalPositions,
          columns: layoutData.columns,
          arrangement: layoutData.arrangement || 'horizontal',
          maxSponsors: layoutData.maxSponsors,
        });
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('Failed to load campaign data');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    if (!campaign) return;

    setSubmitting(true);
    try {
      const layoutData: CreateLayoutRequest = {
        totalPositions: values.totalPositions,
        columns: values.columns,
        arrangement: values.arrangement,
        maxSponsors: values.maxSponsors,
        campaignType: campaign.campaignType,
        pricingConfig: campaign.pricingConfig,
      };

      if (layout) {
        await campaignService.updateLayout(campaignId, layoutData);
        message.success('Layout updated successfully!');
      } else {
        await campaignService.createLayout(campaignId, layoutData);
        message.success('Layout created successfully!');
      }

      router.push('/dashboard');
    } catch (error: any) {
      console.error('Failed to save layout:', error);
      message.error(error.response?.data?.message || 'Failed to save layout');
    } finally {
      setSubmitting(false);
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
    return (
      <Alert message="Campaign not found" type="error" showIcon />
    );
  }

  const isGridLayout = campaign.layoutStyle === 'grid';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard">
          <Button type="text" icon={<ArrowLeftOutlined />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>

      <Card>
        <div className="mb-6">
          <Title level={2}>
            <LayoutOutlined className="mr-2" />
            Configure Layout
          </Title>
          <Paragraph>
            Set up the sponsor layout for <strong>{campaign.title}</strong>
          </Paragraph>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            totalPositions: 50,
            columns: 10,
            arrangement: 'horizontal',
            maxSponsors: 100,
          }}
        >
          {isGridLayout ? (
            <Space direction="vertical" size="large" className="w-full">
              <Alert
                message="Grid Layout"
                description="Configure a fixed grid of sponsor positions on the garment."
                type="info"
                showIcon
              />

              <Form.Item
                name="totalPositions"
                label="Total Positions"
                rules={[{ required: true, message: 'Please enter total positions' }]}
                extra="Total number of sponsor positions available"
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={200}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="columns"
                label="Number of Columns"
                rules={[{ required: true, message: 'Please enter number of columns' }]}
                extra="How many columns in the grid"
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={20}
                  style={{ width: '100%' }}
                />
              </Form.Item>

              <Form.Item
                name="arrangement"
                label="Position Numbering"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Space direction="vertical">
                    <Radio value="horizontal">
                      <strong>Horizontal</strong> - Number positions left to right, then down
                    </Radio>
                    <Radio value="vertical">
                      <strong>Vertical</strong> - Number positions top to bottom, then right
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>
            </Space>
          ) : (
            <Space direction="vertical" size="large" className="w-full">
              <Alert
                message="Flexible Layout"
                description="Configure a flexible layout where sponsors are arranged dynamically."
                type="info"
                showIcon
              />

              <Form.Item
                name="maxSponsors"
                label="Maximum Sponsors"
                rules={[{ required: true, message: 'Please enter maximum sponsors' }]}
                extra="Maximum number of sponsors allowed"
              >
                <InputNumber
                  size="large"
                  min={1}
                  max={500}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Space>
          )}

          <Form.Item className="mt-8">
            <Button
              type="primary"
              htmlType="submit"
              size="large"
              loading={submitting}
              icon={<SaveOutlined />}
              block
            >
              {layout ? 'Update Layout' : 'Create Layout'}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}

