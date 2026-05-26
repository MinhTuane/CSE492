import api from './api';

export const userService = {
  // Get user profile
  getProfile: async (userId) => {
    const response = await api.get(`/users/profile/${userId}`);
    return response.data;
  },

  // Update user profile
  updateProfile: async (userId, updates) => {
    const response = await api.put(`/users/profile/${userId}`, updates);
    return response.data;
  },

  // Change password
  changePassword: async (userId, oldPassword, newPassword) => {
    const response = await api.post(`/users/${userId}/change-password`, {
      oldPassword,
      newPassword,
    });
    return response.data;
  },

  // Update email
  updateEmail: async (userId, newEmail, password) => {
    const response = await api.post(`/users/${userId}/update-email`, {
      newEmail,
      password,
    });
    return response.data;
  },
  
  setUsername: async (userId, username, password = '') => {
    const response = await api.post(`/users/${userId}/username`, { username, password });
    return response.data;
  },
  
  setPassword: async (userId, newPassword, oldPassword = '') => {
    const payload = { newPassword };
    if (oldPassword) payload.oldPassword = oldPassword;
    const response = await api.post(`/users/${userId}/set-password`, payload);
    return response.data;
  },

  // Get user statistics
  getStats: async (userId) => {
    const response = await api.get(`/users/${userId}/stats`);
    return response.data;
  },

  // Deactivate account
  deactivateAccount: async (userId, password) => {
    const response = await api.post(`/users/${userId}/deactivate`, { password });
    return response.data;
  },

  // Reactivate account (admin)
  reactivateAccount: async (userId) => {
    const response = await api.post(`/users/${userId}/reactivate`);
    return response.data;
  },

  // Check email availability
  checkEmailAvailability: async (email, userId = null) => {
    const params = new URLSearchParams({ email });
    if (userId) params.append('userId', userId);
    const response = await api.get(`/users/check-email?${params.toString()}`);
    return response.data;
  },
  
  checkUsernameAvailability: async (username, userId = null) => {
    const params = new URLSearchParams({ username });
    if (userId) params.append('userId', userId);
    const response = await api.get(`/users/check-username?${params.toString()}`);
    return response.data;
  },

  // Get full name
  getFullName: async (userId) => {
    const response = await api.get(`/users/${userId}/full-name`);
    return response.data;
  },
};
