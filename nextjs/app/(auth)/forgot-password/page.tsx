'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd';
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api-client';

const { Title, Text } = Typography;

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const router = useRouter();

  const onFinish = async (values: { email: string }) => {
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email: values.email });
      setEmailSent(true);
      message.success('Password reset instructions sent to your email!');
    } catch (error: any) {
      // In development, show actual errors for debugging
      if (process.env.NODE_ENV === 'development') {
        console.error('Password reset error:', error);
        message.error(
          error.response?.data?.message ||
            error.message ||
            'Failed to send reset email. Is the backend running?'
        );
      } else {
        // In production, always show success message to prevent email enumeration
        setEmailSent(true);
        message.success(
          'If an account exists, password reset instructions have been sent!'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#1f1f1f',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          background: '#2a2a2a',
          borderBottom: '2px solid #3a3a3a',
          padding: '16px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Image
            src="/beastmode-logo.png"
            alt="Beast Mode Logo"
            width={50}
            height={50}
            style={{ height: 50, width: 'auto' }}
          />
          <h2
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: '#ffffff',
            }}
          >
            Got Your Back
          </h2>
        </div>
        <Link href="/login">
          <Button
            icon={<ArrowLeftOutlined />}
            style={{
              background: 'transparent',
              borderColor: '#ffffff',
              color: '#ffffff',
            }}
          >
            Back to Login
          </Button>
        </Link>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 500,
            background: '#2a2a2a',
            border: '1px solid #3a3a3a',
          }}
        >
          <Title level={2} style={{ textAlign: 'center', color: '#ffffff' }}>
            Reset Password
          </Title>
          <Text
            style={{
              display: 'block',
              textAlign: 'center',
              marginBottom: 24,
              color: '#cccccc',
            }}
          >
            Enter your email address and we'll send you instructions to reset
            your password.
          </Text>

          {emailSent ? (
            <div>
              <Alert
                message="Email Sent!"
                description="If an account exists with that email, you will receive password reset instructions shortly. Please check your inbox and spam folder."
                type="success"
                showIcon
                style={{
                  marginBottom: 24,
                  background: '#1f1f1f',
                  border: '1px solid #52c41a',
                }}
              />
              <Button
                type="primary"
                block
                onClick={() => router.push('/login')}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <Form
              name="forgot-password"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label={<span style={{ color: '#ffffff' }}>Email</span>}
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input prefix={<MailOutlined />} placeholder="Email" />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  style={{ height: 48, fontSize: 16, fontWeight: 600 }}
                >
                  Send Reset Instructions
                </Button>
              </Form.Item>
            </Form>
          )}
        </Card>
      </div>
    </div>
  );
}

