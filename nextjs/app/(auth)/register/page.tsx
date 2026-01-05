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
    <Card className="shadow-xl">
      <div className="text-center mb-6">
        <Title level={2} className="!mb-2">
          Create Account
        </Title>
        <Text type="secondary">Join Got Ya Back and start fundraising</Text>
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
        name="register"
        onFinish={onFinish}
        layout="vertical"
        size="large"
      >
        <Form.Item
          name="name"
          label="Full Name"
          rules={[
            { required: true, message: 'Please enter your name' },
            { min: 2, message: 'Name must be at least 2 characters' },
          ]}
        >
          <Input
            prefix={<UserOutlined />}
            placeholder="John Doe"
            autoComplete="name"
          />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email' },
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="your@email.com"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter a password' },
            { min: 6, message: 'Password must be at least 6 characters' },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Create a strong password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Confirm Password"
          dependencies={['password']}
          rules={[
            { required: true, message: 'Please confirm your password' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error('Passwords do not match'));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Confirm your password"
            autoComplete="new-password"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            icon={<UserAddOutlined />}
            block
          >
            Create Account
          </Button>
        </Form.Item>
      </Form>

      <Divider plain>
        <Text type="secondary">Already have an account?</Text>
      </Divider>

      <div className="text-center">
        <Link href="/login">
          <Button type="link" size="large">
            Sign in instead
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

