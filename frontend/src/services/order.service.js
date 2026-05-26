import api from './api';

export const orderService = {
  // Get all orders (staff/admin)
  getAll: async (page = 0, size = 10, status = null, search = null) => {
    let url = `/orders/all?page=${page}&size=${size}`;
    if (status) url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    const response = await api.get(url);
    return response.data;
  },
  // Create order
  create: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  // Get order by ID
  getById: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  // Get user orders
  getUserOrders: async (userId) => {
    const response = await api.get(`/orders/user/${userId}`);
    return response.data;
  },

  // Update order status (admin/staff)
  updateStatus: async (id, status) => {
    const response = await api.put(`/orders/${id}/status?status=${status}`);
    return response.data;
  },

  // Process payment
  processPayment: async (id, transactionId) => {
    const response = await api.post(`/orders/${id}/payment?transactionId=${transactionId}`);
    return response.data;
  },

  verifyVNPay: async (params) => {
    const response = await api.get('/orders/vnpay/verify', { params });
    return response.data;
  },

  verifyZaloPay: async (apptransid) => {
    const response = await api.get('/orders/zalopay/verify', { params: { apptransid } });
    return response.data;
  },

  // Create VNPay URL
  createVNPayUrl: async (id) => {
    const response = await api.post(`/orders/${id}/vnpay-url`);
    return response.data;
  },

  createZaloPayUrl: async (id) => {
    const response = await api.post(`/orders/${id}/zalopay-url`);
    return response.data;
  },

  createMomoUrl: async (id) => {
    const response = await api.post(`/orders/${id}/momo-url`);
    return response.data;
  },
};
