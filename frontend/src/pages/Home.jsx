import { Link } from 'react-router-dom';
import { useEffect, useState, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Award, Shield, Users, Bike, ArrowRight, Play } from 'lucide-react';
import { motorcycleService } from '../services/motorcycle.service';
import { formatCurrency, cleanMotorcycleData, getImageUrl } from '../utils/helpers';
import toast from 'react-hot-toast';
import StoreLocator from '../components/common/StoreLocator';

// High-resolution premium hero slide configurations
const HERO_SLIDES = [
  {
    id: 'hero-1',
    brand: 'KAWASAKI',
    model: 'NINJA H2R',
    description: 'Supercharged hyperbike performance, pushing the limits of speed and track dominance.',
    image: '/api/images/hero/slide-1.png',
    link: '/motorcycles?search=H2R'
  },
  {
    id: 'hero-2',
    brand: 'DUCATI',
    model: 'PANIGALE V4',
    description: 'Pure racing adrenaline. Italian passion engineered for the ultimate track experience.',
    image: '/api/images/hero/slide-2.png',
    link: '/motorcycles?search=Panigale'
  },
  {
    id: 'hero-3',
    brand: 'BMW MOTORRAD',
    model: 'M 1000 RR',
    description: 'Born on the racetrack, optimized for the road. Uncompromising power and aerodynamics.',
    image: '/api/images/hero/slide-3.png',
    link: '/motorcycles?search=M1000R'
  },
  {
    id: 'hero-4',
    brand: 'YAMAHA',
    model: 'YZF-R1M',
    description: 'Ultimate factory superbike featuring MotoGP-derived crossplane engine technology.',
    image: '/api/images/hero/slide-4.png',
    link: '/motorcycles?search=R1'
  }
];

// Brand data for the scrolling strip
const BRANDS = [
  { name: 'HONDA', display: 'Honda' },
  { name: 'YAMAHA', display: 'Yamaha' },
  { name: 'KAWASAKI', display: 'Kawasaki' },
  { name: 'DUCATI', display: 'Ducati' },
  { name: 'BMW', display: 'BMW' },
  { name: 'SUZUKI', display: 'Suzuki' },
  { name: 'HARLEY-DAVIDSON', display: 'Harley-Davidson' },
];

// Image error handler
const handleImageError = (e) => {
  e.target.src = HERO_FALLBACKS[0];
  e.target.onerror = null;
};

// ─── Scroll Reveal Hook ───────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('revealed');
          observer.unobserve(el);
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

// ─── Parallax Hook ─────────────────────────────────────────────────
function useParallax(speed = 0.3) {
  const ref = useRef(null);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        if (ref.current) {
          const rect = ref.current.getBoundingClientRect();
          const offset = (window.innerHeight - rect.top) * speed;
          ref.current.style.transform = `translateY(${offset}px)`;
        }
        ticking = false;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}

// ─── Counter Animation Component ──────────────────────────────────
const AnimatedCounter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const startTime = performance.now();

          const animate = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // ease-out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * end));
            if (progress < 1) requestAnimationFrame(animate);
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
};


// ═══════════════════════════════════════════════════════════════════
// HOME COMPONENT
// ═══════════════════════════════════════════════════════════════════
const Home = () => {
  const [featuredMotorcycles, setFeaturedMotorcycles] = useState([]);
  const [heroMotorcycles, setHeroMotorcycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [slideKey, setSlideKey] = useState(0); // forces Ken Burns restart
  const slideInterval = useRef(null);

  // ─── Load Data ───────────────────────────────────────────────────
  useEffect(() => {
    loadMotorcycles();
  }, []);

  const loadMotorcycles = async () => {
    try {
      const data = await motorcycleService.searchPaged({ status: 'AVAILABLE' }, 0, 8, 'createAt,desc');
      const cleanData = cleanMotorcycleData(data.content || []);
      setFeaturedMotorcycles(cleanData);
      // Pick first 4 for hero slideshow
      setHeroMotorcycles(cleanData.slice(0, 4));
    } catch (error) {
      console.error('Failed to load motorcycles:', error);
      toast.error('Failed to load motorcycles');
      setFeaturedMotorcycles([]);
      setHeroMotorcycles([]);
    } finally {
      setLoading(false);
    }
  };

  // ─── Hero Slideshow Auto-rotate ──────────────────────────────────
  const totalSlides = HERO_SLIDES.length;

  const goToSlide = useCallback((index) => {
    setCurrentSlide(index);
    setSlideKey(prev => prev + 1);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % totalSlides);
  }, [currentSlide, totalSlides, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + totalSlides) % totalSlides);
  }, [currentSlide, totalSlides, goToSlide]);

  useEffect(() => {
    slideInterval.current = setInterval(nextSlide, 6000);
    return () => clearInterval(slideInterval.current);
  }, [nextSlide]);

  // Pause on hover
  const pauseSlideshow = () => clearInterval(slideInterval.current);
  const resumeSlideshow = () => {
    slideInterval.current = setInterval(nextSlide, 6000);
  };

  // ─── Reveal refs ─────────────────────────────────────────────────
  const revealBrands = useReveal();
  const revealCollection = useReveal();
  const revealCollectionGrid = useReveal();
  const revealStats = useReveal();
  const revealStoreTitle = useReveal();
  const revealCTA = useReveal();
  const parallaxImg = useParallax(0.15);

  // ─── Features data ──────────────────────────────────────────────
  const features = [
    { icon: Award, title: 'Premium Quality', desc: 'Only the finest motorcycles from world-renowned brands' },
    { icon: Shield, title: '3-Year Warranty', desc: 'Comprehensive warranty & roadside assistance' },
    { icon: Users, title: 'Expert Support', desc: '24/7 customer service and technical support' },
    { icon: Bike, title: 'Free Test Ride', desc: 'Try before you buy with our test ride program' },
  ];

  // ─── Stats data ─────────────────────────────────────────────────
  const stats = [
    { value: 500, suffix: '+', label: 'Motorcycles Sold' },
    { value: 7, suffix: '', label: 'Premium Brands' },
    { value: 4, suffix: '', label: 'Service Centers' },
    { value: 98, suffix: '%', label: 'Customer Satisfaction' },
  ];

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white">

      {/* ══════════════════════════════════════════════════════════════
          SECTION 1: FULLSCREEN HERO SLIDESHOW
          ══════════════════════════════════════════════════════════════ */}
      <section
        className="relative w-full h-screen overflow-hidden bg-black"
        onMouseEnter={pauseSlideshow}
        onMouseLeave={resumeSlideshow}
      >
        {/* Slides */}
        {HERO_SLIDES.map((slide, index) => {
          const imgUrl = getImageUrl(slide.image);
          return (
            <div
              key={`${slide.id}-${index === currentSlide ? slideKey : 'idle'}`}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                }`}
            >
              {/* Background Image with Ken Burns */}
              <img
                src={imgUrl}
                alt={`${slide.brand} ${slide.model}`}
                onError={handleImageError}
                className={`absolute inset-0 w-full h-full object-cover ${index === currentSlide ? 'hero-slide-img' : ''
                  }`}
                style={{ animationDuration: '10s' }}
              />

              {/* Dark overlay */}
              <div className="hero-overlay absolute inset-0 z-10" />
              <div className="hero-text-overlay absolute inset-0 z-10" />
            </div>
          );
        })}

        {/* Hero Content */}
        <div className="relative z-20 h-full flex items-end pb-24 md:pb-32">
          <div className="container-custom w-full">
            <div className="max-w-2xl">
              {/* Brand label */}
              <div
                className="inline-block mb-4 transition-all duration-700"
                key={`brand-${currentSlide}`}
              >
                <span className="text-red-500 font-semibold tracking-[0.3em] uppercase text-sm md:text-base animate-fade-in">
                  {HERO_SLIDES[currentSlide].brand}
                </span>
              </div>

              {/* Model name */}
              <h1
                className="text-4xl sm:text-5xl md:text-7xl font-bold text-white mb-4 leading-[1.1] animate-slide-in-up"
                key={`title-${currentSlide}`}
              >
                {HERO_SLIDES[currentSlide].model}
              </h1>

              {/* Description */}
              <p
                className="text-lg md:text-xl text-gray-300 mb-8 max-w-lg animate-slide-in-up delay-100"
                key={`desc-${currentSlide}`}
              >
                {HERO_SLIDES[currentSlide].description}
              </p>

              {/* Price + CTA */}
              <div className="flex flex-wrap items-center gap-4 animate-slide-in-up delay-200" key={`cta-${currentSlide}`}>
                <Link
                  to={HERO_SLIDES[currentSlide].link}
                  className="group inline-flex items-center gap-2 bg-white text-gray-900 font-semibold px-8 py-3.5 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Explore Collection
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/my-bookings?open=testride"
                  className="group inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-8 py-3.5 rounded-full hover:bg-white/10 hover:border-white transition-all duration-300"
                >
                  <Play className="w-4 h-4" />
                  Book Test Ride
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300 opacity-0 hover:opacity-100 group-hover:opacity-100"
          style={{ opacity: 0.4 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
          aria-label="Previous slide"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-black/30 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all duration-300"
          style={{ opacity: 0.4 }}
          onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
          onMouseLeave={(e) => e.currentTarget.style.opacity = 0.4}
          aria-label="Next slide"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Dot indicators */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToSlide(i)}
              className={`transition-all duration-500 rounded-full ${i === currentSlide
                  ? 'w-10 h-2.5 bg-red-500'
                  : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/70'
                }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          SECTION 2: BRAND SCROLL STRIP
          ══════════════════════════════════════════════════════════════ */}
      <section ref={revealBrands} className="reveal py-10 md:py-14 bg-gray-950 overflow-hidden border-b border-gray-800">
        <div className="flex whitespace-nowrap">
          <div className="brand-scroll-track flex items-center gap-16 md:gap-24 px-12">
            {/* Duplicate for seamless infinite scroll */}
            {[...BRANDS, ...BRANDS].map((brand, i) => (
              <Link
                key={`${brand.name}-${i}`}
                to={`/motorcycles?brand=${brand.name}`}
                className='text-2xl md:text-3xl font-bold text-gray-600 hover:text-white hover:scale-110 
              tracking-wider uppercase transition-all duration-300 cursor-pointer select-none inline-block'
              >
                {brand.display}
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          SECTION 3: FEATURES (WHY CHOOSE US)
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container-custom">
          <div ref={revealCollection} className="reveal text-center mb-16">
            <span className="text-red-600 font-semibold tracking-[0.2em] uppercase text-sm mb-3 block">
              Why Choose Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
              More Than Just Motorcycles
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              We deliver an experience — from your first test ride to years of ownership
            </p>
          </div>

          <div ref={revealCollectionGrid} className="reveal-stagger grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="group text-center p-8 rounded-2xl hover:-translate-y-2 transition-all duration-500 hover:shadow-2xl border border-gray-100 hover:border-red-100 bg-white"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-red-600 group-hover:to-red-700 transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-200">
                    <Icon className="w-7 h-7 text-red-600 group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          SECTION 4: THE COLLECTION — FEATURED MOTORCYCLES
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-gray-950 text-white">
        <div className="container-custom">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 gap-4">
            <div ref={useReveal()} className="reveal">
              <span className="text-red-500 font-semibold tracking-[0.2em] uppercase text-sm mb-3 block">
                Featured
              </span>
              <h2 className="text-3xl md:text-5xl font-bold">
                The Collection
              </h2>
            </div>
            <Link
              to="/motorcycles"
              className="group inline-flex items-center gap-2 text-gray-400 hover:text-white font-medium transition-colors"
            >
              View All
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Motorcycle Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-900 rounded-2xl h-80 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredMotorcycles.slice(0, 6).map((moto, index) => (
                <Link
                  key={moto.id}
                  to={`/motorcycles/${moto.id}`}
                  className="collection-card rounded-2xl group"
                  style={{ transitionDelay: `${index * 80}ms` }}
                >
                  <div className="relative h-80 md:h-96 rounded-2xl overflow-hidden bg-gray-900">
                    <img
                      src={getImageUrl(moto.images?.[0])}
                      alt={`${moto.brand} ${moto.model}`}
                      onError={handleImageError}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="card-overlay absolute inset-0 z-10" />

                    {/* Discount badge */}
                    {moto.discountPercentage > 0 && (
                      <span className="absolute top-4 right-4 z-20 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full">
                        -{moto.discountPercentage}%
                      </span>
                    )}

                    {/* Info */}
                    <div className="card-info absolute bottom-0 left-0 right-0 z-20 p-6">
                      <span className="text-red-400 font-semibold text-sm tracking-widest uppercase mb-1 block">
                        {moto.brand}
                      </span>
                      <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
                        {moto.model}
                      </h3>
                      <div className="flex items-center justify-between">
                        {moto.discountPercentage > 0 ? (
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-white">
                              {formatCurrency(moto.price * (1 - moto.discountPercentage / 100))}
                            </span>
                            <span className="text-sm text-gray-400 line-through">
                              {formatCurrency(moto.price)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xl font-bold text-white">
                            {formatCurrency(moto.price)}
                          </span>
                        )}
                        <span className="text-sm text-gray-400 group-hover:text-red-400 transition-colors flex items-center gap-1">
                          Details
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          SECTION 5: CINEMATIC STATS / PARALLAX
          ══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-gray-100">
        <div className="grid md:grid-cols-2 min-h-[600px]">
          {/* Left: Image with parallax */}
          <div className="relative overflow-hidden h-[400px] md:h-auto">
            <div ref={parallaxImg} className="absolute inset-[-20%]">
              <img
                src="/api/images/hero/parallax-showroom.png"
                alt="Motorcycle showroom"
                className="w-full h-full object-cover"
                onError={handleImageError}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-100 hidden md:block" />
            <div className="absolute inset-0 bg-gradient-to-t from-gray-100 to-transparent md:hidden" />
          </div>

          {/* Right: Stats & text */}
          <div ref={revealStats} className="reveal flex items-center px-8 md:px-16 py-16 md:py-24">
            <div>
              <span className="text-red-600 font-semibold tracking-[0.2em] uppercase text-sm mb-3 block">
                Our Legacy
              </span>
              <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                Trusted by Riders
                <span className="block text-red-600">Across Vietnam</span>
              </h2>
              <p className="text-gray-500 text-lg mb-12 max-w-md leading-relaxed">
                From Saigon to Hanoi, MBServices has been the destination for motorcycle enthusiasts who demand the best.
              </p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-8">
                {stats.map((stat, i) => (
                  <div key={i} className="group">
                    <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                      <AnimatedCounter end={stat.value} suffix={stat.suffix} duration={2000} />
                    </div>
                    <div className="text-sm text-gray-500 font-medium uppercase tracking-wider">
                      {stat.label}
                    </div>
                    <div className="w-8 h-0.5 bg-red-600 mt-3 group-hover:w-16 transition-all duration-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          SECTION 6: STORE LOCATOR
          ══════════════════════════════════════════════════════════════ */}
      <section className="py-20 md:py-28 bg-white">
        <div className="container-custom">
          <div ref={revealStoreTitle} className="reveal text-center mb-12">
            <span className="text-red-600 font-semibold tracking-[0.2em] uppercase text-sm mb-3 block">
              Find Us
            </span>
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Our Branches</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Locate the nearest MBServices branch to view our motorcycles in person, book a test ride, or get your bike serviced.
            </p>
          </div>
          <StoreLocator />
        </div>
      </section>


      {/* ══════════════════════════════════════════════════════════════
          SECTION 7: CTA
          ══════════════════════════════════════════════════════════════ */}
      <section ref={revealCTA} className="reveal animated-gradient py-24 md:py-32 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Start
            <span className="block">Your Journey?</span>
          </h2>
          <p className="text-xl mb-10 text-red-100/80 max-w-2xl mx-auto">
            Join thousands of satisfied riders who chose MBServices for their dream motorcycle.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link
              to="/register"
              className="group inline-flex items-center gap-2 bg-white text-red-700 font-bold px-10 py-4 rounded-full hover:bg-gray-100 transition-all duration-300 shadow-lg text-lg"
            >
              Get Started
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center gap-2 border-2 border-white/40 text-white font-semibold px-10 py-4 rounded-full hover:bg-white/10 hover:border-white transition-all duration-300 text-lg"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
