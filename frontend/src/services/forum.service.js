import api from './api';

export const forumService = {
  getAllPosts: async (page = 0, size = 10, category = null, search = null, hot = null) => {
    return forumService.getPosts(page, size, category, search, hot);
  },
  getHotTopics: async (size = 10) => {
    const data = await forumService.getPosts(0, size, null, null, true);
    return data?.content || [];
  },
  getPosts: async (page = 0, size = 10, category = null, search = null, hot = null) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('size', size);
    if (category) params.append('category', category);
    if (search) params.append('search', search);
    if (hot !== null && hot !== undefined) params.append('hot', hot);
    const response = await api.get(`/forum/posts?${params.toString()}`);
    return response.data;
  },
  getPost: async (id) => {
    const response = await api.get(`/forum/posts/${id}`);
    return response.data;
  },
  createPost: async (data) => {
    const response = await api.post('/forum/posts', data);
    return response.data;
  },
  addComment: async (postId, data) => {
    const response = await api.post(`/forum/posts/${postId}/comments`, data);
    return response.data;
  },
  updateComment: async (commentId, data) => {
    const response = await api.put(`/forum/comments/${commentId}`, data);
    return response.data;
  },
  likePost: async (id) => {
    const response = await api.post(`/forum/posts/${id}/like`);
    return response.data;
  },
  reportPost: async (id) => {
    const response = await api.post(`/forum/posts/${id}/report`);
    return response.data;
  },
};
