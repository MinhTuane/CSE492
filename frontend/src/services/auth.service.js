import api from './api';

export const authService = {
  // Register new user
  register: async (data) => {
    const response = await api.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },
  
  registerWithUsername: async (data) => {
    const response = await api.post('/auth/register-username', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login with Google
  loginWithGoogle: async (idToken) => {
    const response = await api.post('/auth/oauth/google', { idToken });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Login with Facebook
  loginWithFacebook: async (accessToken) => {
    const response = await api.post('/auth/oauth/facebook', { accessToken });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    return response.data;
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from storage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Check if user is admin
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user?.role === 'ADMIN';
  },

  // Check if user is staff
  isStaff: () => {
    const user = authService.getCurrentUser();
    return user?.role === 'STAFF' || user?.role === 'ADMIN';
  },

  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/password-reset/request', { email });
    return response.data;
  },

  // Verify password reset token
  verifyResetToken: async (token) => {
    const response = await api.get(`/auth/password-reset/verify?token=${token}`);
    return response.data;
  },

  // Reset password with token
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/password-reset/confirm', { token, newPassword });
    return response.data;
  },
};
