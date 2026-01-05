'use client';

import React, { useState } from 'react';
import {
  Modal,
  Form,
  Input,
  Radio,
  Button,
  message,
  Alert,
  InputNumber,
  Select,
} from 'antd';
import type {
  CreateSponsorshipRequest,
  Campaign,
} from '@/types/campaign.types';
import LogoUpload from './LogoUpload';

interface SponsorCheckoutModalProps {
  visible: boolean;
  onCancel: () => void;
  onSubmit: (data: CreateSponsorshipRequest) => Promise<void>;
  positionId?: string;
  amount: number;
  currency: string;
  campaignId: string;
  campaign: Campaign;
}

const SponsorCheckoutModal: React.FC<SponsorCheckoutModalProps> = ({
  visible,
  onCancel,
  onSubmit,
  positionId,
  amount,
  currency,
  campaignId,
  campaign,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [sponsorType, setSponsorType] = useState<'text' | 'logo'>('text');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash'>('cash');

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      const sponsorData: CreateSponsorshipRequest = {
        campaignId,
        name: values.name,
        email: values.email,
        phone: values.phone || '',
        amount: values.amount || amount,
        message: values.message,
        sponsorType,
        positionId,
        paymentMethod,
      };

      // If logo sponsor, handle logo upload
      if (sponsorType === 'logo' && logoFile) {
        // Logo will be uploaded separately or included in the request
        // For now, we'll just pass the file reference
        (sponsorData as any).logoFile = logoFile;
      }

      await onSubmit(sponsorData);
      message.success('Sponsorship submitted successfully!');
      form.resetFields();
      setLogoFile(null);
      onCancel();
    } catch (error: any) {
      message.error(error.response?.data?.message || 'Failed to submit sponsorship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Become a Sponsor"
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        initialValues={{
          amount,
          sponsorType: 'text',
          paymentMethod: 'cash',
        }}
      >
        <Form.Item
          name="name"
          label="Name / Organization"
          rules={[{ required: true, message: 'Please enter your name' }]}
        >
          <Input placeholder="Your name or organization" />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input placeholder="your@email.com" />
        </Form.Item>

        <Form.Item name="phone" label="Phone (Optional)">
          <Input placeholder="+64 21 123 4567" />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Sponsorship Amount"
          rules={[{ required: true, message: 'Please enter an amount' }]}
        >
          <InputNumber
            min={1}
            style={{ width: '100%' }}
            prefix={currency}
            disabled={!!positionId}
          />
        </Form.Item>

        <Form.Item name="sponsorType" label="Sponsor Type">
          <Radio.Group onChange={(e) => setSponsorType(e.target.value)}>
            <Radio value="text">Text Only</Radio>
            <Radio value="logo">Logo</Radio>
          </Radio.Group>
        </Form.Item>

        {sponsorType === 'logo' && (
          <Form.Item label="Upload Logo">
            <LogoUpload
              onFileSelect={(file) => setLogoFile(file)}
              maxSizeMB={5}
            />
          </Form.Item>
        )}

        <Form.Item name="message" label="Message (Optional)">
          <Input.TextArea
            rows={3}
            placeholder="Add a message to display with your sponsorship"
          />
        </Form.Item>

        <Form.Item name="paymentMethod" label="Payment Method">
          <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)}>
            {campaign.enableStripePayments && (
              <Radio value="card">Credit Card (Stripe)</Radio>
            )}
            {campaign.allowOfflinePayments && (
              <Radio value="cash">Offline Payment</Radio>
            )}
          </Radio.Group>
        </Form.Item>

        {paymentMethod === 'cash' && (
          <Alert
            message="Offline Payment"
            description="You will be contacted by the campaign organizer with payment instructions."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        <Form.Item>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button onClick={onCancel}>Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              {paymentMethod === 'card' ? 'Pay Now' : 'Confirm Pledge'}
            </Button>
          </div>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default SponsorCheckoutModal;

