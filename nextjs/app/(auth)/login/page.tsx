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
    <Card className="shadow-xl">
      <div className="text-center mb-6">
        <Title level={2} className="!mb-2">
          Welcome Back
        </Title>
        <Text type="secondary">Sign in to your Got Ya Back account</Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          closable
          onClose={() => setError(null)}
          className="mb-4"
        />
      )}

      <Form
        form={form}
        name="login"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[{ required: true, message: 'Please enter your password' }]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<LoginOutlined />}
            block
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <Divider plain>
        <Text type="secondary">Don't have an account?</Text>
      </Divider>

      <div className="text-center">
        <Link href="/register">
          <Button type="link" size="large">
            Create an account
          </Button>
        </Link>
      </div>

      <div className="text-center mt-4">
        <Link href="/">
          <Button type="text">
            ← Back to Home
          </Button>
        </Link>
      </div>
    </Card>
  );
}

