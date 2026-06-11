import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Package, Truck, CheckCircle, Clock, XCircle, Eye, MapPin, Phone, User } from 'lucide-react';
import { orderService } from '../../services/order.service';
import useAuthStore from '../../store/authStore';
import { formatCurrency, formatDateTime, getOrderStatusColor, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MyOrders = () => {
  const { user } = useAuthStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const handleImageError = (e) => {
    e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
    e.target.onerror = null;
  };

  const loadOrders = useCallback(async () => {
    try {
      const data = await orderService.getUserOrders(user.id);
      setOrders(data);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      case 'PAID':
      case 'PROCESSING':
        return <Package className="w-5 h-5" />;
      case 'SHIPPED':
        return <Truck className="w-5 h-5" />;
      case 'DELIVERED':
        return <CheckCircle className="w-5 h-5" />;
      case 'CANCELLED':
      case 'REFUNDED':
        return <XCircle className="w-5 h-5" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center py-12">Loading orders...</div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <h1 className="text-3xl font-bold mb-8">My Orders</h1>
          <div className="card p-12 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-4">No orders yet</h2>
            <p className="text-gray-600 mb-8">Start shopping to see your orders here</p>
            <Link to="/motorcycles" className="btn btn-primary">Browse Motorcycles</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">My Orders</h1>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="card p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">Order #{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600">{formatDateTime(order.createAt)}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold inline-flex items-center gap-2 ${getOrderStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  {order.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-red-600">{formatCurrency(order.totalAmount)}</p>
                  {order.isDeposit && (
                    <div className="text-sm mt-1">
                      <span className="text-green-600 font-medium">Deposit Paid: {formatCurrency(order.depositAmount)}</span>
                      <span className="mx-2">|</span>
                      <span className="text-orange-600 font-medium">Remaining: {formatCurrency(order.remainingAmount)}</span>
                    </div>
                  )}
                </div>
                <button onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)} className="btn btn-outline">
                  {selectedOrder?.id === order.id ? 'Hide' : 'View'} Details
                </button>
              </div>
              {selectedOrder?.id === order.id && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-semibold mb-4">Order Items</h4>
                  {(order.orderItems || order.motorcycles || [])?.map((item) => {
                    const isOrderItem = !!item.itemType;
                    const name = isOrderItem 
                      ? (item.itemType === 'MOTORCYCLE' ? `${item.itemBrand || ''} ${item.itemModel || item.itemName || ''}`.trim() : item.itemName)
                      : `${item.brand} ${item.model}`;
                    const imgUrl = isOrderItem ? item.itemImageUrl : item.images?.[0];
                    const price = isOrderItem ? item.unitPrice : item.price;
                    const qty = isOrderItem ? item.quantity : 1;
                    return (
                      <div key={item.id} className="flex gap-4 mb-4">
                        <img
                          src={getImageUrl(imgUrl)}
                          alt={name}
                          className="w-20 h-20 object-cover rounded"
                          onError={handleImageError}
                        />
                        <div>
                          <h5 className="font-semibold">{name}</h5>
                          <p className="text-sm text-gray-600">
                            {formatCurrency(price)} {qty > 1 ? `x ${qty}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-6">
                    <h4 className="font-semibold mb-4">Shipping Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                        <MapPin className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Address</p>
                          <p className="font-medium text-gray-900">{order.shippingAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                        <User className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Recipient</p>
                          <p className="font-medium text-gray-900">{user?.firstname} {user?.lastname}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 bg-gray-50 p-4 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-500 mt-0.5" />
                        <div>
                          <p className="text-sm text-gray-500">Phone</p>
                          <p className="font-medium text-gray-900">{user?.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyOrders;
