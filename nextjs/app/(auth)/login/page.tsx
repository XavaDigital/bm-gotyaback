'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import authService from '@/lib/services/auth.service';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuth();

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      console.log('Attempting login with:', values.email);
      const response = await authService.login(values);
      console.log('Login successful, response:', response);

      setUser(response);
      console.log('User set in context');

      // Redirect to the page they were trying to access, or dashboard
      const from = searchParams.get('from') || '/dashboard';
      console.log('Redirecting to:', from);
      router.push(from);
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      setError(
        err.response?.data?.message ||
        'Failed to login. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      style={{
        background: '#2a2a2a',
        border: '2px solid #3a3a3a',
        borderRadius: 12,
      }}
      bodyStyle={{ padding: 40 }}
    >
      {/* Development Mode Alert */}
      <Alert
        message="Development Mode"
        description={
          <div>
            <Text strong style={{ color: '#ffffff' }}>
              Test Account:
            </Text>
            <div style={{ marginTop: 12 }}>
              <div style={{ marginBottom: 8 }}>
                <Text style={{ color: '#cccccc' }}>Email: </Text>
                <Text copyable style={{ color: '#ffffff' }}>
                  user@gmail.com
                </Text>
              </div>
              <div>
                <Text style={{ color: '#cccccc' }}>Password: </Text>
                <Text copyable style={{ color: '#ffffff' }}>
                  qweqweqwe
                </Text>
              </div>
            </div>
          </div>
        }
        type="info"
        showIcon
        style={{
          marginBottom: 32,
          background: '#1f1f1f',
          border: '1px solid #3a3a3a',
        }}
      />

      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
          Welcome Back
        </Title>
        <Text style={{ fontSize: 16, color: '#cccccc' }}>
          Login to manage your campaigns
        </Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 24 }}
        />
      )}

      {/* Login Form */}
      <Form
        form={form}
        name="login"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          label={<span style={{ color: '#ffffff' }}>Email</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#999999' }} />}
            placeholder="Email Address"
            autoComplete="email"
            style={{
              background: '#1f1f1f',
              border: '1px solid #3a3a3a',
              color: '#ffffff',
            }}
          />
        </Form.Item>

        <Form.Item
          name="password"
          label={<span style={{ color: '#ffffff' }}>Password</span>}
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#999999' }} />}
            placeholder="Password"
            autoComplete="current-password"
            style={{
              background: '#1f1f1f',
              border: '1px solid #3a3a3a',
              color: '#ffffff',
            }}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{
              height: 48,
              fontSize: 16,
              fontWeight: 600,
            }}
          >
            Log In
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#cccccc' }}>Don't have an account? </Text>
          <Link href="/register" style={{ color: '#C8102E', fontWeight: 600 }}>
            Register now
          </Link>
        </div>
      </Form>
    </Card>
  );
}

