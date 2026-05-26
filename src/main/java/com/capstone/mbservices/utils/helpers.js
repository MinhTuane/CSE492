
// 💰 Format Currency (VND)
export const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(amount);
};

// 📅 Format Date (Vietnamese)
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// 🧹 Clean Motorcycle Data (Remove Circular References)
export const cleanMotorcycleData = (motorcycles) => {
  if (!motorcycles) return [];
  if (!Array.isArray(motorcycles)) motorcycles = [motorcycles];
  
  return motorcycles.map(m => ({
    id: m.id,
    brand: m.brand,
    model: m.model,
    year: m.year,
    category: m.category,
    price: m.price,
    status: m.status,
    description: m.description,
    engineType: m.engineType,
    displacement: m.displacement,
    power: m.power,
    torque: m.torque,
    weight: m.weight,
    topSpeed: m.topSpeed,
    fuelCapacity: m.fuelCapacity,
    stock: m.stock,
    images: m.images || [],
    features: m.features || [],
    color: m.color,
    averageRating: m.averageRating || 0,
    createAt: m.createAt,
    updateAt: m.updateAt
  }));
};

// 🖼️ Get Image URL (Handle All Image Path Types)
export const getImageUrl = (imagePath) => {
  // No image provided - return fallback
  if (!imagePath) {
    return 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
  
  // Already a full URL (e.g., Cloudinary) - return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  
  // Path starting with /images/ - prepend backend URL
  if (imagePath.startsWith('/images/')) {
    return `http://localhost:8080${imagePath}`;
  }
  
  // Relative path - treat as static resource
  if (!imagePath.startsWith('/')) {
    return `http://localhost:8080/images/motorcycles/${imagePath}`;
  }
  
  // Fallback
  return imagePath;
};

// 🖼️ Handle Image Error (Fallback Image)
export const handleImageError = (e) => {
  e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  e.target.onerror = null; // Prevent infinite loop
};

// 🖼️ Default Fallback Image URL
export const FALLBACK_IMAGE = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';

// 📊 Format Number
export const formatNumber = (number) => {
  if (!number && number !== 0) return 'N/A';
  return new Intl.NumberFormat('vi-VN').format(number);
};

// 📊 Format Rating (1 decimal place)
export const formatRating = (rating) => {
  if (!rating && rating !== 0) return '0.0';
  return rating.toFixed(1);
};

// ✅ Validate Email
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ✅ Validate Phone (Vietnamese format)
export const isValidPhone = (phone) => {
  // Vietnamese phone: 10 digits, starts with 0
  const phoneRegex = /^0\d{9}$/;
  return phoneRegex.test(phone);
};

// 🎨 Get Status Color
export const getStatusColor = (status) => {
  const colors = {
    AVAILABLE: 'bg-green-100 text-green-800',
    SOLD: 'bg-red-100 text-red-800',
    RESERVED: 'bg-yellow-100 text-yellow-800',
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-blue-100 text-blue-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// 🎨 Get Brand Color
export const getBrandColor = (brand) => {
  const colors = {
    'YAMAHA': 'text-blue-600',
    'HONDA': 'text-red-600',
    'KAWASAKI': 'text-green-600',
    'BMW': 'text-blue-500',
    'DUCATI': 'text-red-700',
    'HARLEY-DAVIDSON': 'text-orange-600',
    'SUZUKI': 'text-blue-700',
    'TRIUMPH': 'text-gray-700',
    'KTM': 'text-orange-500',
    'ROYAL ENFIELD': 'text-purple-600',
  };
  return colors[brand] || 'text-gray-700';
};

// 🔒 Check if User is Admin
export const isAdmin = (user) => {
  return user?.role === 'ADMIN';
};

// 🔒 Check if User is Staff
export const isStaff = (user) => {
  return user?.role === 'STAFF' || user?.role === 'ADMIN';
};

// 🔒 Check if User is Customer
export const isCustomer = (user) => {
  return user?.role === 'CUSTOMER';
};

// 📝 Truncate Text
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// 📝 Capitalize First Letter
export const capitalizeFirst = (text) => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

// 📝 Format Motorcycle Title
export const formatMotorcycleTitle = (motorcycle) => {
  if (!motorcycle) return '';
  return `${motorcycle.brand} ${motorcycle.model} ${motorcycle.year}`;
};

// ⏰ Get Time Ago (e.g., "2 hours ago")
export const getTimeAgo = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now - past) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)} weeks ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} months ago`;
  return `${Math.floor(diffInSeconds / 31536000)} years ago`;
};

// 🔍 Search Filter
export const searchFilter = (items, searchTerm, fields) => {
  if (!searchTerm) return items;
  
  const term = searchTerm.toLowerCase();
  return items.filter(item => 
    fields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value?.toString().toLowerCase().includes(term);
    })
  );
};

// 🎯 Generate Order Number
export const generateOrderNumber = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  return `ORD-${timestamp}-${random}`;
};

// 🎯 Generate Transaction ID
export const generateTransactionId = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `TXN-${timestamp}-${random}`;
};

// 💾 Local Storage Helpers
export const storage = {
  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from localStorage:', error);
      return null;
    }
  },
  
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to localStorage:', error);
      return false;
    }
  },
  
  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from localStorage:', error);
      return false;
    }
  },
  
  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing localStorage:', error);
      return false;
    }
  }
};

// 🔄 Debounce Function
export const debounce = (func, wait = 300) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 🔄 Throttle Function
export const throttle = (func, limit = 300) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// 📱 Check if Mobile
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// 🎨 Generate Random Color
export const getRandomColor = () => {
  const colors = [
    'bg-red-100 text-red-800',
    'bg-blue-100 text-blue-800',
    'bg-green-100 text-green-800',
    'bg-yellow-100 text-yellow-800',
    'bg-purple-100 text-purple-800',
    'bg-pink-100 text-pink-800',
    'bg-indigo-100 text-indigo-800',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

// 📊 Calculate Discount Percentage
export const calculateDiscount = (originalPrice, discountedPrice) => {
  if (!originalPrice || !discountedPrice) return 0;
  return Math.round(((originalPrice - discountedPrice) / originalPrice) * 100);
};

// 📊 Calculate Total
export const calculateTotal = (items) => {
  if (!items || items.length === 0) return 0;
  return items.reduce((total, item) => total + (item.price * (item.quantity || 1)), 0);
};

// ✨ Export all as default object (optional)
export default {
  formatCurrency,
  formatDate,
  cleanMotorcycleData,
  getImageUrl,
  handleImageError,
  FALLBACK_IMAGE,
  formatNumber,
  formatRating,
  isValidEmail,
  isValidPhone,
  getStatusColor,
  getBrandColor,
  isAdmin,
  isStaff,
  isCustomer,
  truncateText,
  capitalizeFirst,
  formatMotorcycleTitle,
  getTimeAgo,
  searchFilter,
  generateOrderNumber,
  generateTransactionId,
  storage,
  debounce,
  throttle,
  isMobile,
  getRandomColor,
  calculateDiscount,
  calculateTotal,
};