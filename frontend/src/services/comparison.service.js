import api from './api';

export const comparisonService = {
  // Compare motorcycles
  compare: async (motorcycleIds) => {
    const response = await api.post('/comparison/compare', motorcycleIds);
    return response.data;
  },

  // Get comparison summary with statistics
  getSummary: async (motorcycleIds) => {
    const response = await api.post('/comparison/summary', motorcycleIds);
    return response.data;
  },

  // Get alternative motorcycles
  getAlternatives: async (motorcycleIds, limit = 5) => {
    const response = await api.post(`/comparison/alternatives?limit=${limit}`, motorcycleIds);
    return response.data;
  },

  // Quick compare via GET
  quickCompare: async (ids) => {
    const params = new URLSearchParams();
    ids.forEach(id => params.append('ids', id));
    const response = await api.get(`/comparison?${params.toString()}`);
    return response.data;
  },
};
