 import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { 
  Menu, X, ShoppingCart, User, LogOut, Package, 
  Calendar, LayoutDashboard, Search, Heart, Bell
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import { getInitials } from '../../utils/helpers';
import { connectWebSocket, disconnectWebSocket } from '../../services/websocket.service';
import { notificationService } from '../../services/notification.service';
import toast from 'react-hot-toast';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const { user, isAuthenticated, logout } = useAuthStore();
  const { items } = useCartStore();
  const { items: wishlistItems } = useWishlistStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    disconnectWebSocket();
    navigate('/');
    setIsProfileOpen(false);
    setIsNotifOpen(false);
  };

  useEffect(() => {
    if (isAuthenticated && user) {
      // Load initial notifications
      const loadNotifications = async () => {
        try {
          if (user.role === 'ADMIN') {
            const [notifs, count] = await Promise.all([
              notificationService.getAdminNotifications(),
              notificationService.getAdminUnreadCount()
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
          } else {
            const [notifs, count] = await Promise.all([
              notificationService.getUserNotifications(user.id),
              notificationService.getUserUnreadCount(user.id)
            ]);
            setNotifications(notifs);
            setUnreadCount(count);
          }
        } catch (error) {
          console.error('Failed to load notifications', error);
        }
      };

      loadNotifications();

      // Connect WebSocket
      connectWebSocket((message) => {
        setNotifications(prev => [message, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast(message.title, {
          icon: '🔔',
          duration: 4000,
        });
      });

      return () => disconnectWebSocket();
    }
  }, [isAuthenticated, user]);

  const handleMarkAllRead = async () => {
    try {
      if (user.role === 'ADMIN') {
        await notificationService.markAllAdminAsRead();
      } else {
        await notificationService.markAllUserAsRead(user.id);
      }
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (error) {
      console.error('Failed to mark notifications as read', error);
    }
  };

  const handleNotifClick = async (notif) => {
    if (!notif.read) {
      try {
        await notificationService.markAsRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      } catch (error) {
        console.error('Failed to mark notification as read', error);
      }
    }
    
    setIsNotifOpen(false);
    if (notif.type === 'ORDER') {
      navigate(user.role === 'ADMIN' ? '/admin/orders' : '/my-orders');
    } else if (notif.type === 'TEST_RIDE') {
      navigate(user.role === 'ADMIN' ? '/admin/bookings' : '/my-bookings');
    }
  };

  const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Motorcycles', path: '/motorcycles' },
    { name: 'Services', path: '/services' },
    { name: 'Accessories', path: '/accessories' },
    { name: 'Forum', path: '/forum' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <header className="bg-white/90 backdrop-blur-md shadow-sm sticky top-0 z-50 transition-all duration-300">
      <nav className="container-custom py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <span className="text-2xl font-bold text-gray-900 hidden sm:block">
              Motomarket
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`font-medium transition-colors ${isActive(item.path) ? 'text-red-600' : 'text-gray-700 hover:text-red-600'}`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <button 
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => navigate('/motorcycles')}
              title="Search Motorcycles"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>

            {/* Wishlist */}
            <Link
              to="/wishlist"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors hidden sm:block"
              title="My Wishlist"
            >
              <Heart className="w-5 h-5 text-gray-600" />
              {wishlistItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistItems.length}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              to="/cart"
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {items.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {items.length}
                </span>
              )}
            </Link>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-2">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotifOpen(!isNotifOpen);
                      setIsProfileOpen(false);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors relative"
                  >
                    <Bell className="w-5 h-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-600 rounded-full border-2 border-white"></span>
                    )}
                  </button>

                  {isNotifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={handleMarkAllRead}
                            className="text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-[300px] overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="px-4 py-6 text-center text-sm text-gray-500">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <button
                              key={notif.id}
                              onClick={() => handleNotifClick(notif)}
                              className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 ${
                                !notif.read ? 'bg-red-50/30' : ''
                              }`}
                            >
                              <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold ${!notif.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                  {notif.title}
                                </span>
                                {!notif.read && (
                                  <span className="w-2 h-2 bg-red-600 rounded-full mt-1.5 shrink-0"></span>
                                )}
                              </div>
                              <p className="text-xs text-gray-500 line-clamp-2 mb-1">{notif.message}</p>
                              <span className="text-[10px] text-gray-400">
                                {notif.createdAt ? new Date(notif.createdAt).toLocaleDateString() : 'Just now'}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative">
                  <button
                    onClick={() => {
                      setIsProfileOpen(!isProfileOpen);
                      setIsNotifOpen(false);
                    }}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">
                      {getInitials(user?.firstname + ' ' + user?.lastname)}
                    </span>
                  </div>
                  <span className="hidden lg:block text-sm font-medium text-gray-700">
                    {user?.firstname}
                  </span>
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl py-2 border border-gray-200">
                    <div className="px-4 py-3 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">
                        {user?.firstname} {user?.lastname}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>

                    <Link
                      to="/profile"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Profile</span>
                    </Link>

                    <Link
                      to="/my-orders"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Package className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Orders</span>
                    </Link>

                    <Link
                      to="/my-bookings"
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">My Bookings</span>
                    </Link>

                    {user?.role === 'ADMIN' && (
                      <>
                        <div className="border-t border-gray-100 my-2"></div>
                        <Link
                          to="/admin"
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">Admin Dashboard</span>
                        </Link>
                      </>
                    )}
                    {(user?.role === 'STAFF' || user?.role === 'ADMIN') && (
                      <>
                        <div className="border-t border-gray-100 my-2"></div>
                        <Link
                          to="/staff/orders"
                          className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <Package className="w-4 h-4 text-gray-600" />
                          <span className="text-sm text-gray-700">Staff Orders</span>
                        </Link>
                      </>
                    )}

                    <div className="border-t border-gray-100 my-2"></div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 px-4 py-2 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4 text-red-600" />
                      <span className="text-sm text-red-600">Logout</span>
                    </button>
                  </div>
                )}
                </div>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col space-y-2">
              {navigation.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg transition-colors ${isActive(item.path) ? 'bg-gray-100 text-red-600' : 'text-gray-700 hover:bg-gray-50'}`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!isAuthenticated && (
                <>
                  <Link
                    to="/login"
                    className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
