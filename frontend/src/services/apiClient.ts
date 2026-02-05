import axios from 'axios';

const apiClient = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json',
    },
    // Disable axios's default error logging
    validateStatus: (status) => {
        // Accept all status codes to prevent axios from throwing
        // We'll handle errors in the interceptor
        return status >= 200 && status < 600;
    },
});

// Add a request interceptor to include auth token if available
apiClient.interceptors.request.use(
    (config) => {
        // Only access localStorage on the client side
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

// Add a response interceptor to handle errors
apiClient.interceptors.response.use(
    (response) => {
        // Handle 404 for layout endpoints silently
        if (response.status === 404 && response.config?.url?.includes('/layout')) {
            return { ...response, data: null };
        }

        // For other error status codes (4xx, 5xx), reject
        if (response.status >= 400) {
            return Promise.reject({
                response,
                message: response.data?.message || 'Request failed',
                config: response.config,
            });
        }

        return response;
    },
    (error) => {
        // Network errors or other issues
        return Promise.reject(error);
    }
);

export default apiClient;
