import api from './api';

export const userBikeService = {
  getUserBikes: async (userId) => {
    const response = await api.get(`/user-bikes/user/${userId}`);
    return response.data;
  },

  addBike: async (data) => {
    const response = await api.post('/user-bikes', data);
    return response.data;
  },

  removeBike: async (id) => {
    const response = await api.delete(`/user-bikes/${id}`);
    return response.data;
  }
};
