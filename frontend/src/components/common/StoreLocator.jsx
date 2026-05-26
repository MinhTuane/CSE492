import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { storeService } from '../../services/store.service';

// Fix Leaflet marker icon issue in React
if (L && L.Icon && L.Icon.Default) {
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}

// Custom component to handle map center updates
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

const StoreLocator = () => {
  const [stores, setStores] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [nearestStore, setNearestStore] = useState(null);
  const [mapCenter, setMapCenter] = useState([10.762622, 106.660172]); // Default HCM
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const data = await storeService.getAllStores();
      setStores(data);
      if (data.length > 0) {
        setMapCenter([data[0].latitude || 10.762622, data[0].longitude || 106.660172]);
      }
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate distance using Haversine formula
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const handleLocateMe = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);

          // Find nearest store
          if (stores.length > 0) {
            let closest = stores[0];
            let minDistance = getDistanceFromLatLonInKm(lat, lng, closest.latitude, closest.longitude);

            for (let i = 1; i < stores.length; i++) {
              if (stores[i].latitude && stores[i].longitude) {
                const dist = getDistanceFromLatLonInKm(lat, lng, stores[i].latitude, stores[i].longitude);
                if (dist < minDistance) {
                  minDistance = dist;
                  closest = stores[i];
                }
              }
            }
            setNearestStore({ ...closest, distance: minDistance.toFixed(1) });
          }
        },
        (error) => {
          console.error("Error getting location", error);
          alert("Please allow location access to find the nearest store.");
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  if (loading) return <div className="text-center p-8">Loading map...</div>;

  return (
    <div className="card p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <MapPin className="text-red-600" /> Store Locator
        </h2>
        <button 
          onClick={handleLocateMe}
          className="btn btn-outline flex items-center gap-2"
        >
          <Navigation className="w-4 h-4" /> Find Nearest Store
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Store List */}
        <div className="md:col-span-1 space-y-4 max-h-[500px] overflow-y-auto pr-2">
          {nearestStore && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
              <h3 className="font-bold text-red-800 flex items-center gap-2">
                🌟 Nearest Store ({nearestStore.distance} km)
              </h3>
              <p className="font-semibold mt-2">{nearestStore.name}</p>
              <p className="text-sm text-gray-600 mt-1">{nearestStore.address}</p>
              <div className="flex gap-4 mt-3">
                <button 
                  onClick={() => setMapCenter([nearestStore.latitude, nearestStore.longitude])}
                  className="text-red-600 text-sm font-medium hover:underline"
                >
                  View on map
                </button>
                <a 
                  href={`https://www.google.com/maps/dir/?api=1&destination=${nearestStore.latitude},${nearestStore.longitude}`} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
                >
                  <Navigation className="w-3 h-3" /> Get Directions
                </a>
              </div>
            </div>
          )}

          {stores.map(store => (
            <div 
              key={store.id} 
              className={`p-4 rounded-lg border transition-all ${
                nearestStore?.id === store.id ? 'hidden' : 'hover:border-red-500 hover:shadow-md'
              }`}
            >
              <div 
                className="cursor-pointer"
                onClick={() => {
                  if (store.latitude && store.longitude) {
                    setMapCenter([store.latitude, store.longitude]);
                  }
                }}
              >
                <h3 className="font-bold">{store.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{store.address}</p>
                <p className="text-sm text-gray-500 mt-1 mb-3">📞 {store.phone}</p>
              </div>
              <a 
                href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 text-sm font-medium hover:underline"
              >
                <Navigation className="w-3 h-3" /> Get Directions
              </a>
            </div>
          ))}
        </div>

        {/* Map */}
        <div className="md:col-span-2 h-[500px] rounded-lg overflow-hidden border">
          <MapContainer 
            center={mapCenter} 
            zoom={13} 
            style={{ height: '100%', width: '100%' }}
          >
            <ChangeView center={mapCenter} zoom={13} />
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            
            {/* User Location Marker */}
            {userLocation && (
              <Marker position={userLocation}>
                <Popup>
                  <strong>You are here</strong>
                </Popup>
              </Marker>
            )}

            {/* Store Markers */}
            {stores.map(store => {
              if (store.latitude && store.longitude) {
                return (
                  <Marker 
                    key={store.id} 
                    position={[store.latitude, store.longitude]}
                  >
                    <Popup>
                      <div className="text-center">
                        <strong className="block text-lg mb-1">{store.name}</strong>
                        <span className="text-sm text-gray-600 block mb-2">{store.address}</span>
                        <a 
                          href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm hover:bg-blue-700 transition-colors w-full"
                        >
                          <Navigation className="w-3 h-3" /> Get Directions
                        </a>
                      </div>
                    </Popup>
                  </Marker>
                );
              }
              return null;
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default StoreLocator;