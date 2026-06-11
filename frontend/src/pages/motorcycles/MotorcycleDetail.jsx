import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Star, ShoppingCart, Calendar, DollarSign, ChevronLeft, ChevronRight,
  Gauge, Weight, Zap, Fuel, Circle, CheckCircle2, ArrowRight, GitCompare, Heart, MapPin, Coins, Calculator
} from 'lucide-react';
import { motorcycleService } from '../../services/motorcycle.service';
import { reviewService } from '../../services/review.service';
import { accessoryService } from '../../services/accessory.service';
import api from '../../services/api';
import { formatCurrency, cleanMotorcycleData, getImageUrl } from '../../utils/helpers';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import useWishlistStore from '../../store/wishlistStore';
import toast from 'react-hot-toast';

const FinancingCalculatorModal = lazy(() => import('../../components/motorcycles/FinancingCalculatorModal'));

// Image error handler
const handleImageError = (e) => {
  e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  e.target.onerror = null;
};

const MotorcycleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();
  
  const [motorcycle, setMotorcycle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [storeInventory, setStoreInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('performance');
  const [showFinancingModal, setShowFinancingModal] = useState(false);
  
  // Review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', content: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  const loadMotorcycle = useCallback(async () => {
    try {
      const data = await motorcycleService.getById(id);
      const cleanData = cleanMotorcycleData([data])[0];
      setMotorcycle(cleanData);
    } catch {
      toast.error('Failed to load motorcycle details');
      navigate('/motorcycles');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const loadReviews = useCallback(async () => {
    try {
      const data = await reviewService.getMotorcycleReviews(id);
      setReviews(data);
    } catch {
      console.error('Failed to load reviews');
    }
  }, [id]);

  const loadStoreInventory = useCallback(async () => {
    try {
      const response = await api.get(`/inventory/motorcycle/${id}`);
      setStoreInventory(response.data);
    } catch {
      console.error('Failed to load store inventory');
    }
  }, [id]);

  useEffect(() => {
    loadMotorcycle();
    loadReviews();
    loadStoreInventory();
  }, [loadMotorcycle, loadReviews, loadStoreInventory]);

  const handleAddToCart = () => {
    addItem(motorcycle);
    toast.success('Added to cart!');
  };

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast.error('Please login to purchase');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { buyNowItem: motorcycle } });
  };

  const handleDeposit = () => {
    if (!isAuthenticated) {
      toast.error('Please login to pay deposit');
      navigate('/login');
      return;
    }
    navigate('/checkout', { state: { buyNowItem: motorcycle, deposit: true } });
  };

  const handleBookTestRide = () => {
    if (!isAuthenticated) {
      toast.error('Please login to book a test ride');
      navigate('/login');
      return;
    }
    navigate('/my-bookings?open=testride');
  };

  const toggleWishlist = () => {
    if (isInWishlist(motorcycle.id)) {
      removeFromWishlist(motorcycle.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(motorcycle);
      toast.success('Added to wishlist');
    }
  };

  const handleCompare = () => {
    if (motorcycle?.id) {
      navigate(`/motorcycles/compare?ids=${motorcycle.id}`);
    } else {
      navigate('/motorcycles/compare');
    }
  };

  const nextImage = () => {
    if (motorcycle?.images) {
      setCurrentImageIndex((prev) => 
        prev === motorcycle.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (motorcycle?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? motorcycle.images.length - 1 : prev - 1
      );
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Please login to submit a review');
      navigate('/login');
      return;
    }
    if (!reviewForm.title.trim() || !reviewForm.content.trim()) {
      toast.error('Please fill in all review fields');
      return;
    }

    try {
      setSubmittingReview(true);
      await reviewService.create({
        motorcycleId: id,
        userId: user?.id,
        rating: reviewForm.rating,
        title: reviewForm.title,
        content: reviewForm.content
      });
      toast.success('Review submitted successfully! It will be visible after approval.');
      setReviewForm({ rating: 5, title: '', content: '' });
      setShowReviewForm(false);
      // Optionally reload reviews, though unapproved ones might not show
      loadReviews();
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="animate-pulse">
            <div className="bg-gray-300 h-96 rounded-lg mb-8"></div>
            <div className="bg-gray-300 h-8 rounded w-1/3 mb-4"></div>
            <div className="bg-gray-300 h-4 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!motorcycle) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center">Motorcycle not found</div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'performance', name: 'Engine & Performance' },
    { id: 'chassis', name: 'Chassis & Suspension' },
    { id: 'dimensions', name: 'Dimensions & Weight' },
    { id: 'fuel', name: 'Fuel & Economy' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-sm">
              <Link to="/" className="text-gray-600 hover:text-red-600">Home</Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <Link to="/motorcycles" className="text-gray-600 hover:text-red-600">Motorcycles</Link>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900">{motorcycle.brand}</span>
              <ChevronRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-900 font-medium">{motorcycle.model}</span>
            </div>
            
            {/* Compare & Wishlist Button */}
            <div className="flex items-center gap-3">
              <button
                onClick={toggleWishlist}
                className={`btn btn-outline flex items-center gap-2 ${isInWishlist(motorcycle.id) ? 'border-red-500 text-red-500 bg-red-50 hover:bg-red-100' : ''}`}
              >
                <Heart className={`w-5 h-5 ${isInWishlist(motorcycle.id) ? 'fill-current' : ''}`} />
                {isInWishlist(motorcycle.id) ? 'Saved' : 'Save'}
              </button>
              <button
                onClick={handleCompare}
                className="btn btn-outline flex items-center gap-2"
              >
                <GitCompare className="w-5 h-5" />
                Compare Models
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 animate-fade-in">
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Image Gallery */}
          <div className="animate-slide-in-left">
            <div className="relative bg-white rounded-2xl overflow-hidden shadow-2xl group">
              {motorcycle.status === 'AVAILABLE' && (
                <span className="absolute top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-full text-sm font-semibold z-10">
                  Only {motorcycle.stock} Left
                </span>
              )}
              
              <div className="relative h-96">
                {motorcycle.images && motorcycle.images.length > 0 ? (
                  motorcycle.images.map((imgUrl, imgIndex) => (
                    <img
                      key={imgIndex}
                      src={getImageUrl(imgUrl)}
                      alt={`${motorcycle.model} - view ${imgIndex + 1}`}
                      className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-in-out ${
                        currentImageIndex === imgIndex
                          ? 'opacity-100 scale-100 pointer-events-auto'
                          : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                      onError={handleImageError}
                    />
                  ))
                ) : (
                  <img
                    src={getImageUrl(null)}
                    alt={motorcycle.model}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                )}
                
                {motorcycle.images && motorcycle.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                    >
                      <ChevronLeft className="w-6 h-6 text-gray-800" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110 z-10"
                    >
                      <ChevronRight className="w-6 h-6 text-gray-800" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {motorcycle.images && motorcycle.images.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto">
                  {motorcycle.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        currentImageIndex === index ? 'border-red-600' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={getImageUrl(image)}
                        alt={`${motorcycle.model} ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={handleImageError}
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="animate-slide-in-right delay-200">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-white/50 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-100 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
              <div className="mb-4">
                <span className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-semibold uppercase">
                  {motorcycle.brand}
                </span>
                <span className="ml-2 text-sm text-gray-500">{motorcycle.year} Model Year</span>
              </div>

              <h1 className="text-4xl font-bold mb-4">{motorcycle.model}</h1>

              {/* Rating */}
              {motorcycle.averageRating > 0 && (
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-5 h-5 ${
                          i < Math.round(motorcycle.averageRating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-gray-600">
                    {motorcycle.averageRating.toFixed(1)} ({reviews.length} reviews)
                  </span>
                </div>
              )}

              <p className="text-gray-600 mb-6 leading-relaxed">
                {motorcycle.description}
              </p>

              {/* Key Features */}
              {motorcycle.features && motorcycle.features.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Key Features Included
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {motorcycle.features.slice(0, 6).map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                        <span className="text-gray-700">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Specs */}
              <div className="grid grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Engine</p>
                    <p className="font-semibold">{motorcycle.displacement}cc</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Power</p>
                    <p className="font-semibold">{motorcycle.power} HP</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Weight className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <p className="font-semibold">{motorcycle.weight} kg</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Fuel className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Top Speed</p>
                    <p className="font-semibold">{motorcycle.topSpeed} km/h</p>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6 flex justify-between items-end">
                <div className="flex flex-col mb-2">
                  {motorcycle.discountPercentage > 0 ? (
                    <>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xl text-gray-500 line-through">
                          {formatCurrency(motorcycle.price)}
                        </span>
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-sm font-bold">
                          Save {motorcycle.discountPercentage}%
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-4xl font-bold text-red-600">
                          {formatCurrency(motorcycle.price * (1 - motorcycle.discountPercentage / 100))}
                        </span>
                        <span className="text-sm text-gray-500">*MSRP, freight and setup not included</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-red-600">
                        {formatCurrency(motorcycle.price)}
                      </span>
                      <span className="text-sm text-gray-500">*MSRP, freight and setup not included</span>
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setShowFinancingModal(true)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium mb-2 bg-blue-50 px-3 py-2 rounded-lg"
                >
                  <Calculator className="w-5 h-5" />
                  <span>Estimate Financing</span>
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                ✓ Certified Dealer • Best Price Guarantee
              </p>

              {/* Action Buttons */}
              <div className="space-y-3 mb-8">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleBuyNow}
                    className="btn btn-primary w-full text-lg py-4"
                    disabled={motorcycle.stock === 0}
                  >
                    Buy Now
                  </button>
                  <button
                    onClick={handleDeposit}
                    className="btn border-2 border-red-600 text-red-600 hover:bg-red-50 w-full text-lg py-4 flex items-center justify-center gap-2"
                    disabled={motorcycle.stock === 0}
                  >
                    <Coins className="w-5 h-5" />
                    Pay 10% Deposit
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleBookTestRide}
                    className="btn btn-outline flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-5 h-5" />
                    Test Ride
                  </button>

                  <button
                    onClick={handleAddToCart}
                    className="btn btn-outline flex items-center justify-center gap-2"
                    disabled={motorcycle.stock === 0}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>

                <button
                  onClick={handleCompare}
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <GitCompare className="w-5 h-5" />
                  Compare with Other Models
                </button>
              </div>

              {/* Store Availability */}
              {storeInventory && storeInventory.length > 0 && (
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
                    <MapPin className="w-5 h-5 text-red-600" />
                    Available at Dealerships
                  </h3>
                  <div className="space-y-3">
                    {storeInventory.filter(inv => inv.stock > 0).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{inv.store?.name}</p>
                          <p className="text-xs text-gray-500">{inv.store?.address}</p>
                        </div>
                        <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold whitespace-nowrap">
                          {inv.stock} in stock
                        </span>
                      </div>
                    ))}
                    {storeInventory.filter(inv => inv.stock > 0).length === 0 && (
                      <p className="text-sm text-gray-500 italic">Currently out of stock at all branches.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Specifications Tabs */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl overflow-hidden mb-12 animate-slide-in-up delay-300 border border-gray-100">
          {/* Tab Headers */}
          <div className="border-b">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-6 py-4 font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.name}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-8">
            {activeTab === 'performance' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">Engine Specifications</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Engine Type</dt>
                      <dd className="font-semibold">{motorcycle.engineType || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Displacement</dt>
                      <dd className="font-semibold">{motorcycle.displacement}cc</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Power</dt>
                      <dd className="font-semibold">{motorcycle.power} HP</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Torque</dt>
                      <dd className="font-semibold">{motorcycle.torque} Nm</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-4">Performance</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Top Speed</dt>
                      <dd className="font-semibold">{motorcycle.topSpeed} km/h</dd>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Fuel Capacity</dt>
                      <dd className="font-semibold">{motorcycle.fuelCapacity} L</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'dimensions' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">Weight & Dimensions</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Weight</dt>
                      <dd className="font-semibold">{motorcycle.weight} kg</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {activeTab === 'fuel' && (
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-bold text-lg mb-4">Fuel System</h3>
                  <dl className="space-y-3">
                    <div className="flex justify-between py-2 border-b">
                      <dt className="text-gray-600">Fuel Capacity</dt>
                      <dd className="font-semibold">{motorcycle.fuelCapacity} L</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reviews Section */}
        <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl p-8 mb-12 animate-slide-in-up delay-400 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <h2 className="text-3xl font-bold flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
              Customer Reviews
            </h2>
            <div className="flex items-center gap-3 bg-gray-50 px-6 py-3 rounded-2xl w-fit">
              <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
              <div className="text-right">
                <span className="text-2xl font-bold text-gray-900">{motorcycle.averageRating?.toFixed(1) || '0.0'}</span>
                <span className="text-gray-500 block text-sm">{reviews.length} Reviews</span>
              </div>
            </div>
          </div>

          <div className="mb-8">
            {!showReviewForm ? (
              <button 
                onClick={() => setShowReviewForm(true)}
                className="btn btn-outline"
              >
                Write a Review
              </button>
            ) : (
              <form onSubmit={handleReviewSubmit} className="bg-gray-50 p-6 rounded-2xl space-y-4 max-w-2xl">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-bold text-lg">Write your review</h4>
                  <button type="button" onClick={() => setShowReviewForm(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Rating</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm(prev => ({ ...prev, rating: star }))}
                        className={`w-8 h-8 ${reviewForm.rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                      >
                        <Star className={`w-8 h-8 ${reviewForm.rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input 
                    type="text" 
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, title: e.target.value }))}
                    className="input w-full"
                    placeholder="Summarize your experience"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Review</label>
                  <textarea 
                    value={reviewForm.content}
                    onChange={(e) => setReviewForm(prev => ({ ...prev, content: e.target.value }))}
                    className="input w-full h-32"
                    placeholder="Tell others about this motorcycle..."
                    required
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submittingReview}
                  className="btn btn-primary"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <p className="text-gray-500 text-lg">No reviews yet. Be the first to review!</p>
            </div>
          ) : (
            <div className="space-y-8">
              {reviews.map((review, idx) => (
                <div key={review.id} className={`border-b pb-8 last:border-b-0 animate-slide-in-up delay-${(idx % 3) * 100 + 100}`}>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 shadow-lg rounded-full flex items-center justify-center transform hover:scale-110 transition-transform">
                      <span className="text-white font-bold text-lg">
                        {review.user?.firstname?.[0]}{review.user?.lastname?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg">
                        {review.user?.firstname} {review.user?.lastname}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-6 relative">
                    <h4 className="font-bold text-lg mb-2 text-gray-900">{review.title}</h4>
                    <p className="text-gray-600 leading-relaxed">{review.content}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CTA Section */}
        <div className="relative overflow-hidden mt-12 bg-gradient-to-br from-red-600 via-red-700 to-gray-900 rounded-3xl p-12 text-white text-center shadow-2xl animate-slide-in-up delay-500">
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-red-500 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-gray-800 rounded-full blur-3xl opacity-40"></div>
          
          <div className="relative z-10">
            <h2 className="text-4xl font-extrabold mb-6">Don't Miss Out - Secure Your Bike Now</h2>
            <p className="text-xl mb-10 text-red-100 max-w-2xl mx-auto">
              Limited stock available. Reserve yours today and experience the thrill of the ride.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <button onClick={handleBuyNow} className="btn bg-white text-red-700 hover:bg-gray-100 text-lg px-10 py-4 shadow-xl hover:scale-105 transition-transform duration-300">
                Reserve Now
              </button>
              <button
                onClick={handleCompare}
                className="btn btn-outline border-white/50 bg-white/10 backdrop-blur-md text-white hover:bg-white hover:text-red-700 text-lg px-10 py-4 flex items-center gap-2 shadow-xl hover:scale-105 transition-all duration-300"
              >
                <GitCompare className="w-5 h-5" />
                Compare Models
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFinancingModal && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl">Loading calculator...</div></div>}>
          <FinancingCalculatorModal 
            price={motorcycle.discountPercentage > 0 
              ? motorcycle.price * (1 - motorcycle.discountPercentage / 100) 
              : motorcycle.price} 
            onClose={() => setShowFinancingModal(false)} 
          />
        </Suspense>
      )}
    </div>
  );
};

export default MotorcycleDetail;
