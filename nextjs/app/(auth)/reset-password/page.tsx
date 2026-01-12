'use client';

import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api-client';

const { Title, Text } = Typography;

export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get token from URL
    const tokenFromUrl = searchParams.get('token');
    if (!tokenFromUrl) {
      message.error('Invalid or missing reset token');
      router.push('/login');
    } else {
      setToken(tokenFromUrl);
    }
  }, [searchParams, router]);

  const onFinish = async (values: { password: string; confirmPassword: string }) => {
    if (!token) {
      message.error('Invalid reset token');
      return;
    }

    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: values.password,
      });
      message.success('Password reset successful! You can now login.');
      router.push('/login');
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Password reset failed. Token may be invalid or expired.';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

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
          justifyContent: 'center',
          alignItems: 'center',
          padding: '40px 20px',
        }}
      >
        <Card
          style={{
            width: '100%',
            maxWidth: 480,
            background: '#2a2a2a',
            border: '2px solid #3a3a3a',
            borderRadius: 12,
          }}
        >
          <Title level={2} style={{ textAlign: 'center', color: '#ffffff' }}>
            Set New Password
          </Title>
          <Text
            style={{
              display: 'block',
              textAlign: 'center',
              marginBottom: 24,
              color: '#cccccc',
            }}
          >
            Enter your new password below.
          </Text>

          <Form
            name="reset-password"
            onFinish={onFinish}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="password"
              label={<span style={{ color: '#ffffff' }}>New Password</span>}
              rules={[
                { required: true, message: 'Please input your new password!' },
                { min: 6, message: 'Password must be at least 6 characters!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="New Password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ color: '#ffffff' }}>Confirm Password</span>}
              rules={[
                { required: true, message: 'Please confirm your password!' },
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                style={{ height: 48, fontSize: 16, fontWeight: 600 }}
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
}

