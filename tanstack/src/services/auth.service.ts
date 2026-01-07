import apiClient from './apiClient';
import type { User } from '../types/campaign.types';

interface AuthResponse extends User {
    token: string;
}

// Helper to check if we're in the browser
const isBrowser = typeof window !== 'undefined';

const register = async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.data && isBrowser) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

const login = async (userData: any): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', userData);
    if (response.data && isBrowser) {
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('token', response.data.token);
    }
    return response.data;
};

const logout = () => {
    if (isBrowser) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
};

const getCurrentUser = (): (User & { token: string }) | null => {
    if (!isBrowser) return null;

    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser,
};

export default authService;
