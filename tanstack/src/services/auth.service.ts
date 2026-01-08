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
        // Store in localStorage for client-side access
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
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
        // Store in localStorage for client-side access
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
    }

    return response.data;
};

/**
 * Logout user
 * Clears localStorage and redirects to login
 */
const logout = async () => {
    if (isBrowser) {
        // Clear localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('token');

        // Redirect to login
        window.location.href = '/login';
    }
};

/**
 * Get current user from localStorage (client-side only)
 */
const getCurrentUser = (): (User & { token: string }) | null => {
    if (!isBrowser) return null;

    const userStr = localStorage.getItem('user');
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
 * Check if user is authenticated (client-side)
 */
const isAuthenticated = (): boolean => {
    return !!getCurrentUser();
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
    isAuthenticated,
};

export default authService;
