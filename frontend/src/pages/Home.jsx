import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ChevronRight, Star, Bike, Award, Users, Shield } from 'lucide-react';
import { motorcycleService } from '../services/motorcycle.service';
import { formatCurrency, cleanMotorcycleData, getImageUrl } from '../utils/helpers';
import toast from 'react-hot-toast';
import StoreLocator from '../components/common/StoreLocator';

// Image error handler
const handleImageError = (e) => {
  e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  e.target.onerror = null;
};

const Home = () => {
  const [featuredMotorcycles, setFeaturedMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeaturedMotorcycles();
  }, []);

  const loadFeaturedMotorcycles = async () => {
    try {
      // Use the paged API instead of the old getAvailable
      const data = await motorcycleService.searchPaged({ status: 'AVAILABLE' }, 0, 6, 'createAt,desc');
      
      // Use the helper function to clean data
      const cleanData = cleanMotorcycleData(data.content || []);
      
      setFeaturedMotorcycles(cleanData);
    } catch (error) {
      console.error('Failed to load motorcycles:', error);
      toast.error('Failed to load motorcycles');
      setFeaturedMotorcycles([]);  
    } finally {
      setLoading(false);
    }
  };

  const features = [
    {
      icon: Award,
      title: 'Premium Quality',
      description: 'Only the finest motorcycles from top brands',
    },
    {
      icon: Shield,
      title: 'Warranty Protection',
      description: 'Comprehensive warranty on all purchases',
    },
    {
      icon: Users,
      title: 'Expert Support',
      description: '24/7 customer service and technical support',
    },
    {
      icon: Bike,
      title: 'Test Rides',
      description: 'Try before you buy with our test ride program',
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 text-white">
        <div className="container-custom py-24 md:py-32 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="animate-slide-in-up">
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                Ride Into
                <span className="block text-red-500">Your Dreams</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                Discover premium motorcycles from world-renowned brands. 
                Experience the thrill, embrace the freedom.
              </p>
              <div className="flex flex-wrap gap-4 mt-8">
                <Link to="/motorcycles" className="btn btn-primary text-lg px-8 py-3 shadow-lg hover:-translate-y-1 transition-all">
                  Browse Collection
                  <ChevronRight className="inline ml-2 w-5 h-5" />
                </Link>
                <Link to="/my-bookings?open=testride" className="btn bg-white text-gray-900 hover:bg-gray-100 text-lg px-8 py-3 shadow-lg hover:-translate-y-1 transition-all">
                  Book Test Ride
                </Link>
              </div>
            </div>
            <div className="hidden md:block animate-float">
              <img
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800"
                alt="Motorcycle"
                className="rounded-2xl shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
        
        {/* Wave SVG */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none z-0">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M0 0L60 10C120 20 240 40 360 45C480 50 600 40 720 35C840 30 960 30 1080 35C1200 40 1320 50 1380 55L1440 60V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container-custom">
          <div className="text-center mb-16 animate-slide-in-up">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Us</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              We deliver more than just motorcycles. We deliver an experience.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className={`group text-center p-6 rounded-xl hover:-translate-y-2 transition-all duration-300 hover:shadow-2xl border border-gray-100 delay-${index * 100}`}
                >
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-red-600 transition-colors duration-300">
                    <Icon className="w-8 h-8 text-red-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Motorcycles Section */}
      <section className="py-16 bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Featured Motorcycles
            </h2>
            <p className="text-gray-600 text-lg">
              Handpicked selection of our premium motorcycles
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="card p-6 animate-pulse">
                  <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-300 h-6 rounded mb-2"></div>
                  <div className="bg-gray-300 h-4 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredMotorcycles.map((motorcycle) => (
                <Link
                  key={motorcycle.id}
                  to={`/motorcycles/${motorcycle.id}`}
                  className="card overflow-hidden group"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(motorcycle.images?.[0])}
                      alt={`${motorcycle.brand} ${motorcycle.model}`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={handleImageError}
                    />
                    {motorcycle.status === 'AVAILABLE' && (
                      <span className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        Available
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-red-600 uppercase">
                        {motorcycle.brand}
                      </span>
                      {motorcycle.averageRating > 0 && (
                        <div className="flex items-center space-x-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-semibold">
                            {motorcycle.averageRating.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-red-600 transition-colors">
                      {motorcycle.model}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {motorcycle.description}
                    </p>
                    <div className="flex items-center justify-between">
                      {motorcycle.discountPercentage > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-2xl font-bold text-red-600">
                            {formatCurrency(motorcycle.price * (1 - motorcycle.discountPercentage / 100))}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(motorcycle.price)}
                            </span>
                            <span className="text-xs font-bold text-white bg-red-500 px-2 py-0.5 rounded">
                              -{motorcycle.discountPercentage}%
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-2xl font-bold text-gray-900">
                          {formatCurrency(motorcycle.price)}
                        </span>
                      )}
                      <span className="text-sm text-red-600 font-semibold group-hover:underline">
                        View Details →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/motorcycles" className="btn btn-primary text-lg px-8 py-3">
              View All Motorcycles
              <ChevronRight className="inline ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Store Locator Section */}
      <section className="py-16 bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Find Our Branches</h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Locate the nearest MBServices branch to view our motorcycles in person, book a test ride, or get your bike serviced.
            </p>
          </div>
          <StoreLocator />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-red-600 to-red-800 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl mb-8 text-red-100 max-w-2xl mx-auto">
            Join thousands of satisfied riders who chose MotoBikes for their dream motorcycle.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/register" className="btn bg-white text-red-600 hover:bg-gray-100 text-lg px-8 py-3">
              Get Started
            </Link>
            <Link to="/contact" className="btn btn-outline border-white text-white hover:bg-white hover:text-red-600 text-lg px-8 py-3">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
