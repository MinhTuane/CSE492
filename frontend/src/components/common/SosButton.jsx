import { useState } from 'react';
import { PhoneCall, AlertTriangle, MapPin, X } from 'lucide-react';
import { sosService } from '../../services/sos.service';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';

const SosButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const { user } = useAuthStore();

  const handleSosSubmit = async (e) => {
    e.preventDefault();
    if (!phone) {
      toast.error('Please provide a phone number so we can contact you.');
      return;
    }

    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          await sosService.createRequest({
            userId: user?.id || null,
            phone: phone,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            description: description
          });
          toast.success('SOS Request sent! A rescue team will contact you shortly.', { duration: 5000 });
          setIsOpen(false);
          setPhone('');
          setDescription('');
        } catch {
          toast.error('Failed to send SOS request. Please call hotline directly: 1900-MOTO');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error('Unable to retrieve your location. Please allow location access or call 1900-MOTO.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 z-40 bg-red-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center hover:bg-red-700 transition-all hover:scale-110 animate-pulse-slow"
        title="SOS Rescue 24/7"
      >
        <AlertTriangle className="w-6 h-6" />
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in-up">
            <div className="bg-red-600 p-4 text-white flex justify-between items-center">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-6 h-6" />
                <h3 className="font-bold text-lg">24/7 Emergency Rescue</h3>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-red-700 p-1 rounded-full transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSosSubmit} className="p-6">
              <p className="text-gray-600 text-sm mb-6">
                If your motorcycle breaks down, flat tire, or any emergency, provide your phone number. We will use your device's GPS to locate and rescue you immediately.
              </p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <div className="relative">
                    <PhoneCall className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      required
                      className="input-field pl-10 w-full border-red-200 focus:border-red-500 focus:ring-red-500"
                      placeholder="09xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
                  <textarea
                    className="input-field w-full border-red-200 focus:border-red-500 focus:ring-red-500"
                    placeholder="E.g., Flat tire, engine won't start..."
                    rows="3"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  ></textarea>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-red-600/30 disabled:opacity-70"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <MapPin className="w-5 h-5" />
                      Send My Location & Request Rescue
                    </>
                  )}
                </button>
                <div className="text-center text-xs text-gray-500">
                  Or call hotline directly: <a href="tel:1900MOTO" className="font-bold text-red-600">1900-MOTO</a>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default SosButton;