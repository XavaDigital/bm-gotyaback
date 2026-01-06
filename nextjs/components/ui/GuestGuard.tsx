'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/services/auth.service';

interface GuestGuardProps {
  children: React.ReactNode;
}

export const GuestGuard: React.FC<GuestGuardProps> = ({ children }) => {
  const router = useRouter();
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (user) {
      // Redirect logged-in users to dashboard
      router.push('/dashboard');
    }
  }, [user, router]);

  // If authenticated, don't render children (will redirect)
  if (user) {
    return null;
  }

  return <>{children}</>;
};

export default GuestGuard;

