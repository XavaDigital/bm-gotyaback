'use client';

import { ReactNode, useState } from 'react';
import { Layout, Menu, Button, Typography, ConfigProvider } from 'antd';
import {
  DashboardOutlined,
  LogoutOutlined,
  UserOutlined,
  SettingOutlined,
  GlobalOutlined,
} from '@ant-design/icons';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth-context';
import { lightTheme } from '@/lib/theme/theme-config';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: <Link href="/">Home</Link>,
    },
    {
      key: '/dashboard',
      icon: <UserOutlined />,
      label: <Link href="/dashboard">My Campaigns</Link>,
    },
    {
      key: '/campaigns/create',
      icon: <SettingOutlined />,
      label: <Link href="/campaigns/create">Create Campaign</Link>,
    },
    {
      key: '/dashboard/profile',
      icon: <SettingOutlined />,
      label: <Link href="/dashboard/profile">Profile Settings</Link>,
    },
  ];

  return (
    <ConfigProvider theme={lightTheme}>
      <Layout style={{ height: '100vh', width: '100%' }}>
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          theme="dark"
          width={250}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            background: '#1f1f1f',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              paddingBottom: 8,
            }}
          >
            <div
              style={{
                padding: '16px',
                textAlign: 'center',
                borderBottom: '1px solid #3a3a3a',
              }}
            >
              {collapsed ? (
                <Image
                  src="/beastmode-logo.png"
                  alt="BM Logo"
                  width={40}
                  height={40}
                  style={{
                    width: '40px',
                    height: 'auto',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Image
                    src="/beastmode-logo.png"
                    alt="Beast Mode Logo"
                    width={60}
                    height={60}
                    style={{
                      height: '60px',
                      width: 'auto',
                    }}
                  />
                  <Title
                    level={4}
                    style={{
                      color: 'white',
                      margin: 0,
                      fontSize: '18px',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    Got Your Back
                  </Title>
                </div>
              )}
            </div>

            <div style={{ flex: 1, overflow: 'auto', marginTop: '16px' }}>
              <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[pathname]}
                items={menuItems}
                style={{ background: '#1f1f1f' }}
              />
            </div>
            <div
              style={{
                padding: '16px',
                borderTop: '1px solid #3a3a3a',
                marginTop: 'auto',
                marginBottom: 8,
              }}
            >
              <Button
                block
                danger
                icon={<LogoutOutlined />}
                onClick={handleLogout}
              >
                {!collapsed && 'Logout'}
              </Button>
            </div>
          </div>
        </Sider>
        <Layout
          style={{
            marginLeft: collapsed ? 80 : 250,
            transition: 'margin-left 0.2s ease',
          }}
        >
          <Header
            style={{
              background: '#fff',
              padding: '0 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              position: 'sticky',
              top: 0,
              zIndex: 1,
            }}
          >
            <Title level={3} style={{ margin: 0, color: '#C8102E' }}>
              Admin Panel
            </Title>
            <div>
              {user?.organizerProfile?.slug && (
                <Button
                  type="link"
                  icon={<GlobalOutlined />}
                  href={`/u/${user.organizerProfile.slug}`}
                  target="_blank"
                >
                  View Public Profile
                </Button>
              )}
            </div>
          </Header>
          <Content
            style={{
              padding: '24px',
              background: '#f5f5f5',
              minHeight: 'calc(100vh - 64px)',
              overflow: 'auto',
            }}
          >
            {children}
          </Content>
        </Layout>
      </Layout>
    </ConfigProvider>
  );
}

