import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';

// Layouts
import MainLayout from './components/common/MainLayout';
import AdminLayout from './components/common/AdminLayout';

// Public Pages
const Home = React.lazy(() => import('./pages/Home'));
const MotorcycleList = React.lazy(() => import('./pages/motorcycles/MotorcycleList'));
const MotorcycleDetail = React.lazy(() => import('./pages/motorcycles/MotorcycleDetail'));
const MotorcycleCompare = React.lazy(() => import('./pages/motorcycles/MotorcycleCompare'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const About = React.lazy(() => import('./pages/About'));
const Contact = React.lazy(() => import('./pages/Contact'));
const Services = React.lazy(() => import('./pages/Services'));
const AccessoryList = React.lazy(() => import('./pages/accessories/AccessoryList'));
const Forum = React.lazy(() => import('./pages/Forum'));
const ForumPost = React.lazy(() => import('./pages/ForumPost'));

// User Pages
const Profile = React.lazy(() => import('./pages/user/Profile'));
const MyOrders = React.lazy(() => import('./pages/user/MyOrders'));
const MyBookings = React.lazy(() => import('./pages/user/MyBookings'));
const Cart = React.lazy(() => import('./pages/Cart'));
const Wishlist = React.lazy(() => import('./pages/Wishlist'));
const Checkout = React.lazy(() => import('./pages/Checkout'));
const PaymentResult = React.lazy(() => import('./pages/PaymentResult'));
import ChatbotWidget from './components/common/ChatbotWidget';
import ScrollToTop from './components/common/ScrollToTop';
import SosButton from './components/common/SosButton';

// Admin Pages
const AdminDashboard = React.lazy(() => import('./pages/admin/AdminDashboard'));
const AdminMotorcycles = React.lazy(() => import('./pages/admin/AdminMotorcycles'));
const AdminOrders = React.lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = React.lazy(() => import('./pages/admin/AdminUsers'));
const AdminReviews = React.lazy(() => import('./pages/admin/AdminReviews'));
const AdminBookings = React.lazy(() => import('./pages/admin/AdminBookings'));
const AdminForum = React.lazy(() => import('./pages/admin/AdminForum'));
const AdminServices = React.lazy(() => import('./pages/admin/AdminServices'));
const AdminInventory = React.lazy(() => import('./pages/admin/AdminInventory'));
const AdminDiscountCodes = React.lazy(() => import('./pages/admin/AdminDiscountCodes'));
const AdminAccessories = React.lazy(() => import('./pages/admin/AdminAccessories'));
const StaffOrders = React.lazy(() => import('./pages/staff/StaffOrders'));

/** Roles allowed to call /api/admin/** (see SecurityConfig) */
const ADMIN_PANEL_ROLES = ['ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'SALES_STAFF', 'SERVICE_ADVISOR'];

/** Roles allowed for /api/staff/** style staff tools */
const STAFF_PANEL_ROLES = ['STAFF', 'ADMIN', 'SUPER_ADMIN', 'BRANCH_MANAGER', 'SALES_STAFF', 'SERVICE_ADVISOR'];

// Protected Route Component
const ProtectedRoute = ({ children, requireAdmin = false, requireStaff = false }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requireAdmin && !ADMIN_PANEL_ROLES.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  if (requireStaff && !STAFF_PANEL_ROLES.includes(user?.role)) {
    return <Navigate to="/" />;
  }

  return children;
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
          <div className="card p-8 text-center max-w-2xl w-full">
            <h2 className="text-2xl font-bold mb-2 text-red-600">Something went wrong</h2>
            <p className="text-gray-600 mb-4">Please try reloading the page.</p>
            {this.state.error && (
              <div className="bg-gray-100 p-4 rounded text-left overflow-auto text-sm text-red-800 mb-6 font-mono">
                {this.state.error.toString()}
              </div>
            )}
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Reload Page</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <Toaster position="top-right" />
        <React.Suspense fallback={
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        }>
          <Routes>
          {/* Public Routes with Main Layout */}
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/motorcycles" element={<MotorcycleList />} />
          <Route path="/motorcycles/:id" element={<MotorcycleDetail />} />
          <Route path="/motorcycles/compare" element={<MotorcycleCompare />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/accessories" element={<AccessoryList />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/:id" element={<ForumPost />} />
          
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Protected User Routes */}
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookings />
              </ProtectedRoute>
            }
          />
          <Route path="/cart" element={<Cart />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route
            path="/checkout"
            element={
              <ProtectedRoute>
                <Checkout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/checkout/payment-result"
            element={
              <ProtectedRoute>
                <PaymentResult />
              </ProtectedRoute>
            }
          />
          <Route
            path="/staff/orders"
            element={
              <ProtectedRoute requireStaff>
                <StaffOrders />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Admin Routes with Admin Layout */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requireAdmin>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="motorcycles" element={<AdminMotorcycles />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="inventory" element={<AdminInventory />} />
          <Route path="reviews" element={<AdminReviews />} />
          <Route path="bookings" element={<AdminBookings />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="discounts" element={<AdminDiscountCodes />} />
          <Route path="forum" element={<AdminForum />} />
          <Route path="accessories" element={<AdminAccessories />} />
        </Route>

        {/* 404 Not Found */}
        <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </React.Suspense>
        <ChatbotWidget />
        <ScrollToTop />
        <SosButton />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
