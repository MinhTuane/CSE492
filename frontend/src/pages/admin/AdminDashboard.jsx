import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Bike, Package, DollarSign, TrendingUp, Calendar,
  Star, AlertTriangle, ArrowUpRight, ArrowDownRight, Activity,
  ShoppingCart, Clock, ChevronRight, RefreshCw, Wrench
} from 'lucide-react';
import adminService from '../../services/admin.service';
import { formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, ComposedChart, Line
} from 'recharts';
import { getAllowedNextOrderStatuses } from '../../utils/orderStatusWorkflow';

const STATUS_STYLES = {
  PENDING:   'bg-amber-100 text-amber-700 border border-amber-200',
  PAID:      'bg-blue-100 text-blue-700 border border-blue-200',
  PROCESSING:'bg-purple-100 text-purple-700 border border-purple-200',
  SHIPPED:   'bg-indigo-100 text-indigo-700 border border-indigo-200',
  DELIVERED: 'bg-green-100 text-green-700 border border-green-200',
  CANCELLED: 'bg-red-100 text-red-700 border border-red-200',
};

const KpiCard = ({ title, value, icon, gradient, change, changeLabel, onClick }) => {
  const CardIcon = icon;
  return (
    <div
      onClick={onClick}
      className={`relative overflow-hidden rounded-2xl p-6 text-white cursor-pointer group transition-transform hover:-translate-y-1 hover:shadow-xl ${gradient}`}
    >
      <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full bg-white/10 group-hover:scale-110 transition-transform" />
      <div className="absolute -right-2 -bottom-6 w-32 h-32 rounded-full bg-white/5" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center">
            <CardIcon className="w-5 h-5" />
          </div>
          {change !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
              change >= 0 ? 'bg-green-400/20 text-green-100' : 'bg-red-400/20 text-red-100'
            }`}>
              {change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <p className="text-white/70 text-sm font-medium mb-1">{title}</p>
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {changeLabel && <p className="text-white/60 text-xs mt-1">{changeLabel}</p>}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 text-white rounded-xl px-4 py-3 shadow-xl text-sm">
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: {p.name === 'Revenue' ? formatCurrency(p.value) : p.value}</p>
        ))}
      </div>
    );
  }
  return null;
};

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentOrders, setRecentOrders] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [stores, setStores] = useState([]);
  const [selectedStoreId, setSelectedStoreId] = useState('all');
  const navigate = useNavigate();

  const loadDashboard = useCallback(async (storeId = 'all') => {
    try {
      setLoading(true);
      const data = await adminService.getDashboardStats(storeId);
      setStats(data);
      if (data?.revenueData) setChartData(data.revenueData);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, []);

  const loadRecentOrders = useCallback(async () => {
    try {
      const orders = await adminService.getRecentOrders(50);
      setRecentOrders(orders || []);
    } catch { /* silent */ }
  }, []);

  const loadLowStock = useCallback(async () => {
    try {
      const data = await adminService.getLowStockMotorcycles();
      setLowStock(data || []);
    } catch { /* silent */ }
  }, []);

  const loadPending = useCallback(async () => {
    try {
      const data = await adminService.getAllOrdersAdmin(0, 8, 'PENDING', null);
      setPendingOrders(data?.content || []);
    } catch { /* silent */ }
  }, []);

  const loadStores = useCallback(async () => {
    try {
      const data = await adminService.getAllStores();
      setStores(data || []);
    } catch (error) {
      console.error('Failed to load stores for dropdown', error);
    }
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadDashboard(selectedStoreId), loadRecentOrders(), loadLowStock(), loadPending()]);
    setRefreshing(false);
    toast.success('Dashboard refreshed');
  };

  useEffect(() => {
    loadDashboard(selectedStoreId);
    loadRecentOrders();
    loadLowStock();
    loadPending();
  }, [loadDashboard, loadRecentOrders, loadLowStock, loadPending, selectedStoreId]);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const handleUpdateOrderStatus = async (orderId, status) => {
    if (!status) return;
    try {
      await adminService.updateOrderStatus(orderId, status);
      toast.success('Order status updated');
      loadPending(); loadRecentOrders(); loadDashboard(selectedStoreId);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to update order');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 font-medium">Loading dashboard…</p>
        </div>
      </div>
    );
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

  const kpiCards = [
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, gradient: 'bg-gradient-to-br from-red-500 to-rose-700', change: 12, changeLabel: 'vs last month', onClick: () => navigate('/admin/orders') },
    { title: 'Total Orders', value: (stats?.totalOrders || 0).toLocaleString(), icon: ShoppingCart, gradient: 'bg-gradient-to-br from-violet-500 to-purple-700', change: 8, changeLabel: 'vs last month', onClick: () => navigate('/admin/orders') },
    { title: 'Active Users', value: (stats?.totalUsers || 0).toLocaleString(), icon: Users, gradient: 'bg-gradient-to-br from-blue-500 to-cyan-600', change: 5, changeLabel: 'new this month', onClick: () => navigate('/admin/users') },
    { title: 'Motorcycles', value: (stats?.totalMotorcycles || 0).toLocaleString(), icon: Bike, gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600', onClick: () => navigate('/admin/motorcycles') },
    { title: 'Pending Orders', value: (stats?.pendingOrders || 0).toLocaleString(), icon: Clock, gradient: 'bg-gradient-to-br from-amber-500 to-orange-600', onClick: () => navigate('/admin/orders') },
    { title: 'Active Test Rides', value: (stats?.activeTestRides || 0).toLocaleString(), icon: Calendar, gradient: 'bg-gradient-to-br from-sky-500 to-indigo-600', onClick: () => navigate('/admin/bookings') },
    { title: 'Scheduled Services', value: (stats?.scheduledServices || 0).toLocaleString(), icon: Wrench, gradient: 'bg-gradient-to-br from-pink-500 to-fuchsia-600', onClick: () => navigate('/admin/bookings') },
    { title: 'Avg. Rating', value: `${(stats?.averageRating || 0).toFixed(1)} ★`, icon: Star, gradient: 'bg-gradient-to-br from-yellow-500 to-amber-600', onClick: () => navigate('/admin/reviews') },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 px-8 py-8">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">{greeting} 👋</p>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">{now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="appearance-none bg-white/10 hover:bg-white/20 text-white pl-4 pr-10 py-2 rounded-xl text-sm font-medium transition-colors cursor-pointer outline-none border border-white/15 focus:border-red-500 focus:ring-1 focus:ring-red-500"
              >
                <option value="all" className="bg-slate-900 text-white">All Branches</option>
                {stores.map((store) => (
                  <option key={store.id} value={store.id} className="bg-slate-900 text-white">
                    {store.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-white">
                <svg className="w-4 h-4 fill-current opacity-70" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-white/15"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-8 -mt-4 pb-10 space-y-8">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {kpiCards.map((card, i) => <KpiCard key={i} {...card} />)}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Revenue Area Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-gray-900 text-lg">Revenue & Orders</h3>
                <p className="text-gray-400 text-sm">Last 6 months performance</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-semibold">
                <TrendingUp className="w-3.5 h-3.5" />
                +12% vs prev period
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={80} tickFormatter={v => formatCurrency(v).replace('₫', '')} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#ef4444" strokeWidth={2.5} fill="url(#revenueGrad)" />
                  <Bar dataKey="orders" name="Orders" fill="#818cf8" radius={[4, 4, 0, 0]} barSize={20} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Low Stock Alert</h3>
                <p className="text-gray-400 text-xs">{lowStock.length} item{lowStock.length !== 1 ? 's' : ''} need restocking</p>
              </div>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto">
              {lowStock.length === 0 ? (
                <div className="text-center py-6">
                  <Activity className="w-10 h-10 text-green-300 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">All inventory levels are healthy</p>
                </div>
              ) : (
                lowStock.slice(0, 6).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center flex-shrink-0">
                      <Bike className="w-4 h-4 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{m.brand} {m.model}</p>
                      <p className="text-xs text-gray-400">{m.category}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-lg ${
                      (m.stock ?? 0) === 0 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {m.stock ?? 0} left
                    </span>
                  </div>
                ))
              )}
            </div>
            {lowStock.length > 0 && (
              <button onClick={() => navigate('/admin/motorcycles')} className="mt-4 w-full text-center text-sm text-red-600 font-semibold hover:text-red-700 flex items-center justify-center gap-1">
                Manage inventory <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Pending Orders Table */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900">Pending Orders</h3>
                <p className="text-gray-400 text-xs mt-0.5">{pendingOrders.length} awaiting action</p>
              </div>
              <button onClick={() => navigate('/admin/orders')} className="text-sm text-red-600 font-semibold hover:text-red-700 flex items-center gap-1">
                View all <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-50">
              {pendingOrders.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-sm">No pending orders — you're all caught up! 🎉</div>
              ) : (
                pendingOrders.map((order) => (
                  <div key={order.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      <Package className="w-4 h-4 text-violet-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{new Date(order.createAt).toLocaleDateString('en-US')}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900 hidden sm:block">{formatCurrency(order.totalAmount || 0)}</p>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-600'}`}>
                      {order.status}
                    </span>
                    {getAllowedNextOrderStatuses(order.status).length > 0 && (
                      <select
                        defaultValue=""
                        onChange={(e) => handleUpdateOrderStatus(order.id, e.target.value)}
                        className="text-xs rounded-lg px-2 py-1.5 bg-gray-100 text-gray-700 border-0 focus:ring-2 focus:ring-red-300 outline-none cursor-pointer"
                      >
                        <option value="" disabled>Move to…</option>
                        {getAllowedNextOrderStatuses(order.status).map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity + Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Add Motorcycle', icon: Bike, color: 'text-emerald-600 bg-emerald-50', path: '/admin/motorcycles' },
                  { label: 'View Orders', icon: Package, color: 'text-violet-600 bg-violet-50', path: '/admin/orders' },
                  { label: 'Bookings', icon: Calendar, color: 'text-sky-600 bg-sky-50', path: '/admin/bookings' },
                  { label: 'Manage Users', icon: Users, color: 'text-rose-600 bg-rose-50', path: '/admin/users' },
                  { label: 'Services', icon: Wrench, color: 'text-amber-600 bg-amber-50', path: '/admin/services' },
                  { label: 'Forum', icon: Activity, color: 'text-indigo-600 bg-indigo-50', path: '/admin/forum' },
                ].map(({ label, icon, color, path }) => {
                  const ActionIcon = icon;
                  return (
                    <button
                      key={label}
                      onClick={() => navigate(path)}
                      className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                    >
                      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <ActionIcon className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-semibold text-gray-600 text-center">{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Orders Feed */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Recent Activity</h3>
                <button onClick={() => navigate('/admin/orders')} className="text-xs text-red-600 font-semibold">View all</button>
              </div>
              <div className="space-y-3">
                {recentOrders.slice(0, 5).map((order) => (
                  <div key={order.id} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      order.status === 'PAID' ? 'bg-blue-500' :
                      order.status === 'DELIVERED' ? 'bg-green-500' :
                      order.status === 'CANCELLED' ? 'bg-red-500' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">#{order.orderNumber}</p>
                      <p className="text-xs text-gray-400">{formatCurrency(order.totalAmount || 0)}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{new Date(order.createAt).toLocaleDateString('en-US')}</span>
                  </div>
                ))}
                {recentOrders.length === 0 && <p className="text-sm text-gray-400 text-center py-3">No recent orders</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
