import api from './api';

export const bookingService = {
  // Test Rides
  scheduleTestRide: async (data) => {
    const response = await api.post('/bookings/test-rides', data);
    return response.data;
  },
  
  getStores: async () => {
    const response = await api.get('/bookings/stores');
    return response.data;
  },
  
  getNearestStore: async (lat, lng) => {
    const response = await api.get(`/bookings/stores/nearest?lat=${lat}&lng=${lng}`);
    return response.data;
  },

  getUserTestRides: async (userId) => {
    const response = await api.get(`/bookings/test-rides/user/${userId}`);
    return response.data;
  },

  confirmTestRide: async (id) => {
    const response = await api.put(`/bookings/test-rides/${id}/confirm`);
    return response.data;
  },

  cancelTestRide: async (id) => {
    const response = await api.delete(`/bookings/test-rides/${id}`);
    return response.data;
  },

  // Maintenance Services
  scheduleService: async (data) => {
    const response = await api.post('/bookings/services', data);
    return response.data;
  },

  getUserServices: async (userId) => {
    const response = await api.get(`/bookings/services/user/${userId}`);
    return response.data;
  },
  
  getServiceStats: async () => {
    const response = await api.get('/bookings/services/stats');
    return response.data;
  },
  
  getRecentServices: async (limit = 5) => {
    const response = await api.get(`/bookings/services/recent?limit=${limit}`);
    return response.data;
  },
  
  getServiceCatalog: async (storeId = null) => {
    const params = storeId ? `?storeId=${encodeURIComponent(storeId)}` : '';
    const response = await api.get(`/bookings/services/catalog${params}`);
    return response.data;
  },

  createTestRideDeposit: async (testRideId) => {
    const response = await api.post(`/bookings/test-rides/${testRideId}/deposit`);
    return response.data;
  },

  getAvailableSlots: async (storeId, date, type = 'TEST_RIDE', durationMinutes = 30) => {
    const response = await api.get('/bookings/available-slots', {
      params: { storeId, date, type, durationMinutes },
    });
    return response.data;
  },
};
