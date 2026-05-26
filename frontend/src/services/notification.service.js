import api from './api';

export const notificationService = {
  // Admin Endpoints
  getAdminNotifications: async () => {
    const response = await api.get('/notifications/admin');
    return response.data;
  },

  getAdminUnreadCount: async () => {
    const response = await api.get('/notifications/admin/unread-count');
    return response.data;
  },

  markAllAdminAsRead: async () => {
    await api.put('/notifications/admin/mark-all-read');
  },

  // User Endpoints
  getUserNotifications: async (userId) => {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  },

  getUserUnreadCount: async (userId) => {
    const response = await api.get(`/notifications/user/${userId}/unread-count`);
    return response.data;
  },

  markAllUserAsRead: async (userId) => {
    await api.put(`/notifications/user/${userId}/mark-all-read`);
  },

  // Common Endpoints
  markAsRead: async (id) => {
    await api.put(`/notifications/${id}/read`);
  }
};