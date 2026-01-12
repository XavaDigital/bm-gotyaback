'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService from '@/lib/services/auth.service';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const router = useRouter();
  const pathname = usePathname();
  const user = authService.getCurrentUser();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    // Check if both user and token exist
    if (!user || !token) {
      // Clear any stale data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
      router.push(`/login?redirect=${pathname}`);
    }
  }, [user, token, router, pathname]);

  // If not authenticated, don't render children
  if (!user || !token) {
    return null;
  }

  return <>{children}</>;
};

export default AuthGuard;

