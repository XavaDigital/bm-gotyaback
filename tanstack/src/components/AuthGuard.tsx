import React from 'react';
import { Navigate, Outlet, useLocation } from '@tanstack/react-router';
import authService from '../services/auth.service';

export const AuthGuard: React.FC = () => {
    const user = authService.getCurrentUser();
    const location = useLocation();

    if (!user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
};
