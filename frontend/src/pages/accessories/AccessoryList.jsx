import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { accessoryService } from '../../services/accessory.service';
import useCartStore from '../../store/cartStore';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';
import { ShoppingCart, Filter, Search } from 'lucide-react';

const AccessoryList = () => {
  const [accessories, setAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedAccessory, setSelectedAccessory] = useState(null);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchAccessories = async () => {
      try {
        setLoading(true);
        const data = await accessoryService.searchPaged(keyword, page, 12);
        setAccessories(data.content);
        setTotalPages(data.totalPages);
      } catch (error) {
        toast.error('Failed to load accessories');
      } finally {
        setLoading(false);
      }
    };
    fetchAccessories();
  }, [keyword, page]);

  const handleAddToCart = (accessory) => {
    // Adapt accessory to match cart expectations
    const cartItem = {
      ...accessory,
      itemType: 'accessory',
      images: [accessory.imageUrl]
    };
    addItem(cartItem);
    toast.success(`${accessory.name} added to cart`);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 md:mb-0">
            Parts & Accessories
          </h1>
          <div className="relative w-full md:w-96">
            <input
              type="text"
              placeholder="Search by name, brand, category..."
              className="input-field pl-10 w-full"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(0);
              }}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {accessories.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setSelectedAccessory(item)}
                  className="card hover:shadow-xl cursor-pointer transition-all duration-300 group flex flex-col h-full bg-white overflow-hidden"
                >
                  <div className="relative h-56 overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(item.imageUrl)}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      onError={(e) => {
                        e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                      {item.category}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1 font-semibold">
                      {item.brand}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {item.compatibleBikes && (
                      <div className="text-[11px] text-gray-500 bg-gray-50 border border-gray-100 rounded-lg p-2 mb-4">
                        <span className="font-semibold text-gray-700">Compatible with: </span>
                        {item.compatibleBikes}
                      </div>
                    )}
                    
                    <div className="flex items-end justify-between mt-auto">
                      <div>
                        <span className="text-xl font-extrabold text-red-600">
                          {formatCurrency(item.price)}
                        </span>
                        {item.stock > 0 ? (
                          <div className="text-xs text-green-600 font-medium mt-1">In Stock: {item.stock}</div>
                        ) : (
                          <div className="text-xs text-red-500 font-medium mt-1">Out of Stock</div>
                        )}
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        disabled={item.stock <= 0}
                        className="w-10 h-10 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        title="Add to Cart"
                      >
                        <ShoppingCart className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-12">
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${
                      page === i
                        ? 'bg-red-600 text-white shadow-lg'
                        : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
      {/* Product Detail Modal */}
      {selectedAccessory && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setSelectedAccessory(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in border border-gray-100 flex flex-col md:flex-row overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image side */}
            <div className="relative md:w-1/2 h-64 md:h-auto bg-gray-50 flex items-center justify-center">
              <img 
                src={getImageUrl(selectedAccessory.imageUrl)} 
                alt={selectedAccessory.name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
                }}
              />
              <span className="absolute top-4 left-4 bg-red-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                {selectedAccessory.category}
              </span>
            </div>

            {/* Info side */}
            <div className="p-6 md:w-1/2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                    {selectedAccessory.brand}
                  </span>
                  <button 
                    onClick={() => setSelectedAccessory(null)}
                    className="text-gray-400 hover:text-gray-600 text-xl font-bold p-1 leading-none"
                  >
                    ✕
                  </button>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3 leading-snug">
                  {selectedAccessory.name}
                </h2>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {selectedAccessory.description}
                </p>
                
                {selectedAccessory.compatibleBikes && (
                  <div className="mb-6">
                    <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                      Compatible Motorcycles:
                    </h4>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                      {selectedAccessory.compatibleBikes.split(',').map((bike, idx) => (
                        <span 
                          key={idx} 
                          className="text-[10px] font-medium text-gray-600 bg-gray-100 border border-gray-200 rounded px-2.5 py-1"
                        >
                          {bike.trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 mt-4 flex items-center justify-between">
                <div>
                  <span className="text-2xl font-black text-red-600 block">
                    {formatCurrency(selectedAccessory.price)}
                  </span>
                  {selectedAccessory.stock > 0 ? (
                    <span className="text-xs text-green-600 font-semibold">
                      In Stock: {selectedAccessory.stock} units
                    </span>
                  ) : (
                    <span className="text-xs text-red-500 font-semibold">
                      Out of Stock
                    </span>
                  )}
                </div>

                <button
                  onClick={() => {
                    handleAddToCart(selectedAccessory);
                    setSelectedAccessory(null);
                  }}
                  disabled={selectedAccessory.stock <= 0}
                  className="btn btn-primary px-6 py-2.5 text-sm flex items-center gap-2 shadow-lg"
                >
                  <ShoppingCart className="w-4 h-4" />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccessoryList;