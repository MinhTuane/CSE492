import api from './api';

export const uploadService = {
  // Upload single image
  uploadSingle: async (file, folder = 'general') => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/upload/image?folder=${folder}`, formData);
    return response.data;
  },

  // Upload multiple images
  uploadMultiple: async (files, folder = 'general') => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });

    const response = await api.post(`/upload/images?folder=${folder}`, formData);
    return response.data;
  },

  // Delete image
  deleteImage: async (imageUrl) => {
    const response = await api.delete(`/upload/image?url=${encodeURIComponent(imageUrl)}`);
    return response.data;
  },
};
