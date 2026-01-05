'use client';

import { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { darkTheme } from '@/lib/theme/theme-config';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={darkTheme}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>
    </ConfigProvider>
  );
}

