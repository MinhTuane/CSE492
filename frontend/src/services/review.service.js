import api from './api';

export const reviewService = {
  // Create review
  create: async (data) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  // Get motorcycle reviews
  getMotorcycleReviews: async (motorcycleId) => {
    const response = await api.get(`/reviews/motorcycle/${motorcycleId}`);
    return response.data;
  },

  // Get approved reviews
  getApprovedReviews: async () => {
    const response = await api.get('/reviews/approved');
    return response.data;
  },

  // Approve review (admin/staff)
  approve: async (id) => {
    const response = await api.put(`/reviews/${id}/approve`);
    return response.data;
  },

  // Flag review (admin/staff)
  flag: async (id) => {
    const response = await api.put(`/reviews/${id}/flag`);
    return response.data;
  },
};
