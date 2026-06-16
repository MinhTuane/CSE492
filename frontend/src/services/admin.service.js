import api from './api';

// ============ DASHBOARD ============

export const getDashboardStats = async (storeId = null) => {
  let url = '/admin/dashboard/stats';
  if (storeId && storeId !== 'all') {
    url += `?storeId=${storeId}`;
  }
  const response = await api.get(url);
  return response.data;
};

export const getRecentOrders = async (limit = 10) => {
  const response = await api.get(`/admin/dashboard/recent-orders?limit=${limit}`);
  return response.data;
};

export const getRevenueData = async (days = 30) => {
  const response = await api.get(`/admin/dashboard/revenue?days=${days}`);
  return response.data;
};

export const getLowStockMotorcycles = async (threshold = 5) => {
  const response = await api.get(`/admin/dashboard/low-stock?threshold=${threshold}`);
  return response.data;
};

// ============ MOTORCYCLE MANAGEMENT ============

export const getAllMotorcyclesAdmin = async (page = 0, size = 10, brand = null, status = null, search = null) => {
  let url = `/admin/motorcycles?page=${page}&size=${size}`;
  if (brand) url += `&brand=${brand}`;
  if (status) url += `&status=${status}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const response = await api.get(url);
  return response.data;
};

export const addMotorcycle = async (motorcycleData) => {
  const response = await api.post('/admin/motorcycles', motorcycleData);
  return response.data;
};

export const updateMotorcycle = async (id, motorcycleData) => {
  const response = await api.put(`/admin/motorcycles/${id}`, motorcycleData);
  return response.data;
};

export const deleteMotorcycle = async (id) => {
  const response = await api.delete(`/admin/motorcycles/${id}`);
  return response.data;
};

export const updateMotorcycleStock = async (id, stock) => {
  const response = await api.patch(`/admin/motorcycles/${id}/stock`, null, { params: { stock } });
  return response.data;
};

export const updateMotorcycleStatus = async (id, status) => {
  const response = await api.patch(`/admin/motorcycles/${id}/status`, null, { params: { status } });
  return response.data;
};

// ============ ORDER MANAGEMENT ============

export const getAllOrdersAdmin = async (page = 0, size = 10, status = null, search = null) => {
  let url = `/admin/orders?page=${page}&size=${size}`;
  if (status) url += `&status=${status}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const response = await api.get(url);
  return response.data;
};

export const getOrderById = async (id) => {
  const response = await api.get(`/admin/orders/${id}`);
  return response.data;
};

export const updateOrderStatus = async (id, status) => {
  const response = await api.patch(`/admin/orders/${id}/status`, null, { params: { status } });
  return response.data;
};

export const cancelOrder = async (id, reason = null) => {
  const response = await api.post(`/admin/orders/${id}/cancel`, { reason });
  return response.data;
};

export const refundOrder = async (id) => {
  const response = await api.post(`/admin/orders/${id}/refund`);
  return response.data;
};

// ============ USER MANAGEMENT ============

export const getAllUsersAdmin = async (page = 0, size = 10, role = null, search = null) => {
  let url = `/admin/users?page=${page}&size=${size}`;
  if (role) url += `&role=${role}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  
  const response = await api.get(url);
  return response.data;
};

export const getUserDetails = async (id) => {
  const response = await api.get(`/admin/users/${id}`);
  return response.data;
};

export const activateUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/activate`);
  return response.data;
};

export const deactivateUser = async (id) => {
  const response = await api.patch(`/admin/users/${id}/deactivate`);
  return response.data;
};

export const changeUserRole = async (id, role) => {
  const response = await api.patch(`/admin/users/${id}/role`, null, { params: { role } });
  return response.data;
};

export const deleteUser = async (id) => {
  const response = await api.delete(`/admin/users/${id}`);
  return response.data;
};

export const toggleUserStatus = async (id) => {
  const response = await api.patch(`/admin/users/${id}/toggle-status`);
  return response.data;
};
// ============ BOOKING MANAGEMENT ============

export const getAllTestRides = async (page = 0, size = 10, status = null) => {
  let url = `/admin/test-rides?page=${page}&size=${size}`;
  if (status) url += `&status=${status}`;
  
  const response = await api.get(url);
  return response.data;
};

export const approveTestRide = async (id) => {
  const response = await api.patch(`/admin/test-rides/${id}/approve`);
  return response.data;
};

export const rejectTestRide = async (id, reason = null) => {
  const response = await api.patch(`/admin/test-rides/${id}/reject`, null, { params: { reason } });
  return response.data;
};

export const completeTestRide = async (id) => {
  const response = await api.patch(`/admin/test-rides/${id}/complete`);
  return response.data;
};

export const getAllServices = async (page = 0, size = 10, status = null) => {
  let url = `/admin/services?page=${page}&size=${size}`;
  if (status) url += `&status=${status}`;
  
  const response = await api.get(url);
  return response.data;
};

export const createService = async (payload) => {
  const response = await api.post('/admin/services', payload);
  return response.data;
};

export const updateServiceStatus = async (id, status) => {
  const response = await api.patch(`/admin/services/${id}/status`, null, { params: { status } });
  return response.data;
};

export const updateService = async (id, payload) => {
  const response = await api.put(`/admin/services/${id}`, payload);
  return response.data;
};

export const deleteServiceAdmin = async (id) => {
  const response = await api.delete(`/admin/services/${id}`);
  return response.data;
};
export const assignStaffToService = async (id, staffId) => {
  const response = await api.patch(`/admin/services/${id}/assign-staff`, null, { params: { staffId } });
  return response.data;
};

// ============ TEST RIDE STAFF & STATUS ============

export const getAvailableStaff = async (storeId, start, durationMinutes) => {
  const params = new URLSearchParams({ storeId, start, durationMinutes });
  const response = await api.get(`/admin/staff/available?${params.toString()}`);
  return response.data;
};

export const assignStaffToTestRide = async (id, staffId) => {
  const response = await api.patch(`/admin/test-rides/${id}/assign-staff`, null, { params: { staffId } });
  return response.data;
};

export const confirmAssignedTestRide = async (id) => {
  const response = await api.put(`/bookings/test-rides/${id}/confirm-assignment`);
  return response.data;
};

export const proposeTestRideTime = async (id, newDate, note = null) => {
  const params = new URLSearchParams({ newDate });
  if (note) params.append('note', note);
  const response = await api.put(`/bookings/test-rides/${id}/propose?${params.toString()}`);
  return response.data;
};

export const updateTestRideStatus = async (id, status) => {
  const response = await api.patch(`/admin/test-rides/${id}/status`, null, { params: { status } });
  return response.data;
};

// ============ SERVICE CATALOG ============
export const getAllServiceOfferings = async (page = 0, size = 50, search = null, storeId = null) => {
  let url = `/admin/service-offerings?page=${page}&size=${size}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;
  if (storeId) url += `&storeId=${encodeURIComponent(storeId)}`;
  const response = await api.get(url);
  return response.data;
};

export const createServiceOffering = async (payload) => {
  const response = await api.post('/admin/service-offerings', payload);
  return response.data;
};

export const updateServiceOffering = async (id, payload) => {
  const response = await api.put(`/admin/service-offerings/${id}`, payload);
  return response.data;
};

export const deleteServiceOffering = async (id) => {
  const response = await api.delete(`/admin/service-offerings/${id}`);
  return response.data;
};

export const setServiceOfferingActive = async (id, active) => {
  const response = await api.patch(`/admin/service-offerings/${id}/active`, null, { params: { active } });
  return response.data;
};

// ============ REVIEW MANAGEMENT ============

export const getAllReviewsAdmin = async (page = 0, size = 10, approved = null) => {
  let url = `/admin/reviews?page=${page}&size=${size}`;
  if (approved !== null) url += `&approved=${approved}`;
  
  const response = await api.get(url);
  return response.data;
};

export const approveReview = async (id) => {
  const response = await api.patch(`/admin/reviews/${id}/approve`);
  return response.data;
};

export const rejectReview = async (id) => {
  const response = await api.patch(`/admin/reviews/${id}/reject`);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

export const flagReview = async (id) => {
  const response = await api.patch(`/admin/reviews/${id}/flag`);
  return response.data;
};

// ============ STAFF MANAGEMENT ============

export const getAllStaff = async () => {
  const response = await api.get('/admin/staff');
  return response.data;
};

export const addStaff = async (staffData) => {
  const response = await api.post('/admin/staff', staffData);
  return response.data;
};

export const updateStaffPermissions = async (id, permissions) => {
  const response = await api.patch(`/admin/staff/${id}/permissions`, { permissions });
  return response.data;
};

export const removeStaff = async (id) => {
  const response = await api.delete(`/admin/staff/${id}`);
  return response.data;
};

// ============ STORES ============

export const getStoresAdmin = async () => {
  const response = await api.get('/admin/stores');
  return response.data;
};

export const updateStore = async (storeId, data) => {
  const response = await api.put(`/admin/stores/${storeId}`, data);
  return response.data;
};

export const updateTestRideStore = async (id, storeId) => {
  const response = await api.patch(`/admin/test-rides/${id}/store`, null, { params: { storeId } });
  return response.data;
};

// ============ STORE INVENTORY ============

export const getStoreInventory = async (storeId) => {
  const response = await api.get(`/inventory/store/${storeId}`);
  return response.data;
};

export const updateStoreInventory = async (storeId, motorcycleId, stock) => {
  const response = await api.post(`/inventory/update`, null, {
    params: { storeId, motorcycleId, stock }
  });
  return response.data;
};

const adminService = {
  // Inventory
  getStoreInventory,
  updateStoreInventory,
  
  // Dashboard
  getDashboardStats,
  getRecentOrders,
  getRevenueData,
  getLowStockMotorcycles,
  
  // Motorcycles
  getAllMotorcyclesAdmin,
  addMotorcycle,
  updateMotorcycle,
  deleteMotorcycle,
  updateMotorcycleStock,
  updateMotorcycleStatus,
  
  // Orders
  getAllOrdersAdmin,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  refundOrder,
  
  // Users
  getAllUsersAdmin,
  getAllStores: getStoresAdmin,
  updateStore,
  getUserDetails,
  activateUser,
  deactivateUser,
  changeUserRole,
  deleteUser,
  toggleUserStatus,
  
  // Bookings
  getAllTestRides,
  approveTestRide,
  rejectTestRide,
  completeTestRide,
  getAllServices,
  updateServiceStatus,
  assignStaffToService,
  getAvailableStaff,
  assignStaffToTestRide,
  confirmAssignedTestRide,
  proposeTestRideTime,
  updateTestRideStatus,
  
  // Service Catalog
  getAllServiceOfferings,
  createServiceOffering,
  updateServiceOffering,
  deleteServiceOffering,
  setServiceOfferingActive,
  
  // Reviews
  getAllReviewsAdmin,
  approveReview,
  rejectReview,
  deleteReview,
  flagReview,
  
  // Forum
  getAllForumPosts: async (page = 0, size = 10, category = null, search = null, hidden = null) => {
    let url = `/admin/forum/posts?page=${page}&size=${size}`;
    if (category) url += `&category=${encodeURIComponent(category)}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (hidden !== null && hidden !== undefined) url += `&hidden=${hidden}`;
    const response = await api.get(url);
    return response.data;
  },
  setForumPostHot: async (id, hot) => {
    const response = await api.patch(`/admin/forum/posts/${id}/hot?hot=${hot}`);
    return response.data;
  },
  setForumPostHidden: async (id, hidden) => {
    const response = await api.patch(`/admin/forum/posts/${id}/hidden?hidden=${hidden}`);
    return response.data;
  },
  deleteForumPost: async (id) => {
    const response = await api.delete(`/admin/forum/posts/${id}`);
    return response.data;
  },
  setForumCommentHidden: async (id, hidden) => {
    const response = await api.patch(`/admin/forum/comments/${id}/hidden?hidden=${hidden}`);
    return response.data;
  },
  flagForumComment: async (id) => {
    const response = await api.patch(`/admin/forum/comments/${id}/flag`);
    return response.data;
  },
  deleteForumComment: async (id) => {
    const response = await api.delete(`/admin/forum/comments/${id}`);
    return response.data;
  },
  getForumCommentsByPost: async (postId, page = 0, size = 10) => {
    const response = await api.get(`/admin/forum/posts/${postId}/comments?page=${page}&size=${size}`);
    return response.data;
  },
  migrateImages: async () => {
    const response = await api.post('/admin/migrate-images');
    return response.data;
  },
  restoreLocalImages: async () => {
    const response = await api.post('/admin/restore-local-images');
    return response.data;
  },
};

export default adminService;
