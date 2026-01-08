import React from 'react';
import { Navigate, Outlet } from '@tanstack/react-router';
import authService from '~/services/auth.service';

export const GuestGuard: React.FC = () => {
    const user = authService.getCurrentUser();

    if (user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
};
