import api from './api';

export const accessoryService = {
  getAll: async () => {
    const response = await api.get('/accessories');
    return response.data;
  },

  searchPaged: async (keyword, page = 0, size = 10, sort = 'createAt', direction = 'desc') => {
    const params = new URLSearchParams();
    if (keyword) params.append('keyword', keyword);
    params.append('page', page);
    params.append('size', size);
    params.append('sort', sort);
    params.append('direction', direction);
    
    const response = await api.get(`/accessories/search-paged?${params.toString()}`);
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/accessories/${id}`);
    return response.data;
  }
};
