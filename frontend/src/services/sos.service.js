import api from './api';

export const sosService = {
  createRequest: async (data) => {
    const response = await api.post('/sos', data);
    return response.data;
  }
};
