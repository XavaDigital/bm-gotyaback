import axios from 'axios';

/**
 * Get the appropriate API base URL based on environment
 * - Server-side (SSR): Use internal API URL
 * - Client-side: Use public API URL
 */
const getBaseURL = () => {
  // Server-side rendering
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:5000/api';
  }
  // Client-side
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
};

const apiClient = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    // Only access localStorage on client-side
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      // Clear auth data (token might be invalid or expired)
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login/register/home pages
      const currentPath = window.location.pathname;
      if (
        currentPath !== '/login' &&
        currentPath !== '/register' &&
        currentPath !== '/'
      ) {
        console.warn('Session expired or invalid. Please login again.');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

