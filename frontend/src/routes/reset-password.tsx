import { createFileRoute, useNavigate, useSearch } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd'
import { LockOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import apiClient from '~/services/apiClient'
import beastmodeLogo from '~/assets/beastmode-logo.png'

const { Title, Text } = Typography

export const Route = createFileRoute('/reset-password')({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      token: (search.token as string) || '',
    }
  },
})

function ResetPasswordPage() {
  const [loading, setLoading] = useState(false)
  const { token } = useSearch({ from: '/reset-password' })
  const navigate = useNavigate()

  useEffect(() => {
    // Check if token exists
    if (!token) {
      message.error('Invalid or missing reset token')
      navigate({ to: '/login' })
    }

    // Override body styles for full-width dark page
    const body = document.body
    const html = document.documentElement

    const originalStyles = {
      display: body.style.display,
      placeItems: (body.style as any).placeItems,
      margin: body.style.margin,
      width: body.style.width,
      htmlWidth: html.style.width,
    }

    body.style.display = 'block'
    ;(body.style as any).placeItems = 'initial'
    body.style.margin = '0'
    body.style.width = '100%'
    html.style.width = '100%'

    return () => {
      body.style.display = originalStyles.display
      ;(body.style as any).placeItems = originalStyles.placeItems
      body.style.margin = originalStyles.margin
      body.style.width = originalStyles.width
      html.style.width = originalStyles.htmlWidth
    }
  }, [token, navigate])

  const onFinish = async (values: any) => {
    if (!token) {
      message.error('Invalid reset token')
      return
    }

    if (values.password !== values.confirmPassword) {
      message.error('Passwords do not match!')
      return
    }

    setLoading(true)
    try {
      await apiClient.post('/auth/reset-password', {
        token,
        password: values.password,
      })
      message.success('Password reset successful! You can now login.')
      navigate({ to: '/login' })
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        'Password reset failed. Token may be invalid or expired.'
      message.error(msg)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return null
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
          <img
            src={beastmodeLogo}
            alt="Beast Mode Logo"
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
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => navigate({ to: '/login' })}
          style={{
            background: 'transparent',
            borderColor: '#ffffff',
            color: '#ffffff',
          }}
        >
          Back to Login
        </Button>
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
          bodyStyle={{ padding: 40 }}
        >
          {/* Title */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Title level={2} style={{ color: '#ffffff', marginBottom: 8 }}>
              Reset Your Password
            </Title>
            <Text style={{ fontSize: 16, color: '#cccccc' }}>
              Enter your new password below
            </Text>
          </div>

          {/* Info Alert */}
          <Alert
            message="Password Requirements"
            description="Password must be at least 6 characters long"
            type="info"
            showIcon
            style={{
              marginBottom: 24,
              background: '#1f1f1f',
              border: '1px solid #3a3a3a',
            }}
          />

          {/* Reset Password Form */}
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
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999999' }} />}
                placeholder="New Password"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid #3a3a3a',
                  color: '#ffffff',
                }}
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={<span style={{ color: '#ffffff' }}>Confirm Password</span>}
              rules={[
                { required: true, message: 'Please confirm your password!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999999' }} />}
                placeholder="Confirm Password"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid #3a3a3a',
                  color: '#ffffff',
                }}
              />
            </Form.Item>

            <Form.Item style={{ marginBottom: 0 }}>
              <Button
                type="primary"
                htmlType="submit"
                block
                loading={loading}
                style={{
                  height: 48,
                  fontSize: 16,
                  fontWeight: 600,
                }}
              >
                Reset Password
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>

      {/* Footer */}
      <div
        style={{
          background: '#2a2a2a',
          padding: '24px 40px',
          textAlign: 'center',
          borderTop: '2px solid #3a3a3a',
        }}
      >
        <Text style={{ color: '#999999', fontSize: 14 }}>
          © {new Date().getFullYear()} Got Your Back. All rights reserved.
        </Text>
      </div>
    </div>
  )
}

