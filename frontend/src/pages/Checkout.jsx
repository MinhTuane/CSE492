import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CreditCard, Truck, Check, Lock, Smartphone, Tag, Store, Star, Plus, Trash2, AlertTriangle } from 'lucide-react';
import useCartStore, { VIETNAM_PROVINCES } from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { orderService } from '../services/order.service';
import { storeService } from '../services/store.service';
import { accessoryService } from '../services/accessory.service';
import api from '../services/api';
import { formatCurrency, getImageUrl, isStaff, isValidPhone } from '../utils/helpers';
import toast from 'react-hot-toast';
import vnpayLogo from '../assets/vnpay_logo.svg';
import zalopayLogo from '../assets/zalopay_logo.png';
import momoLogo from '../assets/momo_logo.png';

const isPlaceholderEmail = (email) => typeof email === 'string' && email.endsWith('@mbservices.local');

const isProfileComplete = (u) => {
  if (!u) return false;
  if (isStaff(u)) return true;
  const hasUsername = typeof u.username === 'string' && u.username.trim().length > 0;
  const hasEmail = typeof u.email === 'string' && u.email.trim().length > 0 && !isPlaceholderEmail(u.email);
  const hasName = typeof u.firstname === 'string' && u.firstname.trim().length > 0 && typeof u.lastname === 'string' && u.lastname.trim().length > 0;
  const hasPhone = isValidPhone(u.phone);
  const hasAddress = typeof u.address === 'string' && u.address.trim().length > 0;
  const isSocial = u.authProvider && u.authProvider !== 'LOCAL';
  const hasLocalCredentials = !isSocial || u.hasLocalCredentials === true;
  return hasUsername && hasEmail && hasName && hasPhone && hasAddress && hasLocalCredentials;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, clearCart, getTotalAmount } = useCartStore();
  const { user } = useAuthStore();

  const buyNowItem = location.state?.buyNowItem;

  // Robust parsing of direct Buy Now item or checkout entire cart items
  const checkoutItems = useMemo(() => {
    return buyNowItem ? [{
      id: buyNowItem.id,
      brand: buyNowItem.brand,
      model: buyNowItem.model,
      name: buyNowItem.name,
      originalPrice: buyNowItem.price,
      price: buyNowItem.discountPercentage > 0 
        ? buyNowItem.price * (1 - buyNowItem.discountPercentage / 100) 
        : buyNowItem.price,
      discountPercentage: buyNowItem.discountPercentage || 0,
      category: buyNowItem.category,
      itemType: buyNowItem.itemType || 'motorcycle',
      imageUrl: buyNowItem.imageUrl || buyNowItem.images?.[0],
      quantity: 1,
      stock: buyNowItem.stock || 0
    }] : items;
  }, [buyNowItem, items]);

  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment, 3: Review
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const [shippingData, setShippingData] = useState({
    fullName: `${user?.firstname || ''} ${user?.lastname || ''}`.trim(),
    phone: user?.phone || '',
    address: user?.address || '',
    province: '',
    district: '',
    notes: '',
    storeId: '',
    shippingMethod: 'pickup', // 'pickup' or 'delivery'
    registrationAssisted: false,
    idCardNumber: '',
    regProvince: '',
    regDistrict: ''
  });

  const [stores, setStores] = useState([]);
  const [recommendedAccessories, setRecommendedAccessories] = useState([]);
  const [loadingAccessories, setLoadingAccessories] = useState(false);
  const [selectedAccessories, setSelectedAccessories] = useState([]);
  const [outOfStockItems, setOutOfStockItems] = useState([]);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const verifyProfile = async () => {
      try {
        const res = await api.get(`/users/profile/${user.id}`);
        setProfile(res.data);
        useAuthStore.getState().updateUser(res.data);
        
        if (!isProfileComplete(res.data)) {
          const next = encodeURIComponent(location.pathname + location.search);
          navigate(`/profile?setup=1&next=${next}`, { replace: true });
          return;
        }

        // Fetch stores after profile is verified complete
        const data = await storeService.getAllStores();
        setStores(data);
        if (data.length > 0) {
          setShippingData(prev => ({ ...prev, storeId: data[0].id }));
        }
      } catch (err) {
        console.error("Failed to verify user profile:", err);
        toast.error('Failed to verify profile details');
      } finally {
        setProfileLoading(false);
      }
    };

    verifyProfile();
  }, [user, navigate, location.pathname, location.search]);

  // Check branch inventory for motorcycles in cart/checkout
  useEffect(() => {
    const checkStoreInventory = async () => {
      if (!shippingData.storeId) return;

      const motorcyclesInCart = checkoutItems.filter(
        item => item.itemType?.toLowerCase() === 'motorcycle'
      );
      const oosList = [];

      for (const mc of motorcyclesInCart) {
        try {
          const res = await api.get(`/inventory/motorcycle/${mc.id}`);
          const storeStockRecord = res.data.find(inv => inv.store?.id === shippingData.storeId);
          const storeStock = storeStockRecord ? storeStockRecord.stock : 0;

          if (storeStock < mc.quantity) {
            const totalOtherStock = res.data
              .filter(inv => inv.store?.id !== shippingData.storeId)
              .reduce((sum, inv) => sum + inv.stock, 0);

            oosList.push({
              id: mc.id,
              name: `${mc.brand} ${mc.model || mc.name}`.trim(),
              storeStock,
              otherStockAvailable: totalOtherStock > 0
            });
          }
        } catch (err) {
          console.error(`Failed to verify branch inventory for item ${mc.id}`, err);
        }
      }

      setOutOfStockItems(oosList);
    };

    checkStoreInventory();
  }, [shippingData.storeId, checkoutItems]);

  // Load recommended accessories
  useEffect(() => {
    const loadRecommendedAccessories = async () => {
      try {
        setLoadingAccessories(true);
        const accessoriesData = await accessoryService.searchPaged('', 0, 4);
        if (accessoriesData && accessoriesData.content) {
          // Filter out accessories already in checkoutItems OR selectedAccessories
          const selectedAccessoryIds = selectedAccessories.map(acc => acc.id);
          const cartAccessoryIds = checkoutItems
            .filter(item => item.itemType === 'accessory')
            .map(item => item.id);
          const filtered = accessoriesData.content.filter(
            acc => !cartAccessoryIds.includes(acc.id) && !selectedAccessoryIds.includes(acc.id)
          );
          setRecommendedAccessories(filtered);
        }
      } catch (err) {
        console.error('Failed to load recommended accessories', err);
      } finally {
        setLoadingAccessories(false);
      }
    };
    
    if (checkoutItems.length > 0) {
      loadRecommendedAccessories();
    }
  }, [checkoutItems, selectedAccessories]);

  const [paymentData, setPaymentData] = useState({
    paymentMethod: 'MOMO',
    eWalletType: 'MOMO',
  });

  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [validatingDiscount, setValidatingDiscount] = useState(false);
  const [useLoyaltyPoints, setUseLoyaltyPoints] = useState(false);

  const [isDeposit, setIsDeposit] = useState(location.state?.deposit || false);

  const accessoriesTotal = selectedAccessories.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);
  const baseSubtotal = buyNowItem 
    ? checkoutItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0)
    : getTotalAmount();
  const subtotal = baseSubtotal + accessoriesTotal;
  const tax = subtotal * 0.1;
  const shipping = shippingData.shippingMethod === 'delivery' ? 250000 : 0;

  let calculatedDiscountAmount = 0;
  if (appliedDiscount) {
    calculatedDiscountAmount = (subtotal + tax) * (appliedDiscount.discountPercentage / 100);
    if (appliedDiscount.maxDiscountAmount && calculatedDiscountAmount > appliedDiscount.maxDiscountAmount) {
      calculatedDiscountAmount = appliedDiscount.maxDiscountAmount;
    }
  }

  // Profile is fetched and synced on mount inside the first useEffect hook

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
    const alreadyAdded = selectedAccessories.find(a => a.id === accessory.id);
    if (alreadyAdded) {
      toast(`${accessory.name} already added`, { icon: 'ℹ️' });
      return;
    }
    setSelectedAccessories(prev => [...prev, { ...accessory, quantity: 1 }]);
    setRecommendedAccessories(prev => prev.filter(a => a.id !== accessory.id));
    toast.success(`${accessory.name} added to order`);
  };

  const handleUpdateAccessoryQuantity = (accessoryId, newQuantity) => {
    if (newQuantity <= 0) {
      handleRemoveAccessory(accessoryId);
      return;
    }
    setSelectedAccessories(prev => prev.map(a => 
      a.id === accessoryId ? { ...a, quantity: newQuantity } : a
    ));
  };

  const handleRemoveAccessory = (accessoryId) => {
    const removed = selectedAccessories.find(a => a.id === accessoryId);
    setSelectedAccessories(prev => prev.filter(a => a.id !== accessoryId));
    if (removed) {
      setRecommendedAccessories(prev => [...prev, removed]);
      toast.success(`${removed.name} removed from order`);
    }
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
      const orderItems = checkoutItems.map(item => {
        const isAccessory = item.itemType?.toLowerCase() === 'accessory' || (!!item.name && !item.model);
        return {
          itemType: isAccessory ? 'ACCESSORY' : 'MOTORCYCLE',
          itemId: item.id,
          quantity: item.quantity || 1
        };
      });

      // Add selected accessories to order items
      selectedAccessories.forEach(acc => {
        orderItems.push({
          itemType: 'ACCESSORY',
          itemId: acc.id,
          quantity: acc.quantity || 1
        });
      });

      const orderData = {
        userId: user.id,
        items: orderItems,
        paymentMethod: paymentData.paymentMethod,
        shippingAddress: shippingData.shippingMethod === 'delivery'
          ? `${shippingData.address}, ${shippingData.district}, ${shippingData.province}`
          : 'Store Pickup',
        notes: shippingData.notes + (shippingData.registrationAssisted 
          ? `\n[License Plate Service] Citizen ID: ${shippingData.idCardNumber}, Province: ${shippingData.regProvince}, District: ${shippingData.regDistrict}` 
          : '\n[Self-Registration for License Plate]'),
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        useLoyaltyPoints: useLoyaltyPoints,
        storeId: shippingData.storeId,
        isDeposit: isDeposit
      };

      const order = await orderService.create(orderData);
      
      if (paymentData.paymentMethod === 'VNPAY') {
        const vnpayResponse = await orderService.createVNPayUrl(order.id);
        if (vnpayResponse && vnpayResponse.paymentUrl) {
          if (!buyNowItem) clearCart();
          window.location.href = vnpayResponse.paymentUrl;
          return;
        } else {
          throw new Error('Failed to get VNPay URL');
        }
      } else if (paymentData.paymentMethod === 'ZALOPAY') {
        const zalopayResponse = await orderService.createZaloPayUrl(order.id);
        if (zalopayResponse && zalopayResponse.paymentUrl) {
          if (!buyNowItem) clearCart();
          window.location.href = zalopayResponse.paymentUrl;
          return;
        } else {
          throw new Error('Failed to get ZaloPay URL');
        }
      } else if (paymentData.paymentMethod === 'MOMO') {
        const momoResponse = await orderService.createMomoUrl(order.id);
        if (momoResponse && momoResponse.paymentUrl) {
          if (!buyNowItem) clearCart();
          window.location.href = momoResponse.paymentUrl;
          return;
        } else {
          throw new Error('Failed to get Momo URL');
        }
      }

      if (!buyNowItem) clearCart();
      toast.success('Order placed successfully!');
      navigate(`/my-orders`);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Verifying your profile details...</p>
        </div>
      </div>
    );
  }

  if (checkoutItems.length === 0) {
    navigate('/cart');
    return null;
  }

  const paymentMethods = [
    { 
      value: 'MOMO', 
      label: 'Momo E-Wallet', 
      icon: '🟣',
      logoImg: momoLogo,
      description: 'Pay with Momo - Fast & Secure',
      logo: 'M'
    },
    { 
      value: 'ZALOPAY', 
      label: 'ZaloPay E-Wallet', 
      icon: '🔵',
      logoImg: zalopayLogo,
      description: 'Pay with ZaloPay - Easy Payment',
      logo: 'Z'
    },
    { 
      value: 'VNPAY', 
      label: 'VNPay E-Wallet', 
      icon: '🔴',
      logoImg: vnpayLogo,
      description: 'Pay with VNPay - National Payment Gateway',
      logo: 'V'
    },
    { 
      value: 'BANK_TRANSFER', 
      label: 'Bank Transfer', 
      icon: '🏦',
      description: 'Bank transfer - your order will be pending until payment is confirmed',
      logo: '🏦'
    },
    { 
      value: 'COD', 
      label: 'Cash on Delivery (COD)', 
      icon: '💵',
      description: 'Pay with cash upon delivery',
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
                  {/* Delivery Method Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Vehicle Pickup/Delivery Method *
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setShippingData({ ...shippingData, shippingMethod: 'pickup' })}
                        className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          shippingData.shippingMethod === 'pickup'
                            ? 'border-red-600 bg-red-50/40 text-red-700 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Store className="w-6 h-6 mb-2" />
                        <span className="text-sm">Store Pickup</span>
                        <span className="text-xs text-gray-500 mt-1 font-normal">Free pickup at branch</span>
                      </div>

                      <div
                        onClick={() => setShippingData({ ...shippingData, shippingMethod: 'delivery' })}
                        className={`cursor-pointer p-4 rounded-xl border flex flex-col items-center justify-center text-center transition-all ${
                          shippingData.shippingMethod === 'delivery'
                            ? 'border-red-600 bg-red-50/40 text-red-700 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <Truck className="w-6 h-6 mb-2" />
                        <span className="text-sm">Home Delivery</span>
                        <span className="text-xs text-gray-500 mt-1 font-normal">Shipping: {formatCurrency(250000)}</span>
                      </div>
                    </div>
                  </div>

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

                  {shippingData.shippingMethod === 'delivery' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address *
                        </label>
                        <input
                          type="text"
                          required={shippingData.shippingMethod === 'delivery'}
                          value={shippingData.address}
                          onChange={(e) => setShippingData({ ...shippingData, address: e.target.value })}
                          className="input"
                          placeholder="Street address"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Province/City *
                          </label>
                          <select
                            required={shippingData.shippingMethod === 'delivery'}
                            value={shippingData.province}
                            onChange={(e) => setShippingData({ ...shippingData, province: e.target.value, district: '' })}
                            className="input bg-white"
                          >
                            <option value="">Select Province...</option>
                            {VIETNAM_PROVINCES.map(prov => (
                              <option key={prov.name} value={prov.name}>{prov.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            District *
                          </label>
                          <select
                            required={shippingData.shippingMethod === 'delivery'}
                            value={shippingData.district}
                            onChange={(e) => setShippingData({ ...shippingData, district: e.target.value })}
                            className="input bg-white"
                            disabled={!shippingData.province}
                          >
                            <option value="">Select District...</option>
                            {shippingData.province && VIETNAM_PROVINCES.find(p => p.name === shippingData.province)?.districts.map(dist => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </>
                  )}

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

                  {outOfStockItems.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex gap-3 animate-fade-in">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-bold">Branch Transfer Required</p>
                        {outOfStockItems.map(item => (
                          <p key={item.id}>
                            <strong>{item.name}</strong> is currently out of stock at this branch (Stock: {item.storeStock}).
                            {item.otherStockAvailable ? (
                              <span> We will transfer it from another branch. Delivery to this branch will take <strong>3-5 business days</strong>.</span>
                            ) : (
                              <span> Note: This item is currently low in stock across all branches, transfer might take longer.</span>
                            )}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Registration & License Plate Service Option */}
                  <div className="border-t border-gray-150 pt-6">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="registrationAssisted"
                        checked={shippingData.registrationAssisted}
                        onChange={(e) => setShippingData({ ...shippingData, registrationAssisted: e.target.checked })}
                        className="mt-1 h-5 w-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
                      />
                      <div className="flex-1">
                        <label htmlFor="registrationAssisted" className="block text-sm font-semibold text-gray-800">
                          Dealer-Assisted Registration & License Plate Service (Optional)
                        </label>
                        <p className="text-xs text-gray-500 mt-1">
                          MBServices showroom will handle all tax filings and registration paper submissions on your behalf.
                        </p>
                      </div>
                    </div>

                    {shippingData.registrationAssisted && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Owner's Citizen ID (CCCD) *
                          </label>
                          <input
                            type="text"
                            required={shippingData.registrationAssisted}
                            value={shippingData.idCardNumber}
                            onChange={(e) => setShippingData({ ...shippingData, idCardNumber: e.target.value })}
                            className="input bg-white"
                            placeholder="Enter Citizen ID number"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Registration Province *
                          </label>
                          <select
                            required={shippingData.registrationAssisted}
                            value={shippingData.regProvince}
                            onChange={(e) => setShippingData({ ...shippingData, regProvince: e.target.value, regDistrict: '' })}
                            className="input bg-white"
                          >
                            <option value="">Select Province...</option>
                            {VIETNAM_PROVINCES.map(prov => (
                              <option key={prov.name} value={prov.name}>{prov.name}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1 uppercase tracking-wider">
                            Registration District *
                          </label>
                          <select
                            required={shippingData.registrationAssisted}
                            value={shippingData.regDistrict}
                            onChange={(e) => setShippingData({ ...shippingData, regDistrict: e.target.value })}
                            className="input bg-white"
                            disabled={!shippingData.regProvince}
                          >
                            <option value="">Select District...</option>
                            {shippingData.regProvince && VIETNAM_PROVINCES.find(p => p.name === shippingData.regProvince)?.districts.map(dist => (
                              <option key={dist} value={dist}>{dist}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
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
                          {method.logoImg ? (
                            <div className="w-12 h-12 flex items-center justify-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
                              <img src={method.logoImg} alt={method.label} className="w-full h-full object-contain" />
                            </div>
                          ) : (
                            <div className="text-3xl w-12 h-12 flex items-center justify-center">{method.icon}</div>
                          )}
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
                      {shippingData.shippingMethod === 'delivery'
                        ? `${shippingData.address}, ${shippingData.district}, ${shippingData.province}`
                        : 'Showroom Pickup'}
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
                      {paymentMethods.find(m => m.value === paymentData.paymentMethod)?.logoImg ? (
                        <div className="w-10 h-10 flex items-center justify-center bg-white rounded-lg border border-gray-100 p-1 shadow-sm">
                          <img 
                            src={paymentMethods.find(m => m.value === paymentData.paymentMethod)?.logoImg} 
                            alt="" 
                            className="w-full h-full object-contain" 
                          />
                        </div>
                      ) : (
                        <span className="text-2xl w-10 h-10 flex items-center justify-center">
                          {paymentMethods.find(m => m.value === paymentData.paymentMethod)?.icon}
                        </span>
                      )}
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
                      {checkoutItems.map((item) => (
                        <div key={item.id} className="flex gap-4">
                          <img
                            src={getImageUrl(item.imageUrl || item.images?.[0])}
                            alt={item.model || item.name}
                            className="w-20 h-20 object-cover rounded-lg"
                            onError={(e) => e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="sans-serif" font-size="10" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'}
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

                  {/* Selected Accessories */}
                  {selectedAccessories.length > 0 && (
                    <div className="mt-6 pt-6 border-t">
                      <h3 className="font-bold mb-4">Added Accessories</h3>
                      <div className="space-y-3">
                        {selectedAccessories.map((acc) => (
                          <div key={acc.id} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <div className="flex gap-3 flex-1">
                              <img
                                src={getImageUrl(acc.imageUrl)}
                                alt={acc.name}
                                className="w-16 h-16 object-cover rounded"
                                onError={(e) => e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="sans-serif" font-size="10" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'}
                              />
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{acc.name}</p>
                                <p className="text-xs text-gray-600">Qty: {acc.quantity || 1}</p>
                                <p className="text-sm font-bold text-red-600">{formatCurrency(acc.price * (acc.quantity || 1))}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveAccessory(acc.id)}
                              className="text-red-600 hover:text-red-800 p-2"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {outOfStockItems.length > 0 && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-sm flex gap-3 animate-fade-in mb-4">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Branch Transfer Required (Estimated delay: 3-5 business days)</p>
                      <p className="text-xs text-amber-700 mt-1">
                        One or more vehicles are currently not in stock at your selected showroom. Placing this order confirms your request to transfer the vehicle(s) from another branch.
                      </p>
                    </div>
                  </div>
                )}

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

              {/* Added Accessories List */}
              {selectedAccessories.length > 0 && (
                <div className="mb-6 pb-6 border-b">
                  <span className="font-semibold text-gray-900 block mb-3 text-sm">Added Accessories</span>
                  <div className="space-y-3">
                    {selectedAccessories.map((acc) => (
                      <div key={acc.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-lg border border-gray-100">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <img 
                            src={getImageUrl(acc.imageUrl)} 
                            alt={acc.name} 
                            className="w-10 h-10 object-cover rounded bg-white flex-shrink-0 border"
                            onError={(e) => e.target.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f3f4f6"/><text x="50" y="50" font-family="sans-serif" font-size="10" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle">No Image</text></svg>'}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-xs text-gray-900 truncate" title={acc.name}>{acc.name}</p>
                            <p className="text-xs text-red-600 font-bold">{formatCurrency(acc.price * (acc.quantity || 1))}</p>
                            <div className="flex items-center gap-1.5 mt-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateAccessoryQuantity(acc.id, (acc.quantity || 1) - 1)}
                                className="w-4 h-4 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 transition-colors"
                              >
                                -
                              </button>
                              <span className="text-xs font-semibold w-5 text-center text-gray-800">{acc.quantity || 1}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateAccessoryQuantity(acc.id, (acc.quantity || 1) + 1)}
                                className="w-4 h-4 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-bold text-gray-700 transition-colors"
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveAccessory(acc.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 transition-colors flex-shrink-0"
                          title="Remove Accessory"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  <div className="bg-purple-50 border border-purple-100 rounded p-2 flex flex-col items-center justify-center min-h-[60px]">
                    <img src={momoLogo} alt="Momo" className="h-6 object-contain" />
                    <div className="text-[10px] font-semibold mt-1 text-purple-700">Momo</div>
                  </div>
                  <div className="bg-blue-50 border border-blue-100 rounded p-2 flex flex-col items-center justify-center min-h-[60px]">
                    <img src={zalopayLogo} alt="ZaloPay" className="h-6 object-contain" />
                    <div className="text-[10px] font-semibold mt-1 text-blue-700">ZaloPay</div>
                  </div>
                  <div className="bg-red-50 border border-red-100 rounded p-2 flex flex-col items-center justify-center min-h-[60px]">
                    <img src={vnpayLogo} alt="VNPay" className="h-6 object-contain" />
                    <div className="text-[10px] font-semibold mt-1 text-red-700">VNPay</div>
                  </div>
                  <div className="bg-gray-50 border border-gray-100 rounded p-2 flex flex-col items-center justify-center min-h-[60px]">
                    <div className="text-2xl">💵</div>
                    <div className="text-[10px] font-semibold mt-1 text-gray-700">COD / CK</div>
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
