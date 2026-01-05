'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Steps,
  Form,
  Input,
  Select,
  Button,
  Card,
  Typography,
  Upload,
  InputNumber,
  Radio,
  Space,
  message,
  Divider,
} from 'antd';
import {
  InfoCircleOutlined,
  DollarOutlined,
  LayoutOutlined,
  UploadOutlined,
  ArrowLeftOutlined,
  ArrowRightOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import campaignService from '@/lib/services/campaign.service';
import type { CreateCampaignRequest, CampaignType, SponsorDisplayType, LayoutStyle } from '@/types/campaign.types';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

export default function CreateCampaignPage() {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const router = useRouter();

  const steps = [
    {
      title: 'Basic Info',
      icon: <InfoCircleOutlined />,
    },
    {
      title: 'Pricing',
      icon: <DollarOutlined />,
    },
    {
      title: 'Layout',
      icon: <LayoutOutlined />,
    },
  ];

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      const campaignData: CreateCampaignRequest = {
        title: values.title,
        shortDescription: values.shortDescription,
        description: values.description,
        garmentType: values.garmentType,
        campaignType: values.campaignType,
        sponsorDisplayType: values.sponsorDisplayType,
        layoutStyle: values.layoutStyle,
        currency: values.currency || 'NZD',
        pricingConfig: {
          fixedPrice: values.fixedPrice,
          basePrice: values.basePrice,
          pricePerPosition: values.pricePerPosition,
          priceMultiplier: values.priceMultiplier,
          minimumAmount: values.minimumAmount,
          suggestedAmounts: values.suggestedAmounts,
        },
        enableStripePayments: values.enableStripePayments ?? true,
        allowOfflinePayments: values.allowOfflinePayments ?? true,
        headerImageFile: fileList[0]?.originFileObj,
      };

      const campaign = await campaignService.createCampaign(campaignData);
      message.success('Campaign created successfully!');
      router.push(`/campaigns/${campaign._id}/layout-config`);
    } catch (error: any) {
      console.error('Failed to create campaign:', error);
      message.error(error.response?.data?.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  const next = async () => {
    try {
      // Validate only the fields in the current step
      const fieldsToValidate = getFieldsForStep(currentStep);
      await form.validateFields(fieldsToValidate);
      setCurrentStep(currentStep + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const getFieldsForStep = (step: number): string[] => {
    switch (step) {
      case 0: // Basic Info
        return ['title', 'shortDescription', 'description', 'garmentType'];
      case 1: // Pricing
        return ['campaignType', 'fixedPrice', 'basePrice', 'pricePerPosition', 'priceMultiplier', 'minimumAmount', 'suggestedAmounts'];
      case 2: // Display & Payment
        return ['sponsorDisplayType', 'layoutStyle', 'currency', 'enableStripePayments', 'allowOfflinePayments'];
      default:
        return [];
    }
  };

  const prev = () => {
    setCurrentStep(currentStep - 1);
  };

  const campaignType = Form.useWatch('campaignType', form);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Title level={2}>Create New Campaign</Title>
        <Text type="secondary">Set up your fundraising campaign in a few simple steps</Text>
      </div>

      <Card>
        <Steps current={currentStep} items={steps} className="mb-8" />

        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            garmentType: 'tshirt',
            campaignType: 'fixed',
            sponsorDisplayType: 'both',
            layoutStyle: 'grid',
            currency: 'NZD',
            enableStripePayments: true,
            allowOfflinePayments: true,
          }}
        >
          {/* Step 1: Basic Info */}
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Space vertical size="large" className="w-full">
              <Form.Item
                name="title"
                label="Campaign Title"
                rules={[{ required: true, message: 'Please enter a campaign title' }]}
              >
                <Input size="large" placeholder="e.g., School Sports Team Fundraiser" />
              </Form.Item>

              <Form.Item
                name="shortDescription"
                label="Short Description"
                extra="A brief summary that appears in listings"
              >
                <Input placeholder="One-line description of your campaign" />
              </Form.Item>

              <Form.Item
                name="description"
                label="Full Description"
                extra="Detailed information about your campaign"
              >
                <TextArea rows={4} placeholder="Tell people about your fundraising goals..." />
              </Form.Item>

              <Form.Item
                name="garmentType"
                label="Garment Type"
                rules={[{ required: true }]}
              >
                <Radio.Group size="large">
                  <Radio.Button value="singlet">Singlet</Radio.Button>
                  <Radio.Button value="tshirt">T-Shirt</Radio.Button>
                  <Radio.Button value="hoodie">Hoodie</Radio.Button>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="headerImage"
                label="Header Image"
                extra="Optional banner image for your campaign"
              >
                <Upload
                  listType="picture-card"
                  fileList={fileList}
                  onChange={({ fileList }) => setFileList(fileList)}
                  beforeUpload={() => false}
                  maxCount={1}
                >
                  {fileList.length === 0 && (
                    <div>
                      <UploadOutlined />
                      <div style={{ marginTop: 8 }}>Upload</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Space>
          </div>

          {/* Step 2: Pricing */}
          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Space vertical size="large" className="w-full">
              <Form.Item
                name="campaignType"
                label="Pricing Strategy"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Space vertical>
                    <Radio value="fixed">
                      <strong>Fixed Price</strong> - All positions cost the same
                    </Radio>
                    <Radio value="positional">
                      <strong>Positional Pricing</strong> - Price varies by position
                    </Radio>
                    <Radio value="pay-what-you-want">
                      <strong>Pay What You Want</strong> - Sponsors choose their amount
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              {campaignType === 'fixed' && (
                <Form.Item
                  name="fixedPrice"
                  label="Price per Position"
                  rules={[{ required: true, message: 'Please enter a price' }]}
                >
                  <InputNumber
                    size="large"
                    prefix="$"
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="50"
                  />
                </Form.Item>
              )}

              {campaignType === 'positional' && (
                <>
                  <Form.Item
                    name="basePrice"
                    label="Base Price"
                    rules={[{ required: true }]}
                  >
                    <InputNumber
                      size="large"
                      prefix="$"
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="20"
                    />
                  </Form.Item>
                  <Form.Item
                    name="pricePerPosition"
                    label="Price Increase per Position"
                  >
                    <InputNumber
                      size="large"
                      prefix="$"
                      min={0}
                      style={{ width: '100%' }}
                      placeholder="5"
                    />
                  </Form.Item>
                </>
              )}

              {campaignType === 'pay-what-you-want' && (
                <Form.Item
                  name="minimumAmount"
                  label="Minimum Amount"
                  rules={[{ required: true }]}
                >
                  <InputNumber
                    size="large"
                    prefix="$"
                    min={1}
                    style={{ width: '100%' }}
                    placeholder="10"
                  />
                </Form.Item>
              )}

              <Form.Item
                name="currency"
                label="Currency"
                rules={[{ required: true }]}
              >
                <Select size="large">
                  <Select.Option value="NZD">NZD - New Zealand Dollar</Select.Option>
                  <Select.Option value="AUD">AUD - Australian Dollar</Select.Option>
                  <Select.Option value="USD">USD - US Dollar</Select.Option>
                </Select>
              </Form.Item>
            </Space>
          </div>

          {/* Step 3: Layout */}
          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Space vertical size="large" className="w-full">
              <Form.Item
                name="sponsorDisplayType"
                label="Sponsor Display Type"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Space vertical>
                    <Radio value="text-only">
                      <strong>Text Only</strong> - Display sponsor names as text
                    </Radio>
                    <Radio value="logo-only">
                      <strong>Logo Only</strong> - Display sponsor logos
                    </Radio>
                    <Radio value="both">
                      <strong>Both</strong> - Allow text or logo sponsors
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="layoutStyle"
                label="Layout Style"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Space vertical>
                    <Radio value="grid">
                      <strong>Grid</strong> - Fixed grid of positions
                    </Radio>
                    <Radio value="size-ordered">
                      <strong>Size Ordered</strong> - Ordered by sponsor size
                    </Radio>
                    <Radio value="amount-ordered">
                      <strong>Amount Ordered</strong> - Ordered by contribution amount
                    </Radio>
                    <Radio value="word-cloud">
                      <strong>Word Cloud</strong> - Creative word cloud layout
                    </Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Divider />

              <Form.Item
                name="enableStripePayments"
                label="Payment Options"
                valuePropName="checked"
              >
                <Radio.Group>
                  <Space vertical>
                    <Radio value={true}>Enable online payments (Stripe)</Radio>
                    <Radio value={false}>Offline payments only</Radio>
                  </Space>
                </Radio.Group>
              </Form.Item>

              <Form.Item
                name="allowOfflinePayments"
                label="Allow Offline Payments"
                valuePropName="checked"
              >
                <Radio.Group>
                  <Radio value={true}>Yes</Radio>
                  <Radio value={false}>No</Radio>
                </Radio.Group>
              </Form.Item>
            </Space>
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              size="large"
              onClick={prev}
              disabled={currentStep === 0}
              icon={<ArrowLeftOutlined />}
            >
              Previous
            </Button>
            {currentStep < steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                onClick={next}
                icon={<ArrowRightOutlined />}
                iconPlacement="end"
              >
                Next
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button
                type="primary"
                size="large"
                htmlType="submit"
                loading={loading}
                icon={<CheckOutlined />}
              >
                Create Campaign
              </Button>
            )}
          </div>
        </Form>
      </Card>
    </div>
  );
}
