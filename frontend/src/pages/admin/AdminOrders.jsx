import { useState, useEffect, useCallback } from 'react';
import { Package, Search, Filter } from 'lucide-react';
import adminService from '../../services/admin.service';
import { formatCurrency, formatDateTime, getOrderStatusColor } from '../../utils/helpers';
import toast from 'react-hot-toast';
import html2pdf from 'html2pdf.js';
import { getAllowedNextOrderStatuses } from '../../utils/orderStatusWorkflow';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const loadOrders = useCallback(async () => {
    try {
      const statusParam = statusFilter !== 'ALL' ? statusFilter : null;
      const data = await adminService.getAllOrdersAdmin(currentPage, 10, statusParam, searchTerm || null);
      setOrders(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalItems(data?.totalElements || 0);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, searchTerm]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      if (!newStatus) return;
      await adminService.updateOrderStatus(orderId, newStatus);
      toast.success('Order status updated');
      loadOrders();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to update orders');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update order status');
      }
    }
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) {
      toast.error('No orders to export');
      return;
    }

    // Define CSV headers
    const headers = [
      'Order Number',
      'Date',
      'Customer Name',
      'Customer Email',
      'Phone',
      'Shipping Address',
      'Total Amount',
      'Payment Method',
      'Status'
    ];

    // Map order data to rows
    const csvRows = orders.map(order => [
      order.orderNumber,
      formatDateTime(order.createAt).replace(/,/g, ''),
      `${order.user?.firstname || ''} ${order.user?.lastname || ''}`,
      order.user?.email || '',
      order.user?.phone || '',
      `"${(order.shippingAddress || '').replace(/"/g, '""')}"`, // escape quotes and wrap in quotes for address
      order.totalAmount,
      order.paymentMethod || 'COD',
      order.status
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    downloadLink.setAttribute('href', url);
    downloadLink.setAttribute('download', `Orders_Export_${new Date().getTime()}.csv`);
    downloadLink.style.visibility = 'hidden';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    
    toast.success('Orders exported successfully');
  };

  const generatePDF = (order) => {
    const element = document.createElement('div');
    element.innerHTML = `
      <div style="padding: 40px; font-family: Arial, sans-serif; color: #333;">
        <div style="text-align: center; margin-bottom: 40px;">
          <h1 style="color: #dc2626; margin: 0; font-size: 32px;">MBServices</h1>
          <p style="margin: 5px 0; color: #666;">Official Motorcycle Dealership</p>
        </div>
        
        <div style="border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px;">
          <h2 style="font-size: 24px; margin: 0 0 15px 0;">INVOICE</h2>
          <div style="display: flex; justify-content: space-between;">
            <div>
              <p style="margin: 5px 0;"><strong>Order #:</strong> ${order.orderNumber}</p>
              <p style="margin: 5px 0;"><strong>Date:</strong> ${formatDateTime(order.createAt)}</p>
              <p style="margin: 5px 0;"><strong>Status:</strong> ${order.status}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
            </div>
          </div>
        </div>

        <div style="margin-bottom: 30px;">
          <h3 style="font-size: 18px; margin-bottom: 15px; color: #444;">Customer Information</h3>
          <p style="margin: 5px 0;"><strong>Name:</strong> ${order.user?.firstname} ${order.user?.lastname}</p>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${order.user?.email}</p>
          <p style="margin: 5px 0;"><strong>Phone:</strong> ${order.user?.phone || 'N/A'}</p>
          <p style="margin: 5px 0;"><strong>Shipping Address:</strong> ${order.shippingAddress || 'N/A'}</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 12px; text-align: left; border-bottom: 2px solid #dee2e6;">Item</th>
              <th style="padding: 12px; text-align: center; border-bottom: 2px solid #dee2e6;">Qty</th>
              <th style="padding: 12px; text-align: right; border-bottom: 2px solid #dee2e6;">Price</th>
            </tr>
          </thead>
          <tbody>
            ${order.motorcycles?.map(moto => `
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">
                  <strong>${moto.brand} ${moto.model}</strong>
                </td>
                <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">1</td>
                <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${formatCurrency(moto.price)}</td>
              </tr>
            `).join('') || ''}
          </tbody>
        </table>

        <div style="display: flex; justify-content: flex-end;">
          <div style="width: 300px;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 20px; font-weight: bold; border-top: 2px solid #333;">
              <span>Total Amount:</span>
              <span style="color: #dc2626;">${formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 14px;">
          <p>Thank you for choosing MBServices!</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `;

    const opt = {
      margin: 0,
      filename: `Invoice_MBServices_${order.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  };

  const filteredOrders = orders;

  if (loading) {
    return <div className="py-8 text-center">Loading orders...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Orders</h1>
          <p className="text-gray-600">{totalItems} total orders</p>
        </div>
        <button 
          onClick={exportToCSV}
          className="btn btn-outline flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          Export to CSV
        </button>
      </div>

      {/* Filters */}
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

      {/* Orders Table */}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
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
                    <div className="text-sm font-semibold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </div>
                    {order.isDeposit && (
                      <div className="text-xs mt-1">
                        <span className="text-green-600 block">Dep: {formatCurrency(order.depositAmount)}</span>
                        <span className="text-orange-600 block">Rem: {formatCurrency(order.remainingAmount)}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={order.status}
                      onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                      className={`text-xs font-semibold rounded-full px-3 py-1 ${getOrderStatusColor(order.status)}`}
                    >
                      <option value={order.status}>{order.status}</option>
                      {getAllowedNextOrderStatuses(order.status).map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => generatePDF(order)}
                      className="text-blue-600 hover:text-blue-900 font-medium"
                    >
                      Export PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, totalItems)} of {totalItems}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === i
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="btn btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
