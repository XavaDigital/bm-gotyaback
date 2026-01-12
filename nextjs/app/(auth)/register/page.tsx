'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Form, Input, Button, Typography, Alert, Divider } from 'antd';
import { UserOutlined, LockOutlined, MailOutlined, UserAddOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/auth-context';
import authService from '@/lib/services/auth.service';

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setUser } = useAuth();

  const onFinish = async (values: { name: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);

    try {
      const response = await authService.register(values);
      setUser(response);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        'Failed to create account. Please try again.'
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
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
          Create Your Account
        </Title>
        <Text style={{ fontSize: 16, color: '#cccccc' }}>
          Start your fundraising journey today
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

      {/* Register Form */}
      <Form
        form={form}
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="name"
          label={<span style={{ color: '#ffffff' }}>Full Name</span>}
          rules={[
            { required: true, message: 'Please enter your name' },
            { min: 2, message: 'Name must be at least 2 characters' },
          ]}
        >
          <Input
            prefix={<UserOutlined style={{ color: '#999999' }} />}
            placeholder="Full Name"
            autoComplete="name"
            style={{
              background: '#1f1f1f',
              border: '1px solid #3a3a3a',
              color: '#ffffff',
            }}
          />
        </Form.Item>

        <Form.Item
          name="email"
          label={<span style={{ color: '#ffffff' }}>Email</span>}
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined style={{ color: '#999999' }} />}
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
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: '#999999' }} />}
            placeholder="Password (min 6 characters)"
            autoComplete="new-password"
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
            Create Account
          </Button>
        </Form.Item>

        <div style={{ textAlign: 'center' }}>
          <Text style={{ color: '#cccccc' }}>Already have an account? </Text>
          <Link href="/login" style={{ color: '#C8102E', fontWeight: 600 }}>
            Login here
          </Link>
        </div>
      </Form>
    </Card>
  );
}

