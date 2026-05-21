import axios from 'axios';

const apiBaseUrl = import.meta.env.VITE_API_URL;
if (!apiBaseUrl) {
  throw new Error('VITE_API_URL is not set. Add it to your .env file.');
}

const apiClient = axios.create({
    baseURL: apiBaseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include auth token if available
apiClient.interceptors.request.use(
    (config) => {
        // Only access localStorage on the client side
        if (typeof window !== 'undefined') {
            const token = sessionStorage.getItem('token');
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
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // Handle 404 for layout endpoints silently — caller expects null data
        if (status === 404 && error.config?.url?.includes('/layout')) {
            return Promise.resolve({ ...error.response, data: null });
        }

        // On 401, clear stale session and redirect to login
        if (status === 401 && typeof window !== 'undefined') {
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('token');
            window.location.href = '/login';
        }

        return Promise.reject(error);
    }
);

export default apiClient;
