import apiClient from '../api-client';
import type { User } from '@/types/campaign.types';

interface AuthResponse extends User {
  token: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

// Helper function to set cookie
const setCookie = (name: string, value: string, days: number = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

// Helper function to delete cookie
const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

const register = async (userData: RegisterData): Promise<AuthResponse> => {
  const response = await apiClient.post('/auth/register', userData);
  if (response.data) {
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('token', response.data.token);
    // Also set token in cookie for middleware
    setCookie('token', response.data.token);
  }
  return response.data;
};

const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  console.log('Auth service: Sending login request to API');
  const response = await apiClient.post('/auth/login', credentials);
  console.log('Auth service: Received response from API');

  if (response.data) {
    console.log('Auth service: Storing user data and token');
    localStorage.setItem('user', JSON.stringify(response.data));
    localStorage.setItem('token', response.data.token);
    // Also set token in cookie for middleware
    setCookie('token', response.data.token);
    console.log('Auth service: Token stored in localStorage and cookie');
  }
  return response.data;
};

const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  // Also remove token from cookie
  deleteCookie('token');
};

const getCurrentUser = (): (User & { token: string }) | null => {
  if (typeof window === 'undefined') return null;
  
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

const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};

export default authService;

