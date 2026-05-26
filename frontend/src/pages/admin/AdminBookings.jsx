import { useState, useEffect, useCallback } from 'react';
import { Calendar, Bike, Wrench } from 'lucide-react';
import adminService from '../../services/admin.service';
import { formatDateTime, formatCurrency } from '../../utils/helpers';
import toast from 'react-hot-toast';

const AdminBookings = () => {
  const [activeTab, setActiveTab] = useState('testrides');
  const [testRides, setTestRides] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffOptions, setStaffOptions] = useState({});
  const [loadingStaff, setLoadingStaff] = useState({});
  const [storeOptions, setStoreOptions] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [proposedTimes, setProposedTimes] = useState({});
  const [proposedNotes, setProposedNotes] = useState({});

  const terminalRideStatuses = ['COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'];

  const loadBookings = useCallback(async () => {
    try {
      const testRidesData = await adminService.getAllTestRides(0, 100, null);
      const servicesData = await adminService.getAllServices(0, 100, null);
      setTestRides(testRidesData?.content || []);
      setServices(servicesData?.content || []);
    } catch {
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const loadStores = async () => {
    try {
      setLoadingStores(true);
      const stores = await adminService.getStoresAdmin();
      setStoreOptions(stores || []);
    } catch {
      toast.error('Failed to load stores');
    } finally {
      setLoadingStores(false);
    }
  };

  const loadAvailableStaff = async (ride) => {
    try {
      if (!ride.store?.id) {
        toast.error('Store information is missing for this test ride');
        return;
      }
      setLoadingStaff((prev) => ({ ...prev, [ride.id]: true }));
      const options = await adminService.getAvailableStaff(
        ride.store.id,
        ride.scheduleDateTime || ride.scheduleDate,
        ride.duration || 30
      );
      setStaffOptions((prev) => ({ ...prev, [ride.id]: options || [] }));
    } catch (error) {
      const msg = error?.response?.data?.message || error?.message || 'Failed to load available staff';
      toast.error(msg);
    } finally {
      setLoadingStaff((prev) => ({ ...prev, [ride.id]: false }));
    }
  };

  const getAllowedNextRideStatuses = (current) => {
    switch (current) {
      case 'PENDING':
        return ['CONFIRMED', 'CANCELLED'];
      case 'AWAITING_STAFF_CONFIRMATION':
        return ['CONFIRMED', 'RESCHEDULE_REQUESTED', 'CANCELLED'];
      case 'RESCHEDULE_REQUESTED':
        return ['CONFIRMED', 'CANCELLED'];
      case 'CONFIRMED':
        return ['COMPLETED', 'CANCELLED'];
      default:
        return [];
    }
  };

  const handleUpdateRideStatus = async (id, status) => {
    try {
      if (!status) return;
      if (status === 'CONFIRMED') {
        await adminService.approveTestRide(id);
      } else if (status === 'CANCELLED') {
        await adminService.rejectTestRide(id, 'Cancelled by admin');
      } else if (status === 'COMPLETED') {
        await adminService.completeTestRide(id);
      } else {
        await adminService.updateTestRideStatus(id, status);
      }
      toast.success('Test ride status updated');
      loadBookings();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to update test rides');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update test ride status');
      }
    }
  };

  const handleUpdateServiceStatus = async (id, status) => {
    try {
      if (!status) return;
      await adminService.updateServiceStatus(id, status);
      toast.success('Service status updated');
      loadBookings();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to update services');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update service status');
      }
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
      EXPIRED: 'bg-slate-100 text-slate-700',
      AWAITING_STAFF_CONFIRMATION: 'bg-orange-100 text-orange-800',
      RESCHEDULE_REQUESTED: 'bg-pink-100 text-pink-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return <div className="py-8 text-center">Loading bookings...</div>;
  }

  return (
    <div className="py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Manage Bookings</h1>
        <p className="text-gray-600">
          {testRides.length} test rides, {services.length} services
        </p>
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
      </div>

      {/* Test Rides Tab */}
      {activeTab === 'testrides' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motorcycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contacts
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Staff
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {testRides.map((ride) => (
                  <tr key={ride.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {ride.user?.firstname} {ride.user?.lastname}
                      </div>
                      <div className="text-sm text-gray-500">{ride.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {ride.motorcycle?.brand} {ride.motorcycle?.model}
                      </div>
                      <div className="text-xs text-gray-500">{ride.motorcycle?.category}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(ride.scheduleDateTime || ride.scheduleDate)}
                      {ride.proposedDate && (
                        <div className="text-xs text-orange-600 mt-1">
                          Proposed: {formatDateTime(ride.proposedDate)}
                        </div>
                      )}
                      {ride.assignedAt && (
                        <div className="text-xs text-blue-600 mt-1">
                          Assigned: {formatDateTime(ride.assignedAt)}
                        </div>
                      )}
                      {!terminalRideStatuses.includes(ride.status) && (
                        <div className="mt-2 flex items-center gap-2">
                          <input
                            type="datetime-local"
                            className="input text-xs"
                            value={proposedTimes[ride.id] || ''}
                            onChange={(e) => setProposedTimes((prev) => ({ ...prev, [ride.id]: e.target.value }))}
                          />
                          <input
                            type="text"
                            className="input text-xs"
                            placeholder="Note"
                            value={proposedNotes[ride.id] || ''}
                            onChange={(e) => setProposedNotes((prev) => ({ ...prev, [ride.id]: e.target.value }))}
                          />
                          <button
                            className="btn btn-outline text-xs"
                            onClick={async () => {
                              const raw = proposedTimes[ride.id];
                              if (!raw) return;
                              const newDate = raw.length === 16 ? `${raw}:00` : raw;
                              try {
                                await adminService.proposeTestRideTime(ride.id, newDate, proposedNotes[ride.id] || '');
                                toast.success('Proposed new time');
                                setProposedTimes((prev) => ({ ...prev, [ride.id]: '' }));
                                setProposedNotes((prev) => ({ ...prev, [ride.id]: '' }));
                                loadBookings();
                              } catch (error) {
                                const msg = error?.response?.data?.message || error?.message || 'Failed to propose time';
                                toast.error(msg);
                              }
                            }}
                          >
                            Reschedule
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ride.duration} min
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ride.store ? (
                        <>
                          <div className="text-sm font-medium">{ride.store?.name}</div>
                          <div className="text-xs text-gray-500">{ride.store?.address}</div>
                          {ride.store?.phone && (
                            <div className="text-xs text-gray-500">Phone: {ride.store.phone}</div>
                          )}
                        </>
                      ) : (
                        terminalRideStatuses.includes(ride.status) ? (
                          <div className="text-xs text-gray-500">—</div>
                        ) : (
                          <select
                            className="input text-xs"
                            onFocus={() => storeOptions.length === 0 && loadStores()}
                            onChange={async (e) => {
                              const storeId = e.target.value;
                              if (!storeId) return;
                              try {
                                await adminService.updateTestRideStore(ride.id, storeId);
                                toast.success('Store set');
                                loadBookings();
                              } catch (error) {
                                const msg = error?.response?.data?.message || error?.message || 'Failed to set store';
                                toast.error(msg);
                              }
                            }}
                          >
                            <option value="">{loadingStores ? 'Loading stores...' : 'Set store...'}</option>
                            {storeOptions.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.name} — {s.address}
                              </option>
                            ))}
                          </select>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ride.user?.phone && (
                        <div className="text-xs text-gray-700">Customer: {ride.user.phone}</div>
                      )}
                      {ride.assignedStaff?.user?.phone && (
                        <div className="text-xs text-gray-700">
                          Staff: {ride.assignedStaff.user.phone}
                        </div>
                      )}
                      {ride.location && (
                        <div className="text-xs text-gray-500">Loc: {ride.location}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {ride.assignedStaff ? (
                        <div className="text-sm">
                          <div className="font-medium">
                            {ride.assignedStaff.user?.firstname} {ride.assignedStaff.user?.lastname}
                          </div>
                          <div className="text-xs text-gray-500">{ride.assignedStaff.user?.phone || '—'}</div>
                          {ride.status === 'AWAITING_STAFF_CONFIRMATION' && (
                            <button
                              className="btn btn-outline mt-2 text-xs"
                              onClick={async () => {
                                try {
                                  await adminService.confirmAssignedTestRide(ride.id);
                                  toast.success('Assignment confirmed');
                                  loadBookings();
                                } catch (error) {
                                  const msg = error?.response?.data?.message || error?.message || 'Failed to confirm';
                                  toast.error(msg);
                                }
                              }}
                            >
                              Confirm
                            </button>
                          )}
                        </div>
                      ) : (
                        terminalRideStatuses.includes(ride.status) ? (
                          <div className="text-xs text-gray-500">—</div>
                        ) : (
                          <div className="text-sm">
                            <select
                              className="input text-xs"
                              onFocus={() => !staffOptions[ride.id] && loadAvailableStaff(ride)}
                              onChange={async (e) => {
                                const staffId = e.target.value;
                                if (!staffId) return;
                                try {
                                  await adminService.assignStaffToTestRide(ride.id, staffId);
                                  toast.success('Staff assigned');
                                  loadBookings();
                                } catch (error) {
                                  const msg = error?.response?.data?.message || error?.message || 'Failed to assign staff';
                                  toast.error(msg);
                                }
                              }}
                            >
                              <option value="">Assign staff...</option>
                              {loadingStaff[ride.id] ? (
                                <option>Loading...</option>
                              ) : (
                                (staffOptions[ride.id] || []).map((s) => (
                                  <option key={s.id} value={s.id}>
                                    {s.user?.firstname} {s.user?.lastname} {s.user?.phone ? `(${s.user.phone})` : ''}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>
                        )
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getAllowedNextRideStatuses(ride.status).length > 0 ? (
                        <select
                          value={ride.status}
                          onChange={(e) => handleUpdateRideStatus(ride.id, e.target.value)}
                          className={`text-xs font-semibold rounded-full px-3 py-1 ${getStatusColor(ride.status)}`}
                        >
                          <option value={ride.status}>{ride.status}</option>
                          {getAllowedNextRideStatuses(ride.status).map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(ride.status)}`}>
                          {ride.status}
                        </span>
                      )}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Motorcycle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {service.user?.firstname} {service.user?.lastname}
                      </div>
                      <div className="text-sm text-gray-500">{service.user?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {service.motorcycle?.brand} {service.motorcycle?.model}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{service.serviceType}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(service.scheduleDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={service.status}
                        onChange={(e) => handleUpdateServiceStatus(service.id, e.target.value)}
                        className={`text-xs font-semibold rounded-full px-3 py-1 ${getStatusColor(service.status)}`}
                      >
                        {['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'EXPIRED'].map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {service.cost ? formatCurrency(service.cost) : 'N/A'}
                    </td>
                    
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBookings;
