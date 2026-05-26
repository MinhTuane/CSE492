import api from './api';

export const storeService = {
  getAllStores: async () => {
    try {
      const response = await api.get('/bookings/stores');
      return response.data;
    } catch (error) {
      console.error('Error fetching stores:', error);
      throw error;
    }
  },
  
  getNearestStore: async (lat, lng) => {
    try {
      const response = await api.get('/bookings/stores/nearest', {
        params: { lat, lng }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching nearest store:', error);
      throw error;
    }
  }
};
