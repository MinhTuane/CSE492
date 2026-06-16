import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import { bookingService } from '../../services/booking.service';

const StoreLocatorWidget = ({ onStoreFound }) => {
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [nearestStore, setNearestStore] = useState(null);
  const [userCoords, setUserCoords] = useState(null);

  useEffect(() => {
    // Try to load cached location/store and refresh it from the backend
    const cachedStore = localStorage.getItem('nearestStore');
    const cachedCoords = localStorage.getItem('userCoords');
    
    const parseAndSetCachedStore = () => {
      if (cachedStore) {
        try {
          const store = JSON.parse(cachedStore);
          setNearestStore(store);
          if (onStoreFound) onStoreFound(store);
          return store;
        } catch {
          return null;
        }
      }
      return null;
    };

    const initialStore = parseAndSetCachedStore();

    if (cachedCoords) {
      try {
        const coords = JSON.parse(cachedCoords);
        setUserCoords(coords);
        
        // Always fetch the freshest store details from DB using user coordinates
        bookingService.getNearestStore(coords.lat, coords.lng)
          .then((freshStore) => {
            if (freshStore) {
              setNearestStore(freshStore);
              localStorage.setItem('nearestStore', JSON.stringify(freshStore));
              if (onStoreFound) onStoreFound(freshStore);
            }
          })
          .catch(err => {
            console.error("Failed to refresh nearest store:", err);
          });
      } catch (e) {
        console.error("Error parsing user coords:", e);
      }
    } else if (initialStore && initialStore.id) {
      // If we don't have coords but have a cached store, refresh its details from the full store list
      bookingService.getStores()
        .then(stores => {
          const freshStore = (stores || []).find(s => s.id === initialStore.id);
          if (freshStore) {
            setNearestStore(freshStore);
            localStorage.setItem('nearestStore', JSON.stringify(freshStore));
            if (onStoreFound) onStoreFound(freshStore);
          }
        })
        .catch(err => {
          console.error("Failed to refresh cached store by ID:", err);
        });
    }
  }, [onStoreFound]);

  const handleLocate = () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      return;
    }
    setLocationError('');
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const coords = { lat, lng };
          setUserCoords(coords);
          
          const store = await bookingService.getNearestStore(lat, lng);
          setNearestStore(store || null);
          
          if (store && store.id) {
            localStorage.setItem('nearestStore', JSON.stringify(store));
            localStorage.setItem('userCoords', JSON.stringify(coords));
            if (onStoreFound) onStoreFound(store);
          }
        } catch {
          setLocationError('Failed to find nearest store');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocationError('Unable to access location');
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex gap-3">
        <button onClick={handleLocate} className="btn btn-primary" disabled={locating}>
          {locating ? 'Locating...' : 'Use my location'}
        </button>
        <Link to="/my-bookings?open=testride" className="btn btn-outline">
          Book Test Ride
        </Link>
      </div>
      
      {locationError && (
        <div className="mt-3 text-sm text-red-600">{locationError}</div>
      )}
      
      {nearestStore && (
        <div className="mt-6 card p-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="w-5 h-5 text-red-600" />
            <div className="font-bold">{nearestStore.name}</div>
          </div>
          <div className="text-sm text-gray-700 mb-4">{nearestStore.address}</div>
          <div className="w-full rounded-lg overflow-hidden mb-4 bg-gray-100 min-h-[360px]">
            <iframe
              title="Store Map"
              src={`https://www.google.com/maps?q=${nearestStore.latitude},${nearestStore.longitude}&z=14&output=embed`}
              width="100%"
              height="360"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
            ></iframe>
          </div>
          <div className="flex gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${nearestStore.latitude},${nearestStore.longitude}${userCoords ? `&origin=${userCoords.lat},${userCoords.lng}` : ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Get Directions
            </a>
            <Link to="/my-bookings?open=service" className="btn btn-outline">
              Schedule Service
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default StoreLocatorWidget;
