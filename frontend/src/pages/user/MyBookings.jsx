import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar, Clock, MapPin, Bike, Wrench, CheckCircle, XCircle, Download, FileText, Info } from 'lucide-react';
import { bookingService } from '../../services/booking.service';
import { useLocation } from 'react-router-dom';
import { motorcycleService } from '../../services/motorcycle.service';
import { userBikeService } from '../../services/userBike.service';
import useAuthStore from '../../store/authStore';
import { formatDateTime, getImageUrl, formatCurrency, downloadICS } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MyBookings = () => {
  const { user } = useAuthStore();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('testrides');
  const [testRides, setTestRides] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [bookingType, setBookingType] = useState('testride');
  const [motorcycles, setMotorcycles] = useState([]);
  const [stores, setStores] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [autoNearestNote, setAutoNearestNote] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [formData, setFormData] = useState({
    motorcycleId: '',
    scheduleDate: '',
    duration: 30,
    storeId: '',
    notes: '',
    serviceType: '',
    description: ''
  });
  const baseServiceOptions = useMemo(() => [], []);
  const [serviceOptions, setServiceOptions] = useState(baseServiceOptions);
  const [planDetails, setPlanDetails] = useState({});

  const [userBikes, setUserBikes] = useState([]);
  const [showAddBikeForm, setShowAddBikeForm] = useState(false);
  const [newBikeData, setNewBikeData] = useState({
    brand: '', model: '', year: new Date().getFullYear(), licensePlate: '', color: '', currentOdo: 0
  });

  const loadBookings = useCallback(async () => {
    try {
      const [testRidesData, servicesData, userBikesData] = await Promise.all([
        bookingService.getUserTestRides(user.id),
        bookingService.getUserServices(user.id),
        userBikeService.getUserBikes(user.id)
      ]);
      setTestRides(testRidesData);
      setServices(servicesData);
      setUserBikes(userBikesData || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [user.id]);

  const loadMotorcycles = useCallback(async () => {
    try {
      const data = await motorcycleService.getAvailable();
      setMotorcycles(data || []);
    } catch {
      toast.error('Failed to load motorcycles');
    }
  }, []);
  
  const loadStores = useCallback(async () => {
    try {
      const data = await bookingService.getStores();
      const list = data || [];
      if (userCoords) {
        const haversine = (lat1, lon1, lat2, lon2) => {
          const toRad = (v) => (v * Math.PI) / 180;
          const R = 6371;
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        list.sort((a, b) => {
          if (!a.latitude || !a.longitude) return 1;
          if (!b.latitude || !b.longitude) return -1;
          const da = haversine(userCoords.lat, userCoords.lng, a.latitude, a.longitude);
          const db = haversine(userCoords.lat, userCoords.lng, b.latitude, b.longitude);
          return da - db;
        });
      }
      setStores(list);
    } catch {
      toast.error('Failed to load stores');
    }
  }, [userCoords]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get('plan');
    if (plan) {
      setShowBookingForm(true);
      setBookingType('service');
      setFormData((prev) => ({
        ...prev,
        serviceType: plan,
        description: `${plan} package selected`
      }));
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const open = params.get('open');
    if (open === 'service' || open === 'testride') {
      setShowBookingForm(true);
      setBookingType(open);
      window.history.replaceState({}, '', location.pathname);
    }
  }, [location.search, location.pathname]);

  useEffect(() => {
    if (showBookingForm) {
      loadMotorcycles();
      loadStores();
    }
  }, [showBookingForm, loadMotorcycles, loadStores]);
  useEffect(() => {
    if (showBookingForm && bookingType === 'service') {
      (async () => {
        try {
          const offerings = await bookingService.getServiceCatalog();
          const details = {};
          for (const o of offerings || []) {
            details[o.name] = { price: o.price, features: o.features || [] };
          }
          setPlanDetails(details);
          setServiceOptions([...baseServiceOptions, ...Object.keys(details)]);
        } catch { void 0; }
      })();
    }
  }, [showBookingForm, bookingType, baseServiceOptions]);
  useEffect(() => {
    if (showBookingForm && !formData.storeId && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            const s = await bookingService.getNearestStore(pos.coords.latitude, pos.coords.longitude);
            if (s && s.id) {
              setFormData((prev) => ({ ...prev, storeId: s.id }));
              setAutoNearestNote(`Auto-selected nearest store: ${s.name}`);
            }
          } catch {
            setAutoNearestNote('');
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000 }
      );
    }
  }, [showBookingForm, bookingType, formData.storeId]);
  useEffect(() => {
    if (!showBookingForm) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setShowBookingForm(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [showBookingForm]);

  

  const handleAddBike = async (e) => {
    e.preventDefault();
    try {
      await userBikeService.addBike({ ...newBikeData, userId: user.id });
      toast.success('Bike added to your garage!');
      setShowAddBikeForm(false);
      setNewBikeData({ brand: '', model: '', year: new Date().getFullYear(), licensePlate: '', color: '', currentOdo: 0 });
      loadBookings();
    } catch {
      toast.error('Failed to add bike');
    }
  };

  const handleRemoveBike = async (id) => {
    if (!confirm('Remove this bike from your garage?')) return;
    try {
      await userBikeService.removeBike(id);
      toast.success('Bike removed');
      loadBookings();
    } catch {
      toast.error('Failed to remove bike');
    }
  };

  const handleCancelTestRide = async (id) => {
    if (!confirm('Are you sure you want to cancel this test ride?')) return;
    try {
      await bookingService.cancelTestRide(id);
      toast.success('Test ride cancelled');
      loadBookings();
    } catch {
      toast.error('Failed to cancel test ride');
    }
  };

  const formatScheduleDate = (value) => {
    if (!value) return '';
    return value.length === 16 ? `${value}:00` : value;
  };

  const handleSubmitBooking = async () => {
    if (!formData.motorcycleId || !formData.scheduleDate) {
      toast.error('Please select motorcycle and date');
      return;
    }
    if (bookingType === 'testride' && !formData.storeId) {
      toast.error('Please select a store');
      return;
    }
    if (bookingType === 'testride' && (!formData.duration || Number(formData.duration) < 15)) {
      toast.error('Duration must be at least 15 minutes');
      return;
    }
    if (bookingType === 'service' && !formData.serviceType) {
      toast.error('Please select a service type');
      return;
    }
    if (bookingType === 'service' && !formData.storeId) {
      toast.error('Please select a store');
      return;
    }
    setSubmitting(true);
    try {
      if (bookingType === 'testride') {
        await bookingService.scheduleTestRide({
          userId: user.id,
          motorcycleId: formData.motorcycleId,
          scheduleDate: formatScheduleDate(formData.scheduleDate),
          duration: Number(formData.duration),
          storeId: formData.storeId,
          notes: formData.notes,
        });
      } else {
        const bundleId = planDetails[formData.serviceType]?.id;
        await bookingService.scheduleService({
          userId: user.id,
          motorcycleId: formData.motorcycleId,
          serviceType: formData.serviceType,
          storeId: formData.storeId,
          bundleId: bundleId,
          scheduleDate: formatScheduleDate(formData.scheduleDate),
          description: formData.description,
          notes: formData.notes,
        });
      }
      toast.success('Booking scheduled');
      setShowBookingForm(false);
      setFormData({
        motorcycleId: '',
        scheduleDate: '',
        duration: 30,
        storeId: '',
        notes: '',
        serviceType: '',
        description: ''
      });
      loadBookings();
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to schedule booking';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
      SCHEDULED: 'bg-purple-100 text-purple-800',
      IN_PROGRESS: 'bg-blue-100 text-blue-800',
      NO_SHOW: 'bg-gray-100 text-gray-800',
      EXPIRED: 'bg-slate-100 text-slate-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center py-12">Loading bookings...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 animate-fade-in">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8 animate-slide-in-up">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">My Bookings</h1>
          <button onClick={() => setShowBookingForm(true)} className="btn btn-primary px-6 py-3 rounded-full hover:scale-105 transition-transform shadow-lg">
            <Calendar className="w-5 h-5 mr-2 inline" />
            New Booking
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b">
          <button
            onClick={() => setActiveTab('testrides')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'testrides'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bike className="w-5 h-5 inline mr-2" />
            Test Rides ({testRides.length})
          </button>
          <button
            onClick={() => setActiveTab('services')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'services'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wrench className="w-5 h-5 inline mr-2" />
            Services ({services.length})
          </button>
          <button
            onClick={() => setActiveTab('garage')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'garage'
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Bike className="w-5 h-5 inline mr-2" />
            My Garage
          </button>
        </div>

        {/* Test Rides Tab */}
        {activeTab === 'testrides' && (
          <div className="space-y-6">
            {testRides.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl border border-white/50 animate-slide-in-up">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8 animate-float">
                  <Bike className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">No test rides booked</h2>
                <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
                  Experience the thrill of our premium motorcycles. Book a test ride today!
                </p>
                <button onClick={() => setShowBookingForm(true)} className="btn btn-primary inline-flex items-center gap-3 text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-xl">
                  Book Test Ride
                </button>
              </div>
            ) : (
              testRides.map((ride, idx) => (
                <div key={ride.id} className={`bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 animate-slide-in-up delay-${(idx % 3) * 100 + 100} group`}>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <img
                      src={getImageUrl(ride.motorcycle?.images?.[0])}
                      alt={ride.motorcycle?.model}
                      className="w-full lg:w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            {ride.motorcycle?.brand} {ride.motorcycle?.model}
                          </h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDateTime(ride.scheduleDateTime || ride.scheduleDate)}</span>
                            </div>
                            {ride.store && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{ride.store?.name} — {ride.store?.address}</span>
                                {ride.store?.latitude && ride.store?.longitude && (
                                  <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${ride.store.latitude},${ride.store.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="ml-2 text-xs text-red-600 hover:underline"
                                  >
                                    Get Directions
                                  </a>
                                )}
                              </div>
                            )}
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{ride.duration} minutes</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{ride.location || 'Main Test Track'}</span>
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(ride.status)}`}>
                          {ride.status}
                        </span>
                      </div>
                      {ride.notes && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">{ride.notes}</p>
                        </div>
                      )}
                      {(ride.status === 'PENDING' || ride.status === 'CONFIRMED' || ride.status === 'SCHEDULED') && (
                        <div className="mt-4 flex gap-3">
                          {ride.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleCancelTestRide(ride.id)} className="btn btn-outline text-red-600 border-red-600">
                                Cancel Booking
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    await bookingService.confirmTestRide(ride.id);
                                    toast.success('Test ride confirmed');
                                    loadBookings();
                                  } catch (error) {
                                    const msg = error?.response?.data?.message || error?.message || 'Failed to confirm test ride';
                                    toast.error(msg);
                                  }
                                }}
                                className="btn btn-primary"
                              >
                                Confirm
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => downloadICS(
                              `Test Ride: ${ride.motorcycle?.brand} ${ride.motorcycle?.model}`,
                              `Test ride booking for ${ride.motorcycle?.model}. ${ride.notes || ''}`,
                              `${ride.store?.name || 'Motobikes'} - ${ride.store?.address || ride.location || ''}`,
                              ride.scheduleDateTime || ride.scheduleDate,
                              ride.duration || 30
                            )}
                            className="btn btn-outline flex items-center gap-2"
                            title="Add to Calendar"
                          >
                            <Download className="w-4 h-4" />
                            Add to Calendar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            {services.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl border border-white/50 animate-slide-in-up">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8 animate-float">
                  <Wrench className="w-16 h-16 text-gray-400" />
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900">No services scheduled</h2>
                <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
                  Keep your motorcycle in top condition. Schedule a maintenance service with our experts.
                </p>
                <button onClick={() => setShowBookingForm(true)} className="btn btn-primary inline-flex items-center gap-3 text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-xl">
                  Schedule Service
                </button>
              </div>
            ) : (
              services.map((service, idx) => (
                <div key={service.id} className={`bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/50 hover:shadow-2xl transition-all duration-300 animate-slide-in-up delay-${(idx % 3) * 100 + 100} group`}>
                  <div className="flex flex-col lg:flex-row gap-6">
                    <img
                      src={getImageUrl(service.motorcycle?.images?.[0])}
                      alt={service.motorcycle?.model}
                      className="w-full lg:w-48 h-32 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold mb-2">
                            {service.serviceType}
                          </h3>
                          <p className="text-gray-600 mb-2">
                            {service.motorcycle?.brand} {service.motorcycle?.model}
                          </p>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDateTime(service.scheduleDate)}</span>
                            </div>
                            {service.store && (
                              <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>{service.store?.name} — {service.store?.address}</span>
                              </div>
                            )}
                            {service.cost && (
                              <div className="text-lg font-bold text-red-600">
                                {formatCurrency(service.cost)}
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(service.status)}`}>
                          {service.status}
                        </span>
                      </div>
                      {service.description && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Service Details:</p>
                          <p className="text-sm text-gray-600">{service.description}</p>
                        </div>
                      )}
                      {service.notes && (
                        <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm font-medium mb-1">Notes:</p>
                          <p className="text-sm text-gray-600">{service.notes}</p>
                        </div>
                      )}
                      {(service.status === 'PENDING' || service.status === 'SCHEDULED' || service.status === 'CONFIRMED' || service.status === 'IN_PROGRESS') && (
                        <div className="mt-4">
                          <button
                            onClick={() => downloadICS(
                              `Service: ${service.serviceType}`,
                              `Maintenance service for ${service.motorcycle?.brand} ${service.motorcycle?.model}. ${service.description || ''}`,
                              `${service.store?.name || 'Motobikes'} - ${service.store?.address || ''}`,
                              service.scheduleDate,
                              60
                            )}
                            className="btn btn-outline flex items-center gap-2"
                            title="Add to Calendar"
                          >
                            <Download className="w-4 h-4" />
                            Add to Calendar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        {showBookingForm && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4" onClick={() => setShowBookingForm(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                <h2 className="text-xl font-bold">New Booking</h2>
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="text-gray-500 hover:text-gray-900"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setBookingType('testride')}
                    className={`px-4 py-2 rounded-lg border ${bookingType === 'testride' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    Test Ride
                  </button>
                  <button
                    onClick={() => setBookingType('service')}
                    className={`px-4 py-2 rounded-lg border ${bookingType === 'service' ? 'bg-red-600 text-white border-red-600' : 'bg-white text-gray-700 border-gray-300'}`}
                  >
                    Service
                  </button>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Motorcycle</label>
                  <select
                    className="input"
                    value={formData.motorcycleId}
                    onChange={(e) => setFormData({ ...formData, motorcycleId: e.target.value })}
                  >
                    <option value="">Select motorcycle</option>
                    {motorcycles.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.brand} {m.model}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={formData.scheduleDate}
                    onChange={(e) => setFormData({ ...formData, scheduleDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Preferred Store</label>
                  <select
                    className="input"
                    value={formData.storeId}
                    onChange={(e) => setFormData({ ...formData, storeId: e.target.value })}
                  >
                    <option value="">Select store</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} — {s.address}
                      </option>
                    ))}
                  </select>
                  {autoNearestNote && (
                    <div className="text-xs text-gray-500">{autoNearestNote}</div>
                  )}
                </div>
                {bookingType === 'testride' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Duration (minutes)</label>
                      <input
                        type="number"
                        min="15"
                        className="input"
                        value={formData.duration}
                        onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {bookingType === 'service' && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Service Type</label>
                      <select
                        className="input"
                        value={formData.serviceType}
                        onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      >
                        {serviceOptions.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    {planDetails[formData.serviceType] && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <div className="font-semibold">{formData.serviceType} Package</div>
                          <div className="text-lg font-bold text-green-700">{formatCurrency(planDetails[formData.serviceType].price)}</div>
                        </div>
                        <ul className="space-y-2">
                          {(planDetails[formData.serviceType].features || []).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="mt-3 text-right">
                          <button
                            type="button"
                            className="text-sm text-red-600 hover:underline"
                            onClick={() => setFormData((prev) => ({
                              ...prev,
                              serviceType: serviceOptions.length > 0 ? serviceOptions[0] : '',
                              description: ''
                            }))}
                          >
                            Remove plan
                          </button>
                        </div>
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Description</label>
                      <textarea
                        className="input"
                        rows="3"
                        placeholder="Describe the service"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Notes</label>
                  <textarea
                    className="input"
                    rows="3"
                    placeholder="Additional notes (optional)"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowBookingForm(false)}
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitBooking}
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Scheduling...' : 'Schedule'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Garage Tab */}
        {activeTab === 'garage' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">My Motorcycles</h2>
              <button 
                onClick={() => setShowAddBikeForm(!showAddBikeForm)}
                className="btn btn-outline border-red-600 text-red-600 hover:bg-red-50"
              >
                {showAddBikeForm ? 'Cancel' : '+ Add Bike'}
              </button>
            </div>

            {showAddBikeForm && (
              <form onSubmit={handleAddBike} className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 animate-slide-in-up">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Brand</label>
                    <input type="text" required className="input-field w-full" value={newBikeData.brand} onChange={e => setNewBikeData({...newBikeData, brand: e.target.value})} placeholder="e.g. Honda" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                    <input type="text" required className="input-field w-full" value={newBikeData.model} onChange={e => setNewBikeData({...newBikeData, model: e.target.value})} placeholder="e.g. CBR150R" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input type="number" required className="input-field w-full" value={newBikeData.year} onChange={e => setNewBikeData({...newBikeData, year: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">License Plate</label>
                    <input type="text" className="input-field w-full" value={newBikeData.licensePlate} onChange={e => setNewBikeData({...newBikeData, licensePlate: e.target.value})} placeholder="e.g. 59-A1 12345" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current ODO (km)</label>
                    <input type="number" className="input-field w-full" value={newBikeData.currentOdo} onChange={e => setNewBikeData({...newBikeData, currentOdo: e.target.value})} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-full">Save Motorcycle</button>
              </form>
            )}

            {userBikes.length === 0 && !showAddBikeForm ? (
              <div className="bg-white/80 rounded-3xl p-12 text-center border border-white/50">
                <Bike className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">Your garage is empty</h3>
                <p className="text-gray-500 mb-6">Add your motorcycles here to track maintenance history and get service reminders.</p>
                <button onClick={() => setShowAddBikeForm(true)} className="btn btn-primary">Add Your First Bike</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userBikes.map(bike => (
                  <div key={bike.id} className="bg-white rounded-2xl p-6 shadow-md border border-gray-100 hover:shadow-xl transition-all relative">
                    <button onClick={() => handleRemoveBike(bike.id)} className="absolute top-4 right-4 text-gray-400 hover:text-red-600">
                      <XCircle className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                        <Bike className="w-6 h-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{bike.brand} {bike.model}</h3>
                        <p className="text-sm text-gray-500">{bike.year} • {bike.licensePlate || 'No plate'}</p>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg flex justify-between items-center mb-4">
                      <span className="text-sm text-gray-600">Current ODO:</span>
                      <span className="font-bold">{bike.currentOdo?.toLocaleString() || 0} km</span>
                    </div>
                    <button 
                      onClick={() => {
                        setBookingType('service');
                        setShowBookingForm(true);
                      }} 
                      className="w-full btn btn-outline text-sm"
                    >
                      Book Service
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
