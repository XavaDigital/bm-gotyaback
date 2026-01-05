'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Typography,
  Card,
  Form,
  Input,
  InputNumber,
  Radio,
  Button,
  Upload,
  message,
  Spin,
  Alert,
  Space,
} from 'antd';
import { UploadOutlined, HeartOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { UploadFile } from 'antd';
import Link from 'next/link';
import campaignService from '@/lib/services/campaign.service';
import type { Campaign, CreateSponsorshipRequest } from '@/types/campaign.types';
import { formatCurrency } from '@/lib/utils';

const { Title, Text, Paragraph } = Typography;

export default function SponsorshipFormPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [form] = Form.useForm();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Move Form.useWatch to top of component before any conditional returns
  // to comply with Rules of Hooks
  const sponsorType = Form.useWatch('sponsorType', form);

  useEffect(() => {
    loadCampaign();
  }, [slug]);

  const loadCampaign = async () => {
    try {
      const data = await campaignService.getCampaignBySlug(slug);
      setCampaign(data);
      
      // Set default amount based on pricing
      if (data.campaignType === 'fixed' && data.pricingConfig.fixedPrice) {
        form.setFieldValue('amount', data.pricingConfig.fixedPrice);
      } else if (data.campaignType === 'pay-what-you-want' && data.pricingConfig.minimumAmount) {
        form.setFieldValue('amount', data.pricingConfig.minimumAmount);
      }
    } catch (err) {
      console.error('Failed to load campaign:', err);
      message.error('Failed to load campaign');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: any) => {
    if (!campaign) return;

    setSubmitting(true);
    try {
      const sponsorshipData: CreateSponsorshipRequest = {
        name: values.name,
        email: values.email,
        phone: values.phone,
        message: values.message,
        amount: values.amount,
        paymentMethod: values.paymentMethod,
        sponsorType: values.sponsorType || 'text',
        logoFile: fileList[0]?.originFileObj,
      };

      await campaignService.createSponsorship(campaign._id, sponsorshipData);
      message.success('Thank you for your sponsorship!');
      router.push(`/c/${slug}`);
    } catch (error: any) {
      console.error('Failed to submit sponsorship:', error);
      message.error(error.response?.data?.message || 'Failed to submit sponsorship');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spin size="large" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Alert message="Campaign not found" type="error" showIcon />
        </Card>
      </div>
    );
  }

  if (campaign.isClosed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <Alert
            message="Campaign Closed"
            description="This campaign is no longer accepting sponsors."
            type="warning"
            showIcon
          />
          <div className="mt-4">
            <Link href={`/c/${slug}`}>
              <Button icon={<ArrowLeftOutlined />}>Back to Campaign</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <div className="mb-6">
            <Link href={`/c/${slug}`}>
              <Button type="text" icon={<ArrowLeftOutlined />}>
                Back to Campaign
              </Button>
            </Link>
          </div>

          <div className="text-center mb-8">
            <Title level={2}>Become a Sponsor</Title>
            <Paragraph className="text-lg">
              Support <strong>{campaign.title}</strong>
            </Paragraph>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              paymentMethod: 'card',
              sponsorType: campaign.sponsorDisplayType === 'logo-only' ? 'logo' : 'text',
            }}
          >
            <Form.Item
              name="name"
              label="Your Name"
              rules={[{ required: true, message: 'Please enter your name' }]}
            >
              <Input size="large" placeholder="John Doe" />
            </Form.Item>

            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input size="large" placeholder="your@email.com" />
            </Form.Item>

            <Form.Item
              name="phone"
              label="Phone Number"
              rules={[{ required: true, message: 'Please enter your phone number' }]}
            >
              <Input size="large" placeholder="+64 21 123 4567" />
            </Form.Item>

            <Form.Item
              name="amount"
              label="Sponsorship Amount"
              rules={[
                { required: true, message: 'Please enter an amount' },
                {
                  validator: (_, value) => {
                    const min = campaign.pricingConfig.minimumAmount || 1;
                    if (value < min) {
                      return Promise.reject(`Minimum amount is ${formatCurrency(min, campaign.currency)}`);
                    }
                    return Promise.resolve();
                  },
                },
              ]}
            >
              <InputNumber
                size="large"
                prefix={campaign.currency === 'NZD' ? 'NZ$' : campaign.currency === 'AUD' ? 'A$' : '$'}
                min={campaign.pricingConfig.minimumAmount || 1}
                style={{ width: '100%' }}
                disabled={campaign.campaignType === 'fixed'}
              />
            </Form.Item>

            {campaign.sponsorDisplayType !== 'logo-only' && campaign.sponsorDisplayType !== 'text-only' && (
              <Form.Item
                name="sponsorType"
                label="Display As"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio value="text">Text (Name)</Radio>
                  <Radio value="logo">Logo</Radio>
                </Radio.Group>
              </Form.Item>
            )}

            {sponsorType === 'logo' && (
              <Form.Item
                name="logo"
                label="Upload Logo"
                extra="Upload your logo (PNG, JPG, or SVG recommended)"
              >
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                >
                  {fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload Logo</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            )}

            <Form.Item name="message" label="Message (Optional)">
              <Input.TextArea
                rows={3}
                placeholder="Add a personal message or dedication..."
              />
            </Form.Item>

            <Form.Item
              name="paymentMethod"
              label="Payment Method"
              rules={[{ required: true }]}
            >
              <Radio.Group>
                {campaign.enableStripePayments && (
                  <Radio value="card">Credit/Debit Card</Radio>
                )}
                {campaign.allowOfflinePayments && (
                  <Radio value="cash">Cash/Bank Transfer</Radio>
                )}
              </Radio.Group>
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                block
                loading={submitting}
                icon={<HeartOutlined />}
              >
                Submit Sponsorship
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

