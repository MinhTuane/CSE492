import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import useCartStore from '../store/cartStore';
import { formatCurrency, getImageUrl } from '../utils/helpers';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const Cart = () => {
  const navigate = useNavigate();
  const { items, removeItem, clearCart, getTotalAmount, incrementQuantity, decrementQuantity } = useCartStore();
  const { isAuthenticated } = useAuthStore();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to proceed to checkout');
      navigate('/login');
      return;
    }

    if (items.length === 0) {
      toast.error('Your cart is empty');
      return;
    }

    navigate('/checkout');
  };

  const handleRemove = (motorcycleId) => {
    removeItem(motorcycleId);
    toast.success('Removed from cart');
  };

  const subtotal = getTotalAmount();
  const tax = subtotal * 0.1; // 10% tax
  const shipping = items.length > 0 ? 100000 : 0; // Fixed shipping
  const total = subtotal + tax + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 animate-fade-in">
        <div className="container-custom">
          <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 animate-slide-in-up">Shopping Cart</h1>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl border border-white/50 animate-slide-in-up delay-100">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8 animate-float">
              <ShoppingBag className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Your cart is empty</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
              Looks like you haven't added any motorcycles to your cart yet. Start exploring our premium collection!
            </p>
            <Link to="/motorcycles" className="btn btn-primary inline-flex items-center gap-3 text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-xl">
              Browse Motorcycles
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 animate-fade-in">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8 animate-slide-in-up">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">Shopping Cart</h1>
          <button
            onClick={clearCart}
            className="text-red-600 hover:text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item, idx) => (
              <div key={item.id} className={`bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 animate-slide-in-up delay-${(idx % 3) * 100 + 100} group`}>
                <div className="flex gap-6">
                  {/* Image */}
                  <div className="flex-shrink-0">
                    <img
                      src={getImageUrl(item.images?.[0])}
                      alt={item.model}
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="inline-block bg-red-100 text-red-600 px-2 py-1 rounded text-xs font-semibold uppercase mb-2">
                            {item.brand}
                          </span>
                          <h3 className="text-xl font-bold">{item.model}</h3>
                          <p className="text-gray-600 text-sm mt-1">{item.year} Model</p>
                        </div>
                        <button
                          onClick={() => handleRemove(item.id)}
                          className="p-2 hover:bg-red-50 rounded-lg text-red-600 transition-colors"
                          title="Remove from cart"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>

                      {/* Specs */}
                      <div className="flex gap-4 text-sm text-gray-600 mb-4">
                        <span>{item.displacement}cc</span>
                        <span>•</span>
                        <span>{item.power} HP</span>
                        <span>•</span>
                        <span>{item.category}</span>
                      </div>
                    </div>

                    {/* Price and Quantity */}
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex flex-col">
                        {item.discountPercentage > 0 && (
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm text-gray-500 line-through">
                              {formatCurrency(item.originalPrice)}
                            </span>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                              -{item.discountPercentage}%
                            </span>
                          </div>
                        )}
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(item.price)} × {item.quantity || 1}
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {formatCurrency(item.price * (item.quantity || 1))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600">Quantity:</span>
                        <div className="flex items-center gap-2 border-2 border-gray-300 rounded-lg bg-white">
                          <button
                            onClick={() => decrementQuantity(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 transition-colors rounded-l-lg"
                            title="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-4 font-bold text-gray-900 min-w-[40px] text-center">
                            {item.quantity || 1}
                          </span>
                          <button
                            onClick={() => {
                              if (item.stock && (item.quantity || 1) >= item.stock) {
                                toast.error(`Only ${item.stock} available in stock`);
                                return;
                              }
                              incrementQuantity(item.id);
                            }}
                            disabled={item.stock && (item.quantity || 1) >= item.stock}
                            className={`p-2 transition-colors rounded-r-lg ${
                              item.stock && (item.quantity || 1) >= item.stock
                                ? 'text-gray-400 cursor-not-allowed'
                                : 'text-green-600 hover:bg-green-50'
                            }`}
                            title="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {item.stock && item.stock < 5 && (
                      <div className="mt-3 inline-block bg-orange-100 text-orange-700 px-3 py-1 rounded text-sm font-semibold w-fit">
                        Only {item.stock} left in stock!
                      </div>
                    )}
                    {item.stock && (item.quantity || 1) >= item.stock && (
                      <div className="mt-3 inline-block bg-red-100 text-red-700 px-3 py-1 rounded text-sm font-semibold w-fit">
                        Maximum stock reached ({item.stock} available)
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1 animate-slide-in-right delay-300">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/50 sticky top-8">
              <h2 className="text-2xl font-bold mb-8 text-gray-900">Order Summary</h2>

              <div className="space-y-6 mb-8">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({items.reduce((sum, item) => sum + (item.quantity || 1), 0)} {items.reduce((sum, item) => sum + (item.quantity || 1), 0) === 1 ? 'item' : 'items'})</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(subtotal)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Tax (10%)</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(tax)}</span>
                </div>

                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(shipping)}</span>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleCheckout}
                  className="btn btn-primary flex-1 py-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex items-center justify-center whitespace-nowrap"
                >
                  Checkout
                  <ArrowRight className="w-5 h-5 ml-2" />
                </button>

                <Link
                  to="/motorcycles"
                  className="btn btn-outline flex-1 py-4 rounded-xl hover:bg-gray-50 transition-colors flex items-center justify-center whitespace-nowrap"
                >
                  Continue
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="mt-6 pt-6 border-t space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Free nationwide delivery</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>30-day return policy</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Secure payment processing</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
