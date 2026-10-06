import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('biztrack_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor to catch 401 responses and clean state
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto-redirect on login or register check
      const url = error.config.url || '';
      if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
        localStorage.removeItem('biztrack_token');
        localStorage.removeItem('biztrack_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
