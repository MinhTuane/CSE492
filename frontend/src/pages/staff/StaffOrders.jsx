import { useState, useEffect, useCallback } from 'react';
import { Search } from 'lucide-react';
import { orderService } from '../../services/order.service';
import { formatCurrency, formatDateTime, getOrderStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { getAllowedNextOrderStatuses } from '../../utils/orderStatusWorkflow';

const StaffOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter !== 'ALL' ? statusFilter : null;
      const data = await orderService.getAll(currentPage, 10, statusParam, searchTerm || null);
      setOrders(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalElements(data?.totalElements || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchTerm, currentPage]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (!newStatus) return;
      await orderService.updateStatus(orderId, newStatus);
      toast.success('Order status updated');
      loadOrders();
    } catch {
      toast.error('Failed to update order status');
    }
  };

  

  if (loading) {
    return <div className="py-8 text-center">Loading orders...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Staff Orders</h1>
          <p className="text-gray-600">{totalElements} total orders</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by order number or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(0);
              }}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(0);
            }}
            className="input"
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="PAID">Paid</option>
            <option value="PROCESSING">Processing</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.orderNumber}</div>
                    <div className="text-sm text-gray-500">{order.motorcycles?.length || 0} items</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {order.user?.firstname} {order.user?.lastname}
                    </div>
                    <div className="text-sm text-gray-500">{order.user?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(order.createAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold rounded-full px-2 py-1 ${getOrderStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                      {getAllowedNextOrderStatuses(order.status).length > 0 && (
                        <select
                          defaultValue=""
                          onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                          className="text-xs rounded-lg px-2 py-1 bg-gray-100 text-gray-700"
                        >
                          <option value="" disabled>
                            Update to…
                          </option>
                          {getAllowedNextOrderStatuses(order.status).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      )}
                      
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center mt-6 gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages - 1, prev + 1))}
            disabled={currentPage === totalPages - 1}
            className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StaffOrders;
