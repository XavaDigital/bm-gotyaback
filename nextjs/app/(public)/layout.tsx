'use client';

import { ReactNode } from 'react';
import { ConfigProvider } from 'antd';
import { darkTheme } from '@/lib/theme/theme-config';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <ConfigProvider theme={darkTheme}>
      {children}
    </ConfigProvider>
  );
}

