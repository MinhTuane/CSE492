// Format currency
export const formatCurrency = (value) => {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND'
  }).format(value);
};

// Clean motorcycle data to remove circular references
export const cleanMotorcycleData = (motorcycles) => {
  if (!motorcycles) return [];
  
  if (!Array.isArray(motorcycles)) {
    motorcycles = [motorcycles];
  }
  
  return motorcycles.map(motorcycle => ({
    id: motorcycle.id,
    brand: motorcycle.brand,
    model: motorcycle.model,
    year: motorcycle.year,
    category: motorcycle.category,
    price: motorcycle.price,
    status: motorcycle.status,
    description: motorcycle.description,
    engineType: motorcycle.engineType,
    displacement: motorcycle.displacement,
    power: motorcycle.power,
    torque: motorcycle.torque,
    weight: motorcycle.weight,
    topSpeed: motorcycle.topSpeed,
    fuelCapacity: motorcycle.fuelCapacity,
    stock: motorcycle.stock,
    images: motorcycle.images || [],
    features: motorcycle.features || [],
    color: motorcycle.color,
    averageRating: motorcycle.averageRating || 0,
    discountPercentage: motorcycle.discountPercentage || 0,
    createAt: motorcycle.createAt,
    updateAt: motorcycle.updateAt
  }));
};

// Format date
export const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Format datetime
export const formatDateTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get order status color
export const getOrderStatusColor = (status) => {
  const colors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    PROCESSING: 'bg-blue-100 text-blue-800',
    SHIPPED: 'bg-purple-100 text-purple-800',
    DELIVERED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Get motorcycle status color
export const getMotorcycleStatusColor = (status) => {
  const colors = {
    AVAILABLE: 'bg-green-100 text-green-800',
    SOLD: 'bg-red-100 text-red-800',
    RESERVED: 'bg-yellow-100 text-yellow-800',
    MAINTENANCE: 'bg-blue-100 text-blue-800',
    OUT_OF_STOCK: 'bg-gray-100 text-gray-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

// Validate email
export const isValidEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Validate phone
export const isValidPhone = (phone) => {
  const re = /^[0-9]{10,11}$/;
  return re.test(phone);
};

// Generate random ID
export const generateId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// Debounce function
export const debounce = (func, wait) => {
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

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  const names = name.split(' ');
  return names.map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

// Class names utility
export const cn = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  }
  const lower = imagePath.toLowerCase();
  if (lower.startsWith('http://') || lower.startsWith('https://')) return imagePath;
  if (lower.startsWith('//')) return `https:${imagePath}`;
  if (lower.startsWith('data:') || lower.startsWith('blob:')) return imagePath;
  if (imagePath.startsWith('/images/')) return `/api${imagePath}`;
  return imagePath;
};

// Generate and download .ics file
export const downloadICS = (title, description, location, startDate, durationMinutes) => {
  const start = new Date(startDate);
  const end = new Date(start.getTime() + durationMinutes * 60000);

  const formatDate = (date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, '');
  };

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MotoBikes//Booking//EN',
    'BEGIN:VEVENT',
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', 'booking.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 🔒 Check if User is Admin
export const isAdmin = (user) => {
  return user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
};

// 🔒 Check if User is Staff (Includes any branch-level or system-level employee)
export const isStaff = (user) => {
  const staffRoles = ['STAFF', 'SALES_STAFF', 'SERVICE_ADVISOR', 'BRANCH_MANAGER', 'ADMIN', 'SUPER_ADMIN'];
  return staffRoles.includes(user?.role);
};

// 🔒 Check if User is Branch Manager
export const isBranchManager = (user) => {
  return user?.role === 'BRANCH_MANAGER';
};

// 🔒 Check if User is Customer
export const isCustomer = (user) => {
  return user?.role === 'CUSTOMER';
};

export const calculateFinancing = (principal, downPayment, months, annualRate) => {
  const loanAmount = principal - downPayment;
  if (loanAmount <= 0) return 0;
  if (annualRate === 0) return loanAmount / months;

  const monthlyRate = annualRate / 100 / 12;
  const numerator = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months);
  const denominator = Math.pow(1 + monthlyRate, months) - 1;
  return numerator / denominator;
};
