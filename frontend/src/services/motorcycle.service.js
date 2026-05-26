import api from './api';

export const motorcycleService = {
  // Get all motorcycles
  getAll: async () => {
    const response = await api.get('/motorcycles/all');
    return response.data;
  },

  // Get available motorcycles
  getAvailable: async () => {
    const response = await api.get('/motorcycles/available');
    return response.data;
  },

  // Get motorcycle by ID
  getById: async (id) => {
    const response = await api.get(`/motorcycles/${id}`);
    return response.data;
  },

  // Search motorcycles with filters
  search: async (filters) => {
    const params = new URLSearchParams();
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.year) params.append('year', filters.year);

    const response = await api.get(`/motorcycles/search?${params.toString()}`);
    return response.data;
  },

  // Search motorcycles paged
  searchPaged: async (filters, page = 0, size = 10, sort = 'createAt,desc') => {
    const params = new URLSearchParams();
    if (filters.brand) params.append('brand', filters.brand);
    if (filters.category) params.append('category', filters.category);
    if (filters.minPrice) params.append('minPrice', filters.minPrice);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
    if (filters.year) params.append('year', filters.year);
    if (filters.status) params.append('status', filters.status);
    if (filters.keyword) params.append('keyword', filters.keyword);
    params.append('page', page);
    params.append('size', size);
    if (sort) {
      const parts = sort.split(',');
      if (parts.length === 2) {
        params.append('sort', parts[0]);
        params.append('direction', parts[1]);
      } else {
        params.append('sort', sort);
      }
    }

    const response = await api.get(`/motorcycles/search-paged?${params.toString()}`);
    return response.data;
  },

  // Get all brands
  getBrands: async () => {
    const response = await api.get('/motorcycles/brands');
    return response.data;
  },

  // Get all categories
  getCategories: async () => {
    const response = await api.get('/motorcycles/categories');
    return response.data;
  },

  // Compare motorcycles
  compare: async (ids) => {
    const response = await api.post('/motorcycles/compare', ids);
    return response.data;
  },

  // Create motorcycle (admin/staff)
  create: async (data) => {
    const response = await api.post('/motorcycles', data);
    return response.data;
  },

  // Create motorcycle with images
  createWithImages: async (data, images) => {
    const formData = new FormData();
    formData.append('motorcycle', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    const response = await api.post('/motorcycles/with-images', formData);
    return response.data;
  },

  // Update motorcycle
  update: async (id, data) => {
    const response = await api.put(`/motorcycles/${id}`, data);
    return response.data;
  },

  // Update motorcycle with images
  updateWithImages: async (id, data, newImages, deleteUrls) => {
    const formData = new FormData();
    formData.append('motorcycle', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    
    if (newImages && newImages.length > 0) {
      newImages.forEach((image) => {
        formData.append('newImages', image);
      });
    }

    let url = `/motorcycles/${id}/with-images`;
    if (deleteUrls && deleteUrls.length > 0) {
      const params = new URLSearchParams();
      deleteUrls.forEach(url => params.append('deleteImageUrls', url));
      url += `?${params.toString()}`;
    }

    const response = await api.put(url, formData);
    return response.data;
  },

  // Delete motorcycle
  delete: async (id) => {
    const response = await api.delete(`/motorcycles/${id}`);
    return response.data;
  },

  // Delete motorcycle with images
  deleteWithImages: async (id) => {
    const response = await api.delete(`/motorcycles/${id}/with-images`);
    return response.data;
  },

  // Add images to motorcycle
  addImages: async (id, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.post(`/motorcycles/${id}/images`, formData);
    return response.data;
  },

  // Remove image from motorcycle
  removeImage: async (id, imageUrl) => {
    const response = await api.delete(`/motorcycles/${id}/images?url=${encodeURIComponent(imageUrl)}`);
    return response.data;
  },

  // Replace all images
  replaceAllImages: async (id, images) => {
    const formData = new FormData();
    images.forEach((image) => {
      formData.append('images', image);
    });

    const response = await api.put(`/motorcycles/${id}/images/replace`, formData);
    return response.data;
  },
};
