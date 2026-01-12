'use client';

import React, { useState } from 'react';
import {
  Form,
  Input,
  Select,
  Steps,
  Button,
  InputNumber,
  Radio,
  Card,
  Switch,
  message,
} from 'antd';
import RichTextEditor from './RichTextEditor';

interface CampaignWizardProps {
  mode: 'create' | 'edit';
  initialCampaignData?: any;
  initialLayoutData?: any;
  onSubmit: (campaignData: any, layoutData: any) => Promise<void>;
  submitButtonText?: string;
  loading?: boolean;
  hasSponsors?: boolean;
}

const CampaignWizard: React.FC<CampaignWizardProps> = ({
  mode,
  initialCampaignData = {},
  initialLayoutData = {},
  onSubmit,
  submitButtonText = 'Submit',
  loading = false,
  hasSponsors = false,
}) => {
  const [current, setCurrent] = useState(0);
  const [campaignData, setCampaignData] = useState<any>(initialCampaignData);
  const [layoutData, setLayoutData] = useState<any>(initialLayoutData);
  const [form] = Form.useForm();

  const steps = [
    {
      title: 'Basic Info',
      content: 'basic',
    },
    {
      title: 'Layout',
      content: 'layout',
    },
    {
      title: 'Payment',
      content: 'payment',
    },
  ];

  const next = async () => {
    try {
      const values = await form.validateFields();
      setCampaignData({ ...campaignData, ...values });
      setCurrent(current + 1);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const prev = () => {
    setCurrent(current - 1);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const finalCampaignData = { ...campaignData, ...values };
      await onSubmit(finalCampaignData, layoutData);
    } catch (error) {
      console.error('Submit failed:', error);
    }
  };

  const renderBasicInfo = () => (
    <>
      <Form.Item
        name="title"
        label="Campaign Title"
        rules={[{ required: true, message: 'Please enter campaign title' }]}
      >
        <Input placeholder="e.g., Team Fundraiser 2024" />
      </Form.Item>

      <Form.Item
        name="slug"
        label="URL Slug"
        rules={[{ required: true, message: 'Please enter URL slug' }]}
      >
        <Input placeholder="team-fundraiser-2024" />
      </Form.Item>

      <Form.Item name="description" label="Description">
        <RichTextEditor
          value={campaignData.description}
          onChange={(value) => setCampaignData({ ...campaignData, description: value })}
        />
      </Form.Item>

      <Form.Item
        name="campaignType"
        label="Campaign Type"
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value="fundraising">Fundraising</Select.Option>
          <Select.Option value="sponsorship">Sponsorship</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item
        name="garmentType"
        label="Garment Type"
        rules={[{ required: true }]}
      >
        <Select>
          <Select.Option value="shirt">Shirt</Select.Option>
          <Select.Option value="jersey">Jersey</Select.Option>
          <Select.Option value="other">Other</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="currency" label="Currency" initialValue="NZD">
        <Select>
          <Select.Option value="NZD">NZD</Select.Option>
          <Select.Option value="USD">USD</Select.Option>
          <Select.Option value="AUD">AUD</Select.Option>
        </Select>
      </Form.Item>
    </>
  );

  const renderLayout = () => (
    <>
      <Form.Item name="layoutType" label="Layout Type" initialValue="flexible">
        <Radio.Group>
          <Radio value="flexible">Flexible</Radio>
          <Radio value="fixed">Fixed Grid</Radio>
          <Radio value="wordcloud">Word Cloud</Radio>
        </Radio.Group>
      </Form.Item>

      <Form.Item name="gridColumns" label="Grid Columns" initialValue={3}>
        <InputNumber min={1} max={12} />
      </Form.Item>

      <Form.Item name="gridRows" label="Grid Rows" initialValue={3}>
        <InputNumber min={1} max={20} />
      </Form.Item>
    </>
  );

  const renderPayment = () => (
    <>
      <Form.Item name="enableStripePayments" label="Enable Stripe Payments" valuePropName="checked">
        <Switch />
      </Form.Item>

      <Form.Item name="allowOfflinePayments" label="Allow Offline Payments" valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );

  return (
    <div>
      <Steps current={current} items={steps} style={{ marginBottom: 24 }} />

      <Form form={form} layout="vertical" initialValues={campaignData}>
        <Card>
          {current === 0 && renderBasicInfo()}
          {current === 1 && renderLayout()}
          {current === 2 && renderPayment()}
        </Card>

        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between' }}>
          {current > 0 && (
            <Button onClick={prev}>Previous</Button>
          )}
          {current < steps.length - 1 && (
            <Button type="primary" onClick={next}>
              Next
            </Button>
          )}
          {current === steps.length - 1 && (
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {submitButtonText}
            </Button>
          )}
        </div>
      </Form>
    </div>
  );
};

export default CampaignWizard;

