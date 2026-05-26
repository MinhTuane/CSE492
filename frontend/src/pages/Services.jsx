import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useState, lazy, Suspense } from 'react';
import { bookingService } from '../services/booking.service';
import { 
  Wrench, Calendar, Shield, Award, DollarSign, Clock,
  CheckCircle, Star, Users, PhoneCall, ShoppingBag,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { formatCurrency } from '../utils/helpers';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';

// Lazy load heavy components
const TradeInEstimator = lazy(() => import('../components/services/TradeInEstimator'));
const InsuranceQuote = lazy(() => import('../components/services/InsuranceQuote'));
const StoreLocatorWidget = lazy(() => import('../components/services/StoreLocatorWidget'));

const Services = () => {
  const services = [
    {
      icon: Wrench,
      title: 'Basic Oil Change',
      description: 'Standard engine oil replacement with premium synthetic oil and basic chain cleaning to keep your engine running smoothly.',
      badge: 'Under 30 Minutes',
      image: 'https://images.pexels.com/photos/3806249/pexels-photo-3806249.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 150000,
      features: [
        'Premium Synthetic Oil',
        'Chain Cleaning',
        'Tire Pressure Check',
        'Service Report'
      ],
      actions: ['Schedule Service', 'Pricing']
    },
    {
      icon: CheckCircle,
      title: 'General Inspection',
      description: 'A full diagnostic check including brakes, suspension, electrical systems, and fluid levels for your safety.',
      badge: 'Comprehensive Check',
      image: 'https://images.pexels.com/photos/1409050/pexels-photo-1409050.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 300000,
      features: [
        'Brake Inspection',
        'Suspension Check',
        'Electrical Diagnostics',
        'Chain Adjustment'
      ],
      actions: ['Schedule Service', 'Pricing']
    },
    {
      icon: Star,
      title: 'Premium Care & Wash',
      description: 'Includes general inspection plus detailed wash, polish, brake fluid replacement, and coolant top-off.',
      badge: 'Spa for your bike',
      image: 'https://images.pexels.com/photos/4006132/pexels-photo-4006132.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 1500000,
      features: [
        'General Inspection',
        'Detailed Wash & Wax',
        'Brake Fluid Replacement',
        'Coolant Flush'
      ],
      actions: ['Schedule Service', 'Pricing']
    },
    {
      icon: Shield,
      title: 'Brake Pad Replacement',
      description: 'Replacement of front and rear brake pads with high-quality materials and thorough caliper cleaning.',
      badge: 'Safety First',
      image: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 450000,
      features: [
        'Brake Pad Replacement',
        'Caliper Cleaning',
        'Brake Fluid Check',
        'Safety Test'
      ],
      actions: ['Schedule Service', 'Pricing']
    },
    {
      icon: Wrench,
      title: 'Tire Replacement',
      description: 'Professional tire mounting, dynamic balancing, and wheel alignment (Tire cost not included).',
      badge: 'Professional Tools',
      image: 'https://images.pexels.com/photos/159265/motorcycle-race-motorcycle-racing-track-159265.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 250000,
      features: [
        'Tire Mounting',
        'Wheel Balancing',
        'Alignment Check',
        'Valve Stem Check'
      ],
      actions: ['Schedule Service', 'Pricing']
    },
    {
      icon: Calendar,
      title: 'Test Ride Center',
      description: 'State-of-the-art test ride facility with professional track, safety equipment, and expert guidance.',
      badge: 'All Safety Gear Provided',
      image: 'https://images.pexels.com/photos/1715184/pexels-photo-1715184.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 0,
      features: [
        'Private test track',
        'All safety gear provided',
        'Professional ride coaching',
        'Multiple bike comparisons'
      ],
      actions: ['Book Now', 'Track Info']
    },
    {
      icon: Wrench,
      title: 'Customization & Accessories',
      description: 'Professional installation of aftermarket parts, performance tuning, and aesthetic modifications.',
      badge: 'Expert Mechanics',
      image: 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800',
      price: 500000,
      features: [
        'Exhaust Installation',
        'ECU Remapping',
        'Crash Pads & Sliders',
        'Custom Decals'
      ],
      actions: ['Schedule Service', 'Shop Accessories']
    }
  ];

  const [stats, setStats] = useState({
    scheduled: 0,
    technicianCount: 0,
    satisfactionRate: 0,
    motorcyclesServiced: 0
  });
  const [recentServices, setRecentServices] = useState([]);
  const navigate = useNavigate();
  const [showTrade, setShowTrade] = useState(false);
  const [showInsurance, setShowInsurance] = useState(false);
  const [serviceOfferings, setServiceOfferings] = useState([]);
  
  const handleAction = (service, action) => {
    const title = service.title;
    const act = action;

    if (title === 'Test Ride Center') {
      if (act === 'Book Now') {
        navigate('/my-bookings?open=testride');
      } else {
        const el = document.getElementById('process');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    if (act === 'Shop Accessories') {
      navigate('/accessories');
      return;
    }
    
    if (act === 'Schedule Service') {
      navigate('/my-bookings?open=service');
    } else {
      const el = document.getElementById('packages');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [s, recent, catalog] = await Promise.all([
          bookingService.getServiceStats(),
          bookingService.getRecentServices(6),
          bookingService.getServiceCatalog()
        ]);
        setStats({
          scheduled: s?.scheduled || 0,
          technicianCount: s?.technicianCount || 0,
          satisfactionRate: s?.satisfactionRate || 0,
          motorcyclesServiced: s?.motorcyclesServiced || 0
        });
        setRecentServices(recent || []);
        setServiceOfferings((catalog || []).filter(o => o.active));
      } catch {
        // ignore display fallback
      }
    };
    loadData();
  }, []);


  const serviceProcess = [
    {
      step: 1,
      title: 'Schedule Online',
      description: 'Book your service appointment online or call our service department. Choose your preferred date and time that works for you.'
    },
    {
      step: 2,
      title: 'Drop Off & Inspect',
      description: 'Bring your motorcycle to our facility. Our technicians perform a comprehensive inspection and provide detailed estimates.'
    },
    {
      step: 3,
      title: 'Expert Service',
      description: 'Our certified technicians perform the work using genuine parts and following manufacturer specifications to the letter.'
    },
    {
      step: 4,
      title: 'Quality Check',
      description: 'Every job undergoes rigorous quality control and testing to ensure perfect performance and safety before completion.'
    },
    {
      step: 5,
      title: 'Ready to Ride',
      description: 'Pick up your motorcycle with detailed service report and recommendations for future maintenance to keep you riding safely.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white py-20">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-block bg-green-500/20 text-green-400 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              Complete Motorcycle Solutions • Trusted by 15,000+ Riders
            </div>
            <h1 className="text-5xl font-bold mb-6">Professional Service & Support</h1>
            <p className="text-xl text-gray-300 mb-8">
              Everything you need to keep your motorcycle running at peak performance.
              Expert technicians, genuine parts, and guaranteed satisfaction.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-12">
              <div>
                <div className="text-4xl font-bold text-blue-400">{stats.scheduled}</div>
                <div className="text-gray-300">Scheduled Services</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400">{stats.technicianCount}</div>
                <div className="text-gray-300">Certified Technicians</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400">{stats.satisfactionRate}%</div>
                <div className="text-gray-300">Satisfaction</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-blue-400">{stats.motorcyclesServiced}</div>
                <div className="text-gray-300">Motorcycles Serviced</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Packages */}
      <section id="packages" className="py-16 bg-green-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Essential Service Packages</h2>
            <p className="text-xl text-gray-600">
              Choose the perfect service plan to keep your motorcycle running at peak performance
            </p>
            <div className="inline-block bg-orange-100 text-orange-700 px-6 py-2 rounded-full text-sm font-semibold mt-4">
              Limited Time Save Up to {formatCurrency(5000000)} on Annual Plans
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {serviceOfferings.slice(0, 3).map((pkg, index) => (
              <div
                key={index}
                className={`card p-8 ${index === 1 ? 'ring-2 ring-red-600 shadow-2xl scale-105' : ''}`}
              >
                {index === 1 && (
                  <div className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-semibold inline-block mb-4">
                    Most Popular
                  </div>
                )}
                
                <h3 className="text-2xl font-bold mb-2">{pkg.name}</h3>
                <p className="text-gray-600 mb-4 h-12">{pkg.subtitle}</p>
                
                <div className="mb-6">
                  <span className="text-4xl font-bold text-green-600">{formatCurrency(pkg.price)}</span>
                  <span className="text-gray-500 block text-sm mt-1">Per service visit</span>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {(pkg.features || []).map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={`/my-bookings?plan=${encodeURIComponent(pkg.name)}`}
                  className={index === 1 ? 'btn btn-primary w-full text-center' : 'btn btn-outline w-full text-center'}
                >
                  Select Package
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-gray-600">
              Comprehensive motorcycle solutions designed to keep you riding safely and confidently
            </p>
            <div className="inline-block bg-green-100 text-green-700 px-6 py-2 rounded-full text-sm font-semibold mt-4">
              Certified • Guaranteed • Trusted by Thousands
            </div>
          </div>

          <div className="relative px-16 md:px-28 max-w-[1500px] mx-auto">
            <Swiper
              modules={[Navigation, Autoplay]}
              spaceBetween={32}
              slidesPerView={1}
              loop={true}
              autoplay={{
                delay: 5000,
                disableOnInteraction: false,
              }}
              navigation={{
                prevEl: '.swiper-button-prev-custom',
                nextEl: '.swiper-button-next-custom',
              }}
              breakpoints={{
                768: {
                  slidesPerView: 2,
                  slidesPerGroup: 1,
                },
                1024: {
                  slidesPerView: 3,
                  slidesPerGroup: 1,
                },
              }}
              className="py-4 px-2"
            >
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <SwiperSlide key={index} className="h-auto flex">
                    <div className="card hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col group w-full h-full">
                      <div className="h-48 relative overflow-hidden">
                        <img 
                          src={service.image} 
                          alt={service.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center text-white shadow-lg">
                            <Icon className="w-5 h-5" />
                          </div>
                          <h3 className="text-xl font-bold text-white">{service.title}</h3>
                        </div>
                      </div>
                      
                      <div className="p-6 flex-1 flex flex-col">
                        <div className="flex justify-between items-start mb-3">
                          {service.badge ? (
                            <div className="inline-block bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold w-fit">
                              {service.badge}
                            </div>
                          ) : <div />}
                          
                          <div className="text-right">
                            <span className="text-lg font-bold text-red-600">
                              {service.price === 0 ? 'Free' : formatCurrency(service.price)}
                            </span>
                            {service.price > 0 && <span className="text-gray-500 text-xs block">Starting at</span>}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-4 text-sm flex-1">{service.description}</p>

                        <ul className="space-y-2 mb-6">
                          {service.features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-sm">
                              <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                              <span className="text-gray-700">{feature}</span>
                            </li>
                          ))}
                        </ul>

                        <div className="flex gap-2 mt-auto">
                          {service.actions.map((action, idx) => (
                            <button
                              key={idx}
                              className={idx === 0 ? 'btn btn-primary flex-1' : 'btn btn-outline flex-1'}
                              onClick={() => handleAction(service, action)}
                            >
                              {action}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </SwiperSlide>
                );
              })}
            </Swiper>

            {/* Custom Navigation Buttons */}
            <button className="swiper-button-prev-custom absolute left-0 md:left-4 top-1/2 -translate-y-1/2 z-10 w-16 md:w-20 h-24 md:h-32 flex items-center justify-center bg-yellow-100/30 hover:bg-yellow-200/80 text-yellow-800 shadow-[0_0_30px_rgba(250,204,21,0.2)] backdrop-blur-md border border-yellow-200/50 transition-all duration-500 opacity-50 hover:opacity-100 disabled:opacity-0" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}>
              <ChevronLeft className="w-10 h-10 md:w-14 md:h-14" />
            </button>
            <button className="swiper-button-next-custom absolute right-0 md:right-4 top-1/2 -translate-y-1/2 z-10 w-16 md:w-20 h-24 md:h-32 flex items-center justify-center bg-yellow-100/30 hover:bg-yellow-200/80 text-yellow-800 shadow-[0_0_30px_rgba(250,204,21,0.2)] backdrop-blur-md border border-yellow-200/50 transition-all duration-500 opacity-50 hover:opacity-100 disabled:opacity-0" style={{ borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%' }}>
              <ChevronRight className="w-10 h-10 md:w-14 md:h-14" />
            </button>
          </div>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Nearby Store</h2>
            <p className="text-xl text-gray-600">Find the nearest showroom and get directions</p>
          </div>
          <Suspense fallback={<div className="text-center py-8">Loading locator...</div>}>
            <StoreLocatorWidget onStoreFound={async (store) => {
              if (store && store.id) {
                try {
                  const offerings = await bookingService.getServiceCatalog(store.id);
                  setServiceOfferings((offerings || []).filter(o => o.active));
                } catch { void 0; }
              }
            }} />
          </Suspense>
        </div>
      </section>

      {/* Recent Services */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Recently Scheduled Services</h2>
            <p className="text-xl text-gray-600">
              Live snapshot of service bookings from our customers
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentServices.map((srv) => (
              <div key={srv.id} className="card p-6">
                <div className="font-bold mb-1">{srv.serviceType}</div>
                <div className="text-sm text-gray-700 mb-2">
                  {srv.motorcycle?.brand} {srv.motorcycle?.model}
                </div>
                <div className="text-sm text-gray-600">
                  Scheduled: {new Date(srv.scheduleDate).toLocaleString()}
                </div>
                {srv.cost && (
                  <div className="mt-2 text-sm font-semibold text-green-700">Cost: {formatCurrency(srv.cost)}</div>
                )}
              </div>
            ))}
            {recentServices.length === 0 && (
              <div className="text-center text-gray-600">No recent services found.</div>
            )}
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section id="process" className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-600">
              Simple, transparent, and hassle-free service process
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {serviceProcess.map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                  {process.step}
                </div>
                <h3 className="font-bold mb-2">{process.title}</h3>
                <p className="text-sm text-gray-600">{process.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-600 to-red-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-4xl font-bold mb-6">Don't Wait - Book Your Service Today</h2>
          <p className="text-xl mb-8 text-red-100 max-w-2xl mx-auto">
            Limited appointment slots available this month. Secure your motorcycle's peak performance 
            with our expert technicians and guaranteed satisfaction.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/my-bookings?open=service" className="btn bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-3">
              Schedule Service Now
            </Link>
            <button className="btn btn-outline border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-3 flex items-center gap-2">
              <PhoneCall className="w-5 h-5" />
              Call now: (500) 123-MOTO
            </button>
          </div>
        </div>
      </section>
      {showTrade && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl">Loading...</div></div>}>
          <TradeInEstimator onClose={() => setShowTrade(false)} />
        </Suspense>
      )}
      {showInsurance && (
        <Suspense fallback={<div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center"><div className="bg-white p-6 rounded-xl">Loading...</div></div>}>
          <InsuranceQuote onClose={() => setShowInsurance(false)} />
        </Suspense>
      )}
    </div>
  );
};

export default Services;
