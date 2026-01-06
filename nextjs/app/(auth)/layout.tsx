'use client';

import { ReactNode } from 'react';
import { ConfigProvider, Button } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { darkTheme } from '@/lib/theme/theme-config';

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <ConfigProvider theme={darkTheme}>
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
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.push('/')}
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
          <div style={{ width: '100%', maxWidth: 480 }}>
            {children}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

