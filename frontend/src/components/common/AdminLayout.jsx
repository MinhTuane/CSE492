import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Bike, Package, Users, Star, 
  Calendar, LogOut, Menu, X, MessageSquare, Wrench, Tag,
  ShoppingBag
} from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../store/authStore';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigation = [
    { name: 'Dashboard', path: '/admin', icon: LayoutDashboard, roles: ['ADMIN'] },
    { name: 'Motorcycles', path: '/admin/motorcycles', icon: Bike, roles: ['ADMIN'] },
    { name: 'Accessories', path: '/admin/accessories', icon: ShoppingBag, roles: ['ADMIN'] },
    { name: 'Inventory', path: '/admin/inventory', icon: Package, roles: ['ADMIN', 'STAFF_CS', 'STAFF_SERVICE'] },
    { name: 'Orders', path: '/admin/orders', icon: Package, roles: ['ADMIN', 'STAFF_CS', 'STAFF_SERVICE'] },
    { name: 'Users', path: '/admin/users', icon: Users, roles: ['ADMIN'] },
    { name: 'Reviews', path: '/admin/reviews', icon: Star, roles: ['ADMIN'] },
    { name: 'Bookings', path: '/admin/bookings', icon: Calendar, roles: ['ADMIN', 'STAFF_SERVICE', 'STAFF_CS'] },
    { name: 'Services', path: '/admin/services', icon: Wrench, roles: ['ADMIN', 'STAFF_SERVICE'] },
    { name: 'Discounts', path: '/admin/discounts', icon: Tag, roles: ['ADMIN'] },
    { name: 'Forum', path: '/admin/forum', icon: MessageSquare, roles: ['ADMIN'] },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0 lg:translate-x-0' : '-translate-x-full lg:-translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">MB</span>
              </div>
              <span className="text-white font-bold text-xl">Admin</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1">
            {navigation
              .filter((item) => item.roles.includes(user?.role))
              .map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="p-4 border-t border-gray-800">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">
                  {user?.firstname?.[0]}{user?.lastname?.[0]}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.firstname} {user?.lastname}
                </p>
                <p className="text-xs text-gray-400 truncate">{user?.role}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 w-full px-4 py-2 text-gray-400 hover:bg-gray-800 hover:text-white rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-sm">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <Link to="/" className="text-sm text-gray-600 hover:text-red-600">
              ← Back to Website
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default AdminLayout;
