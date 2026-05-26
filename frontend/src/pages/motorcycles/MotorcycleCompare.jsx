import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { X, Plus, ArrowRight, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { comparisonService } from '../../services/comparison.service';
import { motorcycleService } from '../../services/motorcycle.service';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const MotorcycleCompare = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [motorcycles, setMotorcycles] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [referenceMotorcycle, setReferenceMotorcycle] = useState(null);

  useEffect(() => {
    const ids = searchParams.get('ids');
    if (ids) {
      const idArray = ids.split(',');
      loadComparison(idArray);
    } else {
      setLoading(false);
    }
  }, [searchParams]);

  const loadComparison = async (ids) => {
    try {
      const [motorcyclesData] = await Promise.all([
        comparisonService.compare(ids),
      ]);
      setMotorcycles(motorcyclesData);
      if (motorcyclesData.length > 0) {
        setReferenceMotorcycle(motorcyclesData[0]);
      }
      
      if (ids.length > 0) {
        const alternativesData = await comparisonService.getAlternatives(ids, 4);
        setAlternatives(alternativesData);
      }
    } catch {
      toast.error('Failed to load comparison');
    } finally {
      setLoading(false);
    }
  };

  

  useEffect(() => {
    if (showAddDialog) {
      searchMotorcycles(currentPage);
    }
  }, [showAddDialog, searchQuery, currentPage]);

  const searchMotorcycles = async (page = 0) => {
    setSearching(true);
    try {
      const res = await motorcycleService.searchPaged({
        keyword: searchQuery,
      }, page, 10);
      
      const currentIds = motorcycles.map(m => m.id);
      let filteredResults = res.content.filter(m => !currentIds.includes(m.id));

      if (referenceMotorcycle) {
        filteredResults.sort((a, b) => {
          // Priority 1: Similar Price Range (within 10%)
          const priceRangeA = Math.abs(a.price - referenceMotorcycle.price) / referenceMotorcycle.price <= 0.1;
          const priceRangeB = Math.abs(b.price - referenceMotorcycle.price) / referenceMotorcycle.price <= 0.1;
          
          if (priceRangeA && !priceRangeB) return -1;
          if (!priceRangeA && priceRangeB) return 1;

          // Priority 2: Same Brand
          const sameBrandA = a.brand === referenceMotorcycle.brand;
          const sameBrandB = b.brand === referenceMotorcycle.brand;
          
          if (sameBrandA && !sameBrandB) return -1;
          if (!sameBrandA && sameBrandB) return 1;

          // Priority 3: Higher Segment (Price Descending)
          return b.price - a.price;
        });
      }

      setSearchResults(filteredResults);
      setTotalPages(res.totalPages);
    } catch (error) {
      console.error('Search failed', error);
    } finally {
      setSearching(false);
    }
  };

  const handleRemove = (motorcycleId) => {
    const newIds = motorcycles
      .filter((m) => m.id !== motorcycleId)
      .map((m) => m.id);
    
    if (newIds.length === 0) {
      navigate('/motorcycles/compare');
      setMotorcycles([]);
      setAlternatives([]);
    } else {
      setSearchParams({ ids: newIds.join(',') });
    }
  };

  const handleAdd = (motorcycle) => {
    const currentIds = motorcycles.map((m) => m.id);
    if (currentIds.includes(motorcycle.id)) {
      toast.error('This motorcycle is already in comparison');
      return;
    }
    if (currentIds.length >= 4) {
      toast.error('You can compare up to 4 motorcycles');
      return;
    }
    
    const newIds = [...currentIds, motorcycle.id];
    setSearchParams({ ids: newIds.join(',') });
    setShowAddDialog(false);
    setSearchQuery('');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="text-center py-12">Loading comparison...</div>
        </div>
      </div>
    );
  }

  if (motorcycles.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 animate-fade-in">
        <div className="container-custom">
          <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 animate-slide-in-up">Compare Motorcycles</h1>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl border border-white/50 animate-slide-in-up delay-100">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8 animate-float">
              <Plus className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">No motorcycles selected</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
              Select up to 4 motorcycles to compare their features side by side.
            </p>
            <Link to="/motorcycles" className="btn btn-primary inline-flex items-center gap-3 text-lg px-8 py-4 rounded-full hover:scale-105 transition-transform shadow-xl">
              Browse Motorcycles
              <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="container-custom">
        <h1 className="text-3xl font-bold mb-8">Compare Motorcycles</h1>

        {/* Comparison Table */}
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="p-4 text-left font-semibold text-gray-600">Feature</th>
                {motorcycles.map((motorcycle) => (
                  <th key={motorcycle.id} className="p-4 min-w-[250px]">
                    <div className="relative">
                      <button
                        onClick={() => handleRemove(motorcycle.id)}
                        className="absolute top-0 right-0 p-1 bg-white/80 hover:bg-white rounded-full shadow-sm z-10"
                      >
                        <X className="w-5 h-5 text-gray-600 hover:text-red-600" />
                      </button>
                      <img
                        src={getImageUrl(motorcycle.images?.[0])}
                        alt={motorcycle.model}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
                        }}
                        className="w-full h-40 object-cover rounded-lg mb-3 shadow-sm"
                      />
                      <h3 className="font-bold text-xl">{motorcycle.brand}</h3>
                      <p className="text-gray-600">{motorcycle.model}</p>
                    </div>
                  </th>
                ))}
                {motorcycles.length < 4 && (
                  <th className="p-4 min-w-[250px]">
                    <button
                      onClick={() => setShowAddDialog(true)}
                      className="w-full h-40 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-red-500 hover:bg-red-50 transition-all group"
                    >
                      <Plus className="w-10 h-10 text-gray-400 group-hover:text-red-500 mb-2" />
                      <span className="text-gray-500 group-hover:text-red-600 font-medium">Add Motorcycle</span>
                    </button>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Price</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">
                    {m.discountPercentage > 0 ? (
                      <div>
                        <span className="text-2xl font-bold text-red-600 block">
                          {formatCurrency(m.price * (1 - m.discountPercentage / 100))}
                        </span>
                        <span className="text-sm text-gray-400 line-through">
                          {formatCurrency(m.price)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-2xl font-bold text-red-600">
                        {formatCurrency(m.price)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Engine Type</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">{m.engineType || 'N/A'}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Displacement</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">{m.displacement ? `${m.displacement} cc` : 'N/A'}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Power</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">{m.power ? `${m.power} hp` : 'N/A'}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Top Speed</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">{m.topSpeed ? `${m.topSpeed} km/h` : 'N/A'}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Weight</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">{m.weight ? `${m.weight} kg` : 'N/A'}</td>
                ))}
              </tr>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-4 font-semibold text-gray-700">Action</td>
                {motorcycles.map((m) => (
                  <td key={m.id} className="p-4">
                    <Link to={`/motorcycles/${m.id}`} className="btn btn-primary w-full flex justify-center items-center">
                      View Details <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Alternatives */}
        {alternatives.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6">You Might Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {alternatives.map((motorcycle) => (
                <div key={motorcycle.id} className="card overflow-hidden group">
                  <div className="relative h-48">
                    <img
                      src={getImageUrl(motorcycle.images?.[0])}
                      alt={motorcycle.model}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-lg mb-1">{motorcycle.brand}</h3>
                    <p className="text-gray-600 mb-2">{motorcycle.model}</p>
                    <div className="mb-4">
                      {motorcycle.discountPercentage > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-xl font-bold text-red-600">
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
                        <span className="text-xl font-bold text-red-600">
                          {formatCurrency(motorcycle.price)}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleAdd(motorcycle)}
                      className="btn btn-outline w-full group-hover:bg-red-600 group-hover:text-white transition-colors"
                    >
                      Add to Compare
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Motorcycle Modal */}
      {showAddDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-scale-in">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-2xl font-bold text-gray-900">Add Motorcycle to Compare</h3>
              <button 
                onClick={() => setShowAddDialog(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6 border-b bg-gray-50">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by brand or model..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white shadow-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {searching ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {searchResults.map(motorcycle => (
                    <div 
                      key={motorcycle.id} 
                      className="flex items-center gap-4 p-3 border rounded-xl hover:border-red-500 hover:shadow-md transition-all cursor-pointer group bg-white"
                      onClick={() => handleAdd(motorcycle)}
                    >
                      <img 
                        src={getImageUrl(motorcycle.images?.[0])} 
                        alt={motorcycle.model}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
                        }}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-gray-900 truncate">{motorcycle.brand}</h4>
                        <p className="text-sm text-gray-500 truncate">{motorcycle.model}</p>
                        <p className="text-sm font-semibold text-red-600 mt-1">
                          {formatCurrency(motorcycle.price * (1 - (motorcycle.discountPercentage || 0) / 100))}
                        </p>
                      </div>
                      <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-red-500 group-hover:text-white transition-colors">
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <p>No motorcycles found matching "{searchQuery}"</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {!searching && totalPages > 1 && (
              <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                  disabled={currentPage === 0}
                  className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-medium text-gray-600">
                  Page {currentPage + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={currentPage === totalPages - 1}
                  className="p-2 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MotorcycleCompare;
