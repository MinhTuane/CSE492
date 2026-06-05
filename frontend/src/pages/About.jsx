import { Award, ShieldCheck, Heart, Clock, MapPin, Users, ChevronRight, CheckCircle2 } from 'lucide-react';
import { getImageUrl } from '../utils/helpers';

const About = () => {
  const stats = [
    { label: 'Happy Riders', value: '50K+' },
    { label: 'Premium Models', value: '150+' },
    { label: 'Authorized Branches', value: '12+' },
    { label: 'Expert Mechanics', value: '80+' }
  ];

  const values = [
    {
      icon: <Award className="w-8 h-8 text-red-600" />,
      title: 'Uncompromised Quality',
      description: 'We curate only the finest motorcycles and genuine accessories, ensuring every product meets rigorous performance and safety standards.'
    },
    {
      icon: <Heart className="w-8 h-8 text-red-600" />,
      title: 'Riding Passion',
      description: 'We are riders ourselves. Every service, advice, and event we host is driven by our pure love for the open road and motorcycle culture.'
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-red-600" />,
      title: 'Customer-First Safety',
      description: 'Your safety is our top priority. We offer detailed test rides, transparent financing, and premium certified maintenance services.'
    },
    {
      icon: <Clock className="w-8 h-8 text-red-600" />,
      title: '24/7 Dedicated Support',
      description: 'From roadside assistance to professional online consulting, our expert support network is always here for you, whenever you ride.'
    }
  ];

  const milestones = [
    { year: '2020', title: 'The Starting Line', desc: 'MotoMarket was born with a small showroom in Ho Chi Minh City, driven by a vision to revolutionize the premium riding experience.' },
    { year: '2022', title: 'Nationwide Expansion', desc: 'Opened major authorized dealerships in Hanoi and Da Nang, introducing premium brands like Kawasaki, Suzuki, and BMW Motorrad.' },
    { year: '2024', title: 'Digital Transformation', desc: 'Launched the integrated booking, financing, and maintenance system, allowing riders to manage their bikes on the web and mobile app.' },
    { year: '2026', title: 'The Future of Riding', desc: 'Leading the green transition with electric premium bikes and establishing the largest superbike community across Southeast Asia.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      {/* Hero Banner Section */}
      <div className="relative bg-gray-900 text-white py-24 md:py-32 overflow-hidden mb-16">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.pexels.com/photos/1413412/pexels-photo-1413412.jpeg?auto=compress&cs=tinysrgb&w=1600"
            alt="Motorcycle on Road"
            className="w-full h-full object-cover opacity-30 object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent"></div>
        </div>

        <div className="container-custom relative z-10 px-4">
          <div className="max-w-2xl animate-fade-in">
            <span className="text-red-500 font-bold uppercase tracking-wider text-sm">About MotoMarket</span>
            <h1 className="text-4xl md:text-6xl font-black mt-2 mb-6 leading-tight">
              Ride Into <span className="text-red-600">Your Dreams</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 font-light leading-relaxed">
              We are Vietnam's premier authorized dealership network, dedicated to connecting passionate riders with legendary superbikes and exceptional service.
            </p>
          </div>
        </div>
      </div>

      <div className="container-custom px-4 space-y-20">
        {/* Our Story Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="inline-block bg-red-100 text-red-600 px-3 py-1 rounded-full text-xs font-bold uppercase">
              Our Journey
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight">
              Crafting Unforgettable <span className="text-red-600">Riding Experiences</span>
            </h2>
            <p className="text-gray-600 leading-relaxed">
              Founded in 2020, MotoMarket has quickly risen to become the benchmark of premium motorcycle retail in Vietnam. We believe that a motorcycle is more than a vehicle — it is an extension of your spirit, a statement of freedom, and a gateway to adventure.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Our state-of-the-art showrooms offer a curated world-class collection of superbikes, cruisers, adventure tourers, and naked sport bikes from global giants. Backed by certified technicians and a community of avid riders, we walk with you through every mile of your journey.
            </p>
            <div className="flex gap-4 pt-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-semibold text-gray-800 text-sm">100% Genuine Brands</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                <span className="font-semibold text-gray-800 text-sm">Certified Master Techs</span>
              </div>
            </div>
          </div>
          <div className="relative">
            <img
              src="https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Premium Superbike"
              className="w-full h-[400px] object-cover rounded-2xl shadow-2xl border border-gray-100"
            />
            <div className="absolute -bottom-6 -left-6 bg-red-600 text-white p-6 rounded-2xl shadow-xl hidden md:block">
              <p className="text-4xl font-black">6+</p>
              <p className="text-sm uppercase tracking-wider font-bold">Years of Excellence</p>
            </div>
          </div>
        </section>

        {/* Stats Counter Section */}
        <section className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border border-gray-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center divide-y lg:divide-y-0 lg:divide-x divide-gray-100">
            {stats.map((stat, idx) => (
              <div key={idx} className={`pt-6 lg:pt-0 ${idx === 0 ? 'pt-0' : ''}`}>
                <p className="text-4xl md:text-5xl font-black text-red-600 mb-2">{stat.value}</p>
                <p className="text-sm md:text-base text-gray-500 font-medium uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Core Values Section */}
        <section className="space-y-12">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-red-600 font-bold uppercase tracking-wider text-xs">Our Foundation</span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">What Drives MotoMarket</h2>
            <p className="text-gray-500 text-sm mt-3 leading-relaxed">
              We guide our operations and community by a firm set of principles that place the rider and their passion above everything else.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((val, idx) => (
              <div key={idx} className="bg-white hover:bg-red-50/20 hover:border-red-200 transition-all p-8 rounded-2xl border border-gray-200 shadow-md group flex gap-6">
                <div className="p-3 bg-red-50 rounded-xl group-hover:bg-red-100 transition-colors h-fit flex-shrink-0">
                  {val.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{val.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{val.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Timeline / Milestones Section */}
        <section className="space-y-12 bg-white p-8 md:p-12 rounded-3xl border border-gray-100 shadow-xl">
          <div className="text-center max-w-xl mx-auto">;
            <span className="text-red-600 font-bold uppercase tracking-wider text-xs font-bold">History</span>
            <h2 className="text-3xl font-black text-gray-900 mt-2">Our Key Milestones</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {milestones.map((mile, idx) => (
              <div key={idx} className="relative bg-gray-50 p-6 rounded-xl hover:shadow-lg transition-all border border-gray-200">
                <div className="absolute -top-4 left-6 bg-red-600 text-white font-extrabold text-sm py-1 px-3 rounded-full shadow-md">
                  {mile.year}
                </div>
                <h3 className="font-extrabold text-gray-900 mt-2 mb-2 text-lg">{mile.title}</h3>
                <p className="text-gray-600 text-xs leading-relaxed">{mile.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="bg-gradient-to-r from-red-600 to-red-800 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="max-w-xl text-center md:text-left space-y-3">
            <h3 className="text-2xl md:text-3xl font-black">Ready to Ride With Us?</h3>
            <p className="text-red-100 font-light text-sm md:text-base leading-relaxed">
              Explore our premium motorcycle collection, book an adrenaline-pumping test ride, or locate your nearest branch to experience our hospitality.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <button
              onClick={() => window.location.href = '/motorcycles'}
              className="btn bg-white text-red-600 hover:bg-gray-100 font-extrabold px-8 py-3 rounded-xl transition-all shadow-lg text-center"
            >
              Browse Motorcycles
            </button>
            <button
              onClick={() => window.location.href = '/my-bookings?open=testride'}
              className="btn border border-white hover:bg-white/10 font-extrabold px-8 py-3 rounded-xl transition-all text-center"
            >
              Book Test Ride
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;
