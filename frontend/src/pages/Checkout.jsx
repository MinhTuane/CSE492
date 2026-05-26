import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Truck, Check, Lock, Smartphone, Tag, Store, Star, Plus } from 'lucide-react';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderService } from '../services/order.service';
import { storeService } from '../services/store.service';
import { accessoryService } from '../services/accessory.service';
import api from '../services/api';
import { formatCurrency } from '../utils/helpers';
import toast from 'react-hot-toast';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart, getTotalAmount, addItem } = useCartStore();
  const { user } = useAuthStore();
  
  const isPlaceholderEmail = (email) => typeof email === 'string' && email.endsWith('@mbservices.local');
  const isProfileComplete = (u) => {
    if (!u) return false;
    const hasUsername = typeof u.username === 'string' && u.username.trim().length > 0;
    const hasEmail = typeof u.email === 'string' && u.email.trim().length > 0 && !isPlaceholderEmail(u.email);
    const hasName = typeof u.firstname === 'string' && u.firstname.trim().length > 0 && typeof u.lastname === 'string' && u.lastname.trim().length > 0;
    const hasPhone = typeof u.phone === 'string' && /^[0-9]{10,11}$/.test(u.phone);
    const hasAddress = typeof u.address === 'string' && u.address.trim().length > 0;
    const hasLocalCredentials = u.authProvider === 'LOCAL' || u.hasLocalCredentials === true;
    return hasUsername && hasEmail && hasName && hasPhone && hasAddress && hasLocalCredentials;
  };

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [loading, setLoading] = useState(false);

  const [shippingData, setShippingData] = useState({
    fullName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
    phone: user?.phone || '',
    address: user?.address || '',
    city: '',
    zipCode: '',
    notes: '',
    storeId: ''
  });

  const [stores, setStores] = useState([]);
  const [recommendedAccessories, setRecommendedAccessories] = useState([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);

  useEffect(() => {
    if (user && !isProfileComplete(user)) {
      const next = encodeURIComponent(location.pathname + location.search);
      navigate(`/profile?setup=1&next=${next}`, { replace: true });
      return;
    }
    const fetchStores = async () => {
      try {
        const data = await storeService.getAllStores();
        setStores(data);
        if (data.length > 0) {
          setShippingData(prev => ({ ...prev, storeId: data[0].id }));
        }
      } catch {
        toast.error('Failed to load stores');
      }
    };
    fetchStores();
  }, [user, location.pathname, location.search, navigate]);

  // Load recommended accessories
  useEffect(() => {
    const loadRecommendedAccessories = async () => {
      try {
        setLoadingAccessories(true);
        const accessoriesData = await accessoryService.searchPaged('', 0, 4);
        if (accessoriesData && accessoriesData.content) {
          // Filter out accessories already in cart
          const cartAccessoryIds = items
            .filter(item => item.itemType === 'accessory')
            .map(item => item.id);
          const filtered = accessoriesData.content.filter(
            acc => !cartAccessoryIds.includes(acc.id)
          );
          setRecommendedAccessories(filtered);
        }
      } catch (err) {
        console.error('Failed to load recommended accessories', err);
      } finally {
        setLoadingAccessories(false);
      }
    };
    
    if (items.length > 0) {
      loadRecommendedAccessories();
    }
  }, [items]);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'MOMO',
    eWalletType: 'MOMO',
  });

  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const [isDeposit, setIsDeposit] = useState(location.state?.deposit || false);

  const subtotal = getTotalAmount();
  const tax = subtotal * 0.1;
  const shipping = 100000;

  let calculatedDiscountAmount = 0;
  if (appliedDiscount) {
    calculatedDiscountAmount = (subtotal + tax) * (appliedDiscount.discountPercentage / 100);
    if (appliedDiscount.maxDiscountAmount && calculatedDiscountAmount > appliedDiscount.maxDiscountAmount) {
      calculatedDiscountAmount = appliedDiscount.maxDiscountAmount;
    }
  }

  const [profile, setProfile] = useState(null);
  useEffect(() => {
    if (user?.id) {
      api.get(`/users/profile/${user.id}`).then(res => setProfile(res.data)).catch(console.error);
    }
  }, [user?.id]);

  let tierDiscountAmount = 0;
  if (profile?.membershipTier) {
    let tierPercent = 0;
    if (profile.membershipTier === 'SILVER') tierPercent = 0.02;
    if (profile.membershipTier === 'GOLD') tierPercent = 0.05;
    if (profile.membershipTier === 'PLATINUM') tierPercent = 0.10;
    tierDiscountAmount = (subtotal + tax + shipping - calculatedDiscountAmount) * tierPercent;
  }

  const pointsDiscount = useLoyaltyPoints && user?.loyaltyPoints >= 1000 
    ? Math.floor(user.loyaltyPoints / 1000) * 100000 
    : 0;

  let total = subtotal + tax + shipping - calculatedDiscountAmount - tierDiscountAmount - pointsDiscount;
  if (total < 0) total = 0;

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;
    try {
      setValidatingDiscount(true);
      const res = await api.get(`/discount-codes/validate/${discountInput.trim()}`);
      setAppliedDiscount(res.data);
      toast.success('Discount applied!');
    } catch (error) {
      setAppliedDiscount(null);
      toast.error(error?.response?.data?.message || 'Invalid or expired discount code');
    } finally {
      setValidatingDiscount(false);
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountInput('');
  };

  const handleAddAccessoryToOrder = (accessory) => {
    const cartItem = {
      ...accessory,
      itemType: 'accessory',
      images: [accessory.imageUrl],
      quantity: 1,
      stock: accessory.stock || 0
    };
    addItem(cartItem);
    toast.success(`${accessory.name} added to order!`);
    
    // Remove from recommendations
    setRecommendedAccessories(prev => prev.filter(acc => acc.id !== accessory.id));
  };

  const handleShippingSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    setStep(3);
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // Build items array with quantities (new format)
      const orderItems = items.map(item => ({
        itemType: item.itemType === 'accessory' ? 'ACCESSORY' : 'MOTORCYCLE',
        itemId: item.id,
        quantity: item.quantity || 1
      }));

      const orderData = {
        userId: user.id,
        items: orderItems, // New format with quantities
        paymentMethod: paymentData.paymentMethod,
        shippingAddress: `${shippingData.address}, ${shippingData.city}, ${shippingData.zipCode}`,
        notes: shippingData.notes,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        useLoyaltyPoints: useLoyaltyPoints,
        storeId: shippingData.storeId,
        isDeposit: isDeposit
      };

      const order = await orderService.create(orderData);
      
      if (paymentData.paymentMethod === 'VNPAY') {
        const vnpayResponse = await orderService.createVNPayUrl(order.id);
        if (vnpayResponse && vnpayResponse.paymentUrl) {
          clearCart();
          window.location.href = vnpayResponse.paymentUrl;
          return;
        } else {
          throw new Error('Failed to get VNPay URL');
        }
      } else if (paymentData.paymentMethod === 'ZALOPAY') {
        const zalopayResponse = await orderService.createZaloPayUrl(order.id);
        if (zalopayResponse && zalopayResponse.paymentUrl) {
          clearCart();
          window.location.href = zalopayResponse.paymentUrl;
          return;
        } else {
          throw new Error('Failed to get ZaloPay URL');
        }
      } else if (paymentData.paymentMethod === 'MOMO') {
        const momoResponse = await orderService.createMomoUrl(order.id);
        if (momoResponse && momoResponse.paymentUrl) {
          clearCart();
          window.location.href = momoResponse.paymentUrl;
          return;
        } else {
          throw new Error('Failed to get Momo URL');
        }
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/my-orders`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  const paymentMethods = [
    { 
      value: 'MOMO', 
      label: 'Momo E-Wallet', 
      icon: '🟣',
      description: 'Pay with Momo - Fast & Secure',
      logo: 'M'
    },
    { 
      value: 'ZALOPAY', 
      label: 'ZaloPay E-Wallet', 
      icon: '🔵',
      description: 'Pay with ZaloPay - Easy Payment',
      logo: 'Z'
    },
    { 
      value: 'VNPAY', 
      label: 'VNPay E-Wallet', 
      icon: '🔴',
      description: 'Pay with VNPay - National Payment Gateway',
      logo: 'V'
    },
    { 
      value: 'BANK_TRANSFER', 
      label: 'Bank Transfer', 
      icon: '🏦',
      description: 'Chuyển khoản — đơn ở trạng thái chờ cho đến khi được xác nhận thanh toán',
      logo: '🏦'
    },
    { 
      value: 'COD', 
      label: 'Cash on Delivery (COD)', 
      icon: '💵',
      description: 'Thanh toán khi nhận hàng',
      logo: '💵'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            {[
              { num: 1, label: 'Shipping' },
              { num: 2, label: 'Payment' },
              { num: 3, label: 'Review' }
            ].map((s, index) => (
              <div key={s.num} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                      step >= s.num
                        ? 'bg-red-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {step > s.num ? <Check className="w-6 h-6" /> : s.num}
                  </div>
                  <span className="text-sm mt-2 font-medium">{s.label}</span>
                </div>
                {index < 2 && (
                  <div
                    className={`w-24 h-1 mx-2 ${
                      step > s.num ? 'bg-red-600' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {/* Step 1: Shipping Information */}
            {step === 1 && (
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Truck className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-bold">Shipping Information</h2>
                </div>

                <form onSubmit={handleShippingSubmit} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingData.fullName}
                      onChange={(e) => setShippingData({ ...shippingData, fullName: e.target.value })}
                      className="input"
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={shippingData.phone}
                      onChange={(e) => setShippingData({ ...shippingData, phone: e.target.value })}
                      className="input"
                      placeholder="0123456789"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      type="text"
                      required
                      value={shippingData.address}
                      onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                      className="input"
                      placeholder="Street address"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        City *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.city}
                        onChange={(e) => setShippingData({ ...shippingData, city: e.target.value })}
                        className="input"
                        placeholder="Ho Chi Minh City"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Zip Code *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.zipCode}
                        onChange={(e) => setShippingData({ ...shippingData, zipCode: e.target.value })}
                        className="input"
                        placeholder="700000"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Store className="w-4 h-4 inline mr-1" />
                      Select Pickup/Delivery Branch *
                    </label>
                    <select
                      required
                      value={shippingData.storeId}
                      onChange={(e) => setShippingData({ ...shippingData, storeId: e.target.value })}
                      className="input bg-white"
                    >
                      <option value="" disabled>Select a branch...</option>
                      {stores.map(store => (
                        <option key={store.id} value={store.id}>
                          {store.name} - {store.address}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Order Notes (Optional)
                    </label>
                    <textarea
                      rows="3"
                      value={shippingData.notes}
                      onChange={(e) => setShippingData({ ...shippingData, notes: e.target.value })}
                      className="input"
                      placeholder="Any special instructions for delivery"
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full text-lg py-3">
                    Continue to Payment
                  </button>
                </form>
              </div>
            )}

            {/* Step 2: Payment Method */}
            {step === 2 && (
              <div className="card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-red-600" />
                  <h2 className="text-2xl font-bold">Payment Method</h2>
                </div>

                <form onSubmit={handlePaymentSubmit} className="space-y-6">
                  {/* Payment Method Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Select Payment Method
                    </label>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => (
                        <label
                          key={method.value}
                          className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            paymentData.paymentMethod === method.value
                              ? 'border-red-600 bg-red-50 shadow-md'
                              : 'border-gray-200 hover:border-gray-300 hover:shadow'
                          }`}
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value={method.value}
                            checked={paymentData.paymentMethod === method.value}
                            onChange={(e) => setPaymentData({ 
                              ...paymentData, 
                              paymentMethod: e.target.value,
                              eWalletType: ['MOMO', 'ZALOPAY', 'VNPAY'].includes(e.target.value) ? e.target.value : ''
                            })}
                            className="text-red-600 w-5 h-5"
                          />
                          <div className="text-3xl">{method.icon}</div>
                          <div className="flex-1">
                            <div className="font-semibold text-lg">{method.label}</div>
                            <div className="text-sm text-gray-600">{method.description}</div>
                          </div>
                          {paymentData.paymentMethod === method.value && (
                            <Check className="w-6 h-6 text-red-600" />
                          )}
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* E-Wallet Instructions */}
                  {(paymentData.paymentMethod === 'MOMO' || 
                    paymentData.paymentMethod === 'ZALOPAY' || 
                    paymentData.paymentMethod === 'VNPAY') && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div className="flex items-start gap-3">
                        <Smartphone className="w-6 h-6 text-blue-600 mt-1" />
                        <div>
                          <h4 className="font-bold text-blue-900 mb-2">
                            {paymentData.paymentMethod === 'MOMO' && 'Momo Payment Instructions'}
                            {paymentData.paymentMethod === 'ZALOPAY' && 'ZaloPay Payment Instructions'}
                            {paymentData.paymentMethod === 'VNPAY' && 'VNPay Payment Instructions'}
                          </h4>
                          <ol className="text-sm text-blue-800 space-y-1">
                            <li>1. Click "Review Order" to continue</li>
                            <li>2. You will be redirected to {paymentData.paymentMethod} app</li>
                            <li>3. Confirm payment in the app</li>
                            <li>4. Return to see order confirmation</li>
                          </ol>
                          <div className="mt-3 p-3 bg-white rounded border border-blue-300">
                            <p className="text-sm font-semibold text-blue-900">
                              💡 Make sure you have {paymentData.paymentMethod} app installed!
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Bank Transfer Instructions */}
                  {paymentData.paymentMethod === 'BANK_TRANSFER' && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <h4 className="font-bold mb-3">Bank Transfer Details</h4>
                      <div className="space-y-2 text-sm">
                        <p><strong>Bank:</strong> Vietcombank</p>
                        <p><strong>Account Number:</strong> 1234567890</p>
                        <p><strong>Account Name:</strong> CONG TY TNHH MOTOBIKES</p>
                        <p><strong>Content:</strong> Order + Phone Number</p>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="btn btn-secondary flex-1"
                    >
                      Back
                    </button>
                    <button type="submit" className="btn btn-primary flex-1">
                      Review Order
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 3: Review Order */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="card p-8">
                  <h2 className="text-2xl font-bold mb-6">Review Your Order</h2>

                  {/* Shipping Info */}
                  <div className="mb-6 pb-6 border-b">
                    <h3 className="font-bold mb-3">Shipping Address</h3>
                    <p className="text-gray-600">{shippingData.fullName}</p>
                    <p className="text-gray-600">{shippingData.phone}</p>
                    <p className="text-gray-600">
                      {shippingData.address}, {shippingData.city}, {shippingData.zipCode}
                    </p>
                    <button
                      onClick={() => setStep(1)}
                      className="text-red-600 text-sm font-medium mt-2"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Payment Info */}
                  <div className="mb-6 pb-6 border-b">
                    <h3 className="font-bold mb-3">Payment Method</h3>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">
                        {paymentMethods.find(m => m.value === paymentData.paymentMethod)?.icon}
                      </span>
                      <div>
                        <p className="font-semibold">
                          {paymentMethods.find(m => m.value === paymentData.paymentMethod)?.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setStep(2)}
                      className="text-red-600 text-sm font-medium mt-2"
                    >
                      Edit
                    </button>
                  </div>

                  {/* Order Items */}
                  <div>
                    <h3 className="font-bold mb-4">Order Items</h3>
                    <div className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={item.images?.[0] || 'https://via.placeholder.com/100'}
                            alt={item.model || item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h4 className="font-semibold">
                              {item.brand} {item.model || item.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              Quantity: {item.quantity || 1}
                            </p>
                            <p className="font-bold text-red-600 mt-1">
                              {formatCurrency(item.price)} × {item.quantity || 1} = {formatCurrency(item.price * (item.quantity || 1))}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={loading}
                  className="btn btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
                >
                  <Lock className="w-5 h-5" />
                  {loading ? 'Processing...' : `Place Order - ${formatCurrency(total)}`}
                </button>
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h3 className="text-lg font-bold mb-4">Order Summary</h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
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

                {appliedDiscount && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount ({appliedDiscount.code})</span>
                    <span className="font-semibold">- {formatCurrency(calculatedDiscountAmount)}</span>
                  </div>
                )}
                
                {tierDiscountAmount > 0 && (
                  <div className="flex justify-between text-orange-600">
                    <span>{profile?.membershipTier} Tier Discount</span>
                    <span className="font-semibold">- {formatCurrency(tierDiscountAmount)}</span>
                  </div>
                )}

                {user?.loyaltyPoints >= 1000 && (
                  <div className="pt-4 border-t border-gray-200">
                    <label className="flex items-center gap-3 p-3 bg-yellow-50 rounded-xl border border-yellow-200 cursor-pointer hover:bg-yellow-100 transition-colors">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-yellow-600 rounded border-gray-300 focus:ring-yellow-500"
                        checked={useLoyaltyPoints}
                        onChange={(e) => setUseLoyaltyPoints(e.target.checked)}
                      />
                      <div className="flex-1">
                        <div className="font-bold text-yellow-800">Use Loyalty Points</div>
                        <div className="text-sm text-yellow-700">
                          Redeem {Math.floor(user.loyaltyPoints / 1000) * 1000} pts for {formatCurrency(Math.floor(user.loyaltyPoints / 1000) * 100000)} off
                        </div>
                      </div>
                    </label>
                  </div>
                )}
                
                {useLoyaltyPoints && pointsDiscount > 0 && (
                  <div className="flex justify-between text-yellow-600 font-medium">
                    <span>Points Redemption</span>
                    <span>-{formatCurrency(pointsDiscount)}</span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between">
                    <span className="text-lg font-bold">Total</span>
                    <span className="text-2xl font-bold text-red-600">{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              {/* Discount Code Section */}
              <div className="mb-6 pb-6 border-b">
                <div className="flex items-center gap-2 mb-3">
                  <Tag className="w-5 h-5 text-gray-600" />
                  <span className="font-semibold text-gray-900">Discount Code</span>
                </div>
                {appliedDiscount ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg p-3">
                    <div>
                      <p className="text-green-800 font-semibold">{appliedDiscount.code}</p>
                      <p className="text-green-600 text-sm">-{appliedDiscount.discountPercentage}% applied</p>
                    </div>
                    <button
                      onClick={handleRemoveDiscount}
                      className="text-gray-500 hover:text-red-600 font-medium text-sm"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value.toUpperCase())}
                      className="input flex-1 uppercase"
                    />
                    <button
                      onClick={handleApplyDiscount}
                      disabled={validatingDiscount || !discountInput.trim()}
                      className="btn btn-secondary px-4 whitespace-nowrap"
                    >
                      {validatingDiscount ? '...' : 'Apply'}
                    </button>
                  </div>
                )}
              </div>

              {/* Recommended Accessories */}
              {recommendedAccessories.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                    <span className="font-semibold text-gray-900">Add More Items</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">Frequently bought together</p>
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {recommendedAccessories.map((accessory) => (
                      <div 
                        key={accessory.id} 
                        className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50/30 transition-all group"
                      >
                        <img 
                          src={accessory.imageUrl} 
                          alt={accessory.name} 
                          className="w-14 h-14 object-cover rounded-lg bg-white flex-shrink-0"
                          onError={(e) => { 
                            e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=150'; 
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-gray-900 truncate">{accessory.name}</h4>
                          <p className="text-xs text-gray-500">{accessory.brand}</p>
                          <p className="text-sm font-bold text-red-600 mt-1">{formatCurrency(accessory.price)}</p>
                        </div>
                        <button
                          onClick={() => handleAddAccessoryToOrder(accessory)}
                          className="w-8 h-8 rounded-full bg-gray-100 group-hover:bg-red-600 group-hover:text-white flex items-center justify-center transition-all flex-shrink-0 hover:scale-110"
                          title="Add to Order"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  {loadingAccessories && (
                    <div className="text-center py-4">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-red-600"></div>
                    </div>
                  )}
                </div>
              )}

              {/* Payment Option */}
              <div className="mb-6 pb-6 border-b">
                <h3 className="font-bold mb-3">Payment Amount</h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="paymentAmount" 
                        checked={!isDeposit} 
                        onChange={() => setIsDeposit(false)} 
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="font-medium">Pay Full Amount</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(total)}</span>
                  </label>
                  <label className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <input 
                        type="radio" 
                        name="paymentAmount" 
                        checked={isDeposit} 
                        onChange={() => setIsDeposit(true)} 
                        className="w-4 h-4 text-red-600"
                      />
                      <span className="font-medium">Pay 10% Deposit</span>
                    </div>
                    <span className="font-bold text-gray-900">{formatCurrency(total * 0.1)}</span>
                  </label>
                </div>
              </div>

              <div className="mt-4 p-4 bg-gray-100 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">Order Total</h4>
                <div className="flex justify-between items-center text-lg">
                  <span className="text-gray-600">To Pay Now:</span>
                  <span className="font-bold text-red-600 text-xl">
                    {formatCurrency(isDeposit ? total * 0.1 : total)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-6">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Free nationwide delivery</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Secure payment</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  <span>30-day return policy</span>
                </div>
              </div>

              {/* Accepted Payment Methods */}
              <div className="border-t pt-4">
                <p className="text-xs text-gray-500 mb-3">We accept:</p>
                <div className="grid grid-cols-4 gap-2">
                  <div className="bg-purple-100 rounded p-2 text-center">
                    <div className="text-2xl">🟣</div>
                    <div className="text-xs font-semibold mt-1">Momo</div>
                  </div>
                  <div className="bg-blue-100 rounded p-2 text-center">
                    <div className="text-2xl">🔵</div>
                    <div className="text-xs font-semibold mt-1">ZaloPay</div>
                  </div>
                  <div className="bg-red-100 rounded p-2 text-center">
                    <div className="text-2xl">🔴</div>
                    <div className="text-xs font-semibold mt-1">VNPay</div>
                  </div>
                  <div className="bg-gray-100 rounded p-2 text-center">
                    <div className="text-2xl">💵</div>
                    <div className="text-xs font-semibold mt-1">COD / CK</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
