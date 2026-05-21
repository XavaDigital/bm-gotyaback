import apiClient from './apiClient';
import type { User } from '~/types/campaign.types';

interface AuthResponse extends User {
    token: string;
}

// Helper to check if we're in the browser
const isBrowser = typeof window !== 'undefined';

/**
 * Register a new user
 * Stores credentials in localStorage for client-side access
 */
const register = async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', userData);

    if (response.data && isBrowser) {
        // Store in sessionStorage (cleared when tab closes, not accessible cross-tab)
        sessionStorage.setItem('user', JSON.stringify(response.data));
        sessionStorage.setItem('token', response.data.token);
    }

    return response.data;
};

/**
 * Login user
 * Stores credentials in localStorage for client-side access
 */
const login = async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', userData);

    if (response.data && isBrowser) {
        // Store in sessionStorage (cleared when tab closes, not accessible cross-tab)
        sessionStorage.setItem('user', JSON.stringify(response.data));
        sessionStorage.setItem('token', response.data.token);
    }

    return response.data;
};

/**
 * Logout user
 * Revokes the refresh token on the backend, then clears local session
 */
const logout = async () => {
    try {
        await apiClient.post('/auth/logout');
    } catch {
        // Best-effort: always clear local state even if backend call fails
    }
    if (isBrowser) {
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('token');
        window.location.href = '/login';
    }
};

/**
 * Get current user from localStorage (client-side only)
 */
const getCurrentUser = (): (User & { token: string }) | null => {
    if (!isBrowser) return null;

    const userStr = sessionStorage.getItem('user');
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Failed to parse user from localStorage:', error);
            return null;
        }
    }
    return null;
};

/**
 * Check if user is authenticated by verifying the JWT exp claim
 */
const isAuthenticated = (): boolean => {
    if (!isBrowser) return false;
    const token = sessionStorage.getItem('token');
    if (!token) return false;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return typeof payload.exp === 'number' && payload.exp * 1000 > Date.now();
    } catch {
        return false;
    }
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
};

export default authService;
