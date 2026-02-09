import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { Form, Input, Button, Card, Typography, message, Alert } from 'antd'
import { Link } from '@tanstack/react-router'
import {
  LockOutlined,
  MailOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons'
import { requireGuest } from '~/utils/auth-helpers'
import authService from '~/services/auth.service'
import beastmodeLogo from '~/assets/beastmode-logo.png'

const { Title, Text } = Typography

export const Route = createFileRoute('/login')({
  beforeLoad: async () => {
    // Server-side check: redirect if already authenticated
    await requireGuest()
  },
  component: LoginPage,
})

function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Add placeholder styling
    const style = document.createElement('style')
    style.id = 'login-placeholder-styles'
    style.textContent = `
      .login-page-input input::placeholder,
      .login-page-input .ant-input::placeholder {
        color: #999999 !important;
        opacity: 1 !important;
      }
    `
    document.head.appendChild(style)

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
      // Remove placeholder styles
      const styleEl = document.getElementById('login-placeholder-styles')
      if (styleEl) {
        styleEl.remove()
      }

      body.style.display = originalStyles.display
      ;(body.style as any).placeItems = originalStyles.placeItems
      body.style.margin = originalStyles.margin
      body.style.width = originalStyles.width
      html.style.width = originalStyles.htmlWidth
    }
  }, [])

  const onFinish = async (values: any) => {
    setLoading(true)
    try {
      await authService.login(values)
      message.success('Login successful!')
      navigate({ to: '/' })
    } catch (error: any) {
      const msg = error.response?.data?.message || 'Login failed'
      message.error(msg)
    } finally {
      setLoading(false)
    }
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
          onClick={() => navigate({ to: '/' })}
          style={{
            background: 'transparent',
            borderColor: '#ffffff',
            color: '#ffffff',
          }}
        >
          Back to Home
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
          {/* Development Mode Alert */}
          <Alert
            message="Development Mode"
            description={
              <div>
                <Text strong style={{ color: '#ffffff' }}>
                  Test Accounts:
                </Text>

                {/* Admin Account */}
                <div style={{ marginTop: 12, paddingBottom: 12, borderBottom: '1px solid #3a3a3a' }}>
                  <Text strong style={{ color: '#ffa940' }}>Admin Account:</Text>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ marginBottom: 4 }}>
                      <Text style={{ color: '#cccccc' }}>Email: </Text>
                      <Text copyable style={{ color: '#ffffff' }}>
                        eaglemna69@gmail.com
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

                {/* Regular User Account */}
                <div style={{ marginTop: 12 }}>
                  <Text strong style={{ color: '#52c41a' }}>User Account:</Text>
                  <div style={{ marginTop: 8 }}>
                    <div style={{ marginBottom: 4 }}>
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

          {/* Login Form */}
          <Form name="login" onFinish={onFinish} layout="vertical" size="large">
            <Form.Item
              name="email"
              label={<span style={{ color: '#ffffff' }}>Email</span>}
              rules={[
                { required: true, message: 'Please input your email!' },
                { type: 'email', message: 'Please enter a valid email!' },
              ]}
            >
              <Input
                prefix={<MailOutlined style={{ color: '#999999' }} />}
                placeholder="Email Address"
                className="login-page-input"
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
                { required: true, message: 'Please input your password!' },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined style={{ color: '#999999' }} />}
                placeholder="Password"
                className="login-page-input"
                style={{
                  background: '#1f1f1f',
                  border: '1px solid #3a3a3a',
                  color: '#ffffff',
                }}
              />
            </Form.Item>

            <div style={{ textAlign: 'right', marginBottom: 16 }}>
              <Link
                to="/forgot-password"
                style={{ color: '#C8102E', fontSize: 14 }}
              >
                Forgot Password?
              </Link>
            </div>

            <Form.Item style={{ marginBottom: 16 }}>
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
                Log In
              </Button>
            </Form.Item>

            <div style={{ textAlign: 'center' }}>
              <Text style={{ color: '#cccccc' }}>Don't have an account? </Text>
              <Link
                to="/register"
                style={{ color: '#C8102E', fontWeight: 600 }}
              >
                Register now
              </Link>
            </div>
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

