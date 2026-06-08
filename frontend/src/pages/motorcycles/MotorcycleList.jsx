import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Filter, Star, ChevronDown, Check, ChevronLeft, ChevronRight, Heart } from 'lucide-react';
import { motorcycleService } from '../../services/motorcycle.service';
import { formatCurrency, cleanMotorcycleData, getImageUrl } from '../../utils/helpers';
import useCartStore from '../../store/cartStore';
import useWishlistStore from '../../store/wishlistStore';
import toast from 'react-hot-toast';

const handleImageError = (e) => {
  e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  e.target.onerror = null;
};

const MotorcycleList = () => {
  const [motorcycles, setMotorcycles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchParams] = useSearchParams();

  const brandFromUrl = searchParams.get('brand') || '';

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [filters, setFilters] = useState({
    search: '',
    brand: brandFromUrl,
    category: '',
    minPrice: '',
    maxPrice: '',
    sortBy: 'best-deal',
  });

  const { addItem } = useCartStore();
  const { items: wishlistItems, addItem: addToWishlist, removeItem: removeFromWishlist, isInWishlist } = useWishlistStore();

  const toggleWishlist = (e, motorcycle) => {
    e.preventDefault();
    e.stopPropagation();
    if (isInWishlist(motorcycle.id)) {
      removeFromWishlist(motorcycle.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(motorcycle);
      toast.success('Added to wishlist');
    }
  };

  // Brand configurations with colors
  const brandConfig = {
    'YAMAHA': { color: 'text-blue-600', borderColor: 'border-t-blue-600', bgColor: 'bg-blue-50' },
    'HONDA': { color: 'text-red-600', borderColor: 'border-t-red-600', bgColor: 'bg-red-50' },
    'KAWASAKI': { color: 'text-green-600', borderColor: 'border-t-green-600', bgColor: 'bg-green-50' },
    'BMW': { color: 'text-blue-500', borderColor: 'border-t-blue-500', bgColor: 'bg-blue-50' },
    'DUCATI': { color: 'text-red-700', borderColor: 'border-t-red-700', bgColor: 'bg-red-50' },
    'HARLEY-DAVIDSON': { color: 'text-orange-600', borderColor: 'border-t-orange-600', bgColor: 'bg-orange-50' },
    'SUZUKI': { color: 'text-blue-700', borderColor: 'border-t-blue-700', bgColor: 'bg-blue-50' },
    'TRIUMPH': { color: 'text-gray-700', borderColor: 'border-t-gray-700', bgColor: 'bg-gray-50' },
    'KTM': { color: 'text-orange-500', borderColor: 'border-t-orange-500', bgColor: 'bg-orange-50' },
    'ROYAL ENFIELD': { color: 'text-purple-600', borderColor: 'border-t-purple-600', bgColor: 'bg-purple-50' },
  };

  const fetchMotorcycles = useCallback(async () => {
    try {
      setLoading(true);
      let sortParam = 'discountPercentage,desc';
      if (filters.sortBy === 'newest') sortParam = 'createAt,desc';
      if (filters.sortBy === 'price-low') sortParam = 'price,asc';
      if (filters.sortBy === 'price-high') sortParam = 'price,desc';
      if (filters.sortBy === 'rating') sortParam = 'averageRating,desc';

      const response = await motorcycleService.searchPaged(
        {
          brand: filters.brand || undefined,
          category: filters.category || undefined,
          minPrice: filters.minPrice || undefined,
          maxPrice: filters.maxPrice || undefined,
          status: 'AVAILABLE',
          keyword: filters.search || undefined
        },
        currentPage - 1,
        itemsPerPage,
        sortParam
      );

      let fetchedMotorcycles = response.content || [];
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);

      setMotorcycles(cleanMotorcycleData(fetchedMotorcycles));
    } catch (error) {
      console.error('Error fetching motorcycles:', error);
      toast.error('Failed to load motorcycles');
      setMotorcycles([]);
    } finally {
      setLoading(false);
    }
  }, [filters, currentPage]);

  const loadInitialData = async () => {
    try {
      const [brandsData, categoriesData] = await Promise.all([
        motorcycleService.getBrands(),
        motorcycleService.getCategories(),
      ]);
      setBrands(brandsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    fetchMotorcycles();
  }, [fetchMotorcycles]);

  useEffect(() => {
    const brand = searchParams.get('brand') || '';
    setFilters(prev => ({ ...prev, brand: brand }));
    setCurrentPage(1);
  }, [searchParams]);

  const handleFilterChange = (key, value) => {
    setFilters({ ...filters, [key]: value });
    setCurrentPage(1);
  };

  const handleBrandClick = (brand) => {
    setFilters({ ...filters, brand: filters.brand === brand ? '' : brand });
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      brand: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      sortBy: 'best-deal',
    });
    setCurrentPage(1);
  };

  const handleAddToCart = (motorcycle) => {
    addItem(motorcycle);
    toast.success('Added to cart!');
  };

  const getDisplayName = (brand) => {
    return brand === 'HARLEY-DAVIDSON' ? 'HARLEY' : brand;
  };

  // Pagination calculations
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMotorcycles = motorcycles;

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      <div className="container-custom py-8 animate-fade-in">
        {/* Header */}
        <div className="text-center mb-12 animate-slide-in-up">
          <h1 className="text-5xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-blue-600">Authorized Premium Dealers</h1>
          <p className="text-gray-600 text-lg mb-6 max-w-2xl mx-auto">
            Official partnerships with the world's most trusted motorcycle manufacturers
          </p>
          <div className="inline-block bg-white/60 backdrop-blur-md border border-green-300 rounded-full px-6 py-2 shadow-sm animate-float">
            <span className="text-green-700 font-semibold flex items-center gap-2">
              <Check className="w-5 h-5" />
              Authorized Dealer Status • Factory Warranties • Genuine Parts
            </span>
          </div>
        </div>

        {/* Brand Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12 animate-slide-in-up delay-100">
          {brands.map((brand) => {
            const config = brandConfig[brand] || {
              color: 'text-gray-700',
              borderColor: 'border-t-gray-400',
              bgColor: 'bg-gray-50'
            };
            const isSelected = filters.brand === brand;

            return (
              <button
                key={brand}
                onClick={() => handleBrandClick(brand)}
                className={`
                  relative bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300
                  border-t-4 ${config.borderColor} p-6 text-center group
                  ${isSelected ? 'ring-4 ring-offset-2 ring-green-400 transform scale-105' : ''}
                `}
              >
                <div className={`
                  absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity
                  ${config.bgColor}
                `}></div>

                <h3 className={`text-2xl font-bold mb-2 ${config.color} relative z-10`}>
                  {getDisplayName(brand)}
                </h3>
                <p className="text-gray-600 text-sm mb-4 relative z-10">
                  Explore models
                </p>
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-1 rounded-full text-sm font-semibold relative z-10">
                  <Check className="w-4 h-4" />
                  Certified Dealer
                </div>

                {isSelected && (
                  <div className="absolute top-4 right-4 bg-green-500 text-white rounded-full p-1">
                    <Check className="w-4 h-4" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Search and Sort Bar */}
        <div className="card p-4 mb-6 bg-white/80 backdrop-blur-md border border-white/40 animate-slide-in-up delay-200">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search motorcycles..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="input pl-10 w-full"
              />
            </div>

            {/* Sort */}
            <div className="relative">
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="input pr-10 appearance-none cursor-pointer"
              >
                <option value="best-deal">Best Deals</option>
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline flex items-center gap-2"
            >
              <Filter className="w-5 h-5" />
              More Filters
            </button>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="input"
                  >
                    <option value="">All Categories</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Min Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Min Price
                  </label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.minPrice}
                    onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    className="input"
                  />
                </div>

                {/* Max Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Price
                  </label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <button onClick={clearFilters} className="btn btn-secondary mt-4">
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-6 flex justify-between items-center">
          <p className="text-gray-600">
            Showing <span className="font-bold text-gray-900">{totalElements > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, totalElements)}</span> of{' '}
            <span className="font-bold text-gray-900">{totalElements}</span> motorcycles
            {filters.brand && (
              <span className="ml-2 inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                <Check className="w-4 h-4" />
                {filters.brand}
              </span>
            )}
          </p>

          {totalPages > 1 && (
            <p className="text-gray-600">
              Page <span className="font-bold text-gray-900">{currentPage}</span> of <span className="font-bold text-gray-900">{totalPages}</span>
            </p>
          )}
        </div>

        {/* Motorcycles Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="card p-6 animate-pulse">
                <div className="bg-gray-300 h-48 rounded-lg mb-4"></div>
                <div className="bg-gray-300 h-6 rounded mb-2"></div>
                <div className="bg-gray-300 h-4 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        ) : motorcycles.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-lg">
            <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">No motorcycles found</h3>
            <p className="text-gray-500 text-lg mb-6">
              Try adjusting your filters or search terms
            </p>
            <button onClick={clearFilters} className="btn btn-primary">
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {currentMotorcycles.map((motorcycle, index) => {
                const brandColors = brandConfig[motorcycle.brand] || { color: 'text-gray-700' };
                const animationDelay = `delay-${(index % 3) * 100 + 100}`;

                return (
                  <div key={motorcycle.id} className={`card overflow-hidden group hover:shadow-2xl transition-all duration-300 animate-slide-in-up ${animationDelay}`}>
                    <Link to={`/motorcycles/${motorcycle.id}`}>
                      <div className="relative h-56 overflow-hidden bg-gray-100">
                        <img
                          src={getImageUrl(motorcycle.images?.[0])}
                          alt={`${motorcycle.brand} ${motorcycle.model}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                          onError={handleImageError}
                        />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <span className="absolute top-4 left-4 bg-green-500/90 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                          Available
                        </span>
                        <button
                          onClick={(e) => toggleWishlist(e, motorcycle)}
                          className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                        >
                          <Heart
                            className={`w-5 h-5 transition-colors ${isInWishlist(motorcycle.id)
                                ? 'fill-red-500 text-red-500'
                                : 'text-gray-400 hover:text-red-500'
                              }`}
                          />
                        </button>
                      </div>
                    </Link>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold uppercase ${brandColors.color}`}>
                          {motorcycle.brand}
                        </span>
                        {motorcycle.averageRating > 0 && (
                          <div className="flex items-center space-x-1 bg-yellow-50 px-2 py-1 rounded-full">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-semibold text-yellow-700">
                              {motorcycle.averageRating.toFixed(1)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Link to={`/motorcycles/${motorcycle.id}`}>
                        <h3 className="text-xl font-bold mb-2 group-hover:text-red-600 transition-colors line-clamp-1">
                          {motorcycle.model}
                        </h3>
                      </Link>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2 h-10">
                        {motorcycle.description || 'Premium motorcycle with exceptional performance'}
                      </p>

                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-col">
                          {motorcycle.discountPercentage > 0 ? (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                {formatCurrency(motorcycle.price)}
                              </span>
                              <span className="text-2xl font-bold text-red-600 flex items-center gap-2">
                                {formatCurrency(motorcycle.price * (1 - motorcycle.discountPercentage / 100))}
                                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                  -{motorcycle.discountPercentage}%
                                </span>
                              </span>
                            </>
                          ) : (
                            <span className="text-2xl font-bold text-gray-900">
                              {formatCurrency(motorcycle.price)}
                            </span>
                          )}
                        </div>
                        {motorcycle.stock > 0 && (
                          <span className="text-sm text-green-600 font-semibold bg-green-50 px-2 py-1 rounded h-fit">
                            {motorcycle.stock} in stock
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <Link
                          to={`/motorcycles/${motorcycle.id}`}
                          className="btn btn-outline flex-1 text-sm"
                        >
                          View Details
                        </Link>
                        <button
                          onClick={() => handleAddToCart(motorcycle)}
                          className="btn btn-primary flex-1 text-sm"
                        >
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                  className={`btn ${currentPage === 1 ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-outline'} flex items-center gap-2`}
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="flex gap-2">
                  {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                      <span key={`ellipsis-${index}`} className="px-4 py-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => goToPage(page)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${currentPage === page
                            ? 'bg-red-600 text-white'
                            : 'bg-white text-gray-700 hover:bg-gray-100'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  ))}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`btn ${currentPage === totalPages ? 'btn-secondary opacity-50 cursor-not-allowed' : 'btn-outline'} flex items-center gap-2`}
                >
                  Next
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MotorcycleList;
