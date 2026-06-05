import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Ensure FormData requests have proper multipart boundaries by not overriding Content-Type
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    const method = (error?.config?.method || 'GET').toUpperCase();
    
    // Handle rate limiting (429 Too Many Requests)
    if (status === 429) {
      const retryAfter = error.response?.headers?.['x-rate-limit-retry-after-seconds'];
      const message = retryAfter 
        ? `Too many requests. Please try again in ${retryAfter} seconds.`
        : 'Too many requests. Please try again later.';
      
      // You can show a toast notification here if you have a toast library
      console.error('Rate limit exceeded:', message);
      return Promise.reject(new Error(message));
    }
    
    const isPublicUrl = (u, m) => {
      const starts = (p) => u.startsWith(p);
      return (
        starts('/auth/') ||
        starts('/reviews/motorcycle/') ||
        u === '/reviews/approved' ||
        u === '/bookings/services/stats' ||
        starts('/bookings/services/recent') ||
        starts('/bookings/services/catalog') ||
        u === '/bookings/stores' ||
        starts('/bookings/stores/nearest') ||
        starts('/inventory/motorcycle/') ||
        starts('/inventory/store/') ||
        (starts('/motorcycles/') && m === 'GET') ||
        (starts('/forum/') && m === 'GET')
      );
    };
    
    // Handle authentication errors (401 Unauthorized)
    if (status === 401 && !isPublicUrl(url, method)) {
      console.warn('Session expired or unauthorized, clearing tokens and redirecting to login');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Clear auth store
      if (window.useAuthStore) {
        window.useAuthStore.getState().logout();
      }
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    } else if (status === 403 && !isPublicUrl(url, method)) {
      console.warn('Access forbidden: user does not have required permissions');
      // Do not clear tokens or redirect to login. Simply reject so components can show "Access Denied".
    }
    return Promise.reject(error);
  }
);

export default api;
