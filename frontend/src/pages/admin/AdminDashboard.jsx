import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Bike, Package, DollarSign, TrendingUp, Calendar, Star } from 'lucide-react';
import  adminService  from '../../services/admin.service';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { getAllowedNextOrderStatuses } from '../../utils/orderStatusWorkflow';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const navigate = useNavigate();

  

  const loadDashboard = useCallback(async () => {
    try {
      const data = await adminService.getDashboardStats();
      setStats(data);
      if (data?.revenueData) {
        setChartData(data.revenueData);
      }
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load dashboard';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentOrders = useCallback(async () => {
    try {
      const orders = await adminService.getRecentOrders(50);
      setRecentOrders(orders || []);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load recent orders';
      toast.error(msg);
    }
  }, []);

  const loadLowStock = useCallback(async () => {
    try {
      const data = await adminService.getLowStockMotorcycles();
      setLowStock(data || []);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load low stock';
      toast.error(msg);
    }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const data = await adminService.getAllOrdersAdmin(0, 5, 'PENDING', null);
      setPendingOrders(data?.content || []);
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load pending orders';
      toast.error(msg);
    }
  }, []);
  
  useEffect(() => {
    loadDashboard();
    loadRecentOrders();
    loadLowStock();
    loadPending();
  }, [loadDashboard, loadRecentOrders, loadLowStock, loadPending]);

  const handleUpdateOrderStatus = async (orderId, status) => {
    if (!status) return;
    try {
      await adminService.updateOrderStatus(orderId, status);
      toast.success('Order status updated');
      loadPending();
      loadRecentOrders();
      loadDashboard();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to update order';
      toast.error(msg);
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="text-center">Loading dashboard...</div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500'
    },
    {
      title: 'Total Motorcycles',
      value: stats?.totalMotorcycles || 0,
      icon: Bike,
      color: 'bg-green-500'
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders || 0,
      icon: Package,
      color: 'bg-purple-500'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.totalRevenue || 0),
      icon: DollarSign,
      color: 'bg-red-500'
    },
    {
      title: 'Pending Orders',
      value: stats?.pendingOrders || 0,
      icon: TrendingUp,
      color: 'bg-yellow-500'
    },
    {
      title: 'Active Test Rides',
      value: stats?.activeTestRides || 0,
      icon: Calendar,
      color: 'bg-indigo-500'
    },
    {
      title: 'Scheduled Services',
      value: stats?.scheduledServices || 0,
      icon: Star,
      color: 'bg-pink-500'
    }
  ];

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`${stat.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.title}</h3>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Revenue Trends (Last 6 Months)</h3>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Bar dataKey="revenue" fill="#ef4444" name="Revenue" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <button onClick={() => navigate('/admin/motorcycles')} className="btn btn-outline w-full text-left">Add New Motorcycle</button>
            <button onClick={() => navigate('/admin/orders')} className="btn btn-outline w-full text-left">View Orders</button>
            <button onClick={() => navigate('/admin/bookings')} className="btn btn-outline w-full text-left">Manage Bookings</button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">Recent Orders</h3>
          <div className="space-y-3 text-sm">
            {recentOrders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">#{order.orderNumber}</span>
                <span className="text-gray-500">{new Date(order.createAt).toLocaleDateString()}</span>
                <span className="font-semibold">{formatCurrency(order.totalAmount || 0)}</span>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="text-gray-600">No recent orders</div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="font-bold text-lg mb-4">Low Stock Motorcycles</h3>
          <div className="space-y-3 text-sm">
            {lowStock.slice(0, 5).map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <span className="text-gray-700 font-medium">{m.brand} {m.model}</span>
                <span className="text-gray-500">Stock: {m.stock ?? 0}</span>
              </div>
            ))}
            {lowStock.length === 0 && (
              <div className="text-gray-600">Inventory looks good</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="font-bold text-lg mb-4">Pending Orders</h3>
        <div className="space-y-3 text-sm">
          {pendingOrders.map((order) => (
            <div key={order.id} className="flex items-center justify-between gap-3">
              <span className="text-gray-700 font-medium">#{order.orderNumber}</span>
              <span className="text-gray-500">{new Date(order.createAt).toLocaleDateString()}</span>
              <span className="font-semibold">{formatCurrency(order.totalAmount || 0)}</span>
              {getAllowedNextOrderStatuses(order.status).length > 0 && (
                <select
                  defaultValue=""
                  onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                  className="text-xs rounded-lg px-2 py-1 bg-gray-100 text-gray-700"
                >
                  <option value="" disabled>Update to…</option>
                  {getAllowedNextOrderStatuses(order.status).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>
          ))}
          {pendingOrders.length === 0 && (
            <div className="text-gray-600">No pending orders</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
