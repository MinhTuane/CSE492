import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Star } from 'lucide-react';
import useWishlistStore from '../store/wishlistStore';
import { formatCurrency, getImageUrl } from '../utils/helpers';

const Wishlist = () => {
  const { items, removeItem, clearWishlist } = useWishlistStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 animate-fade-in">
        <div className="container-custom">
          <h1 className="text-4xl font-extrabold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800 animate-slide-in-up">My Wishlist</h1>
          
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-16 text-center shadow-2xl border border-white/50 animate-slide-in-up delay-100">
            <div className="inline-flex items-center justify-center w-32 h-32 bg-gray-100 rounded-full mb-8 animate-float">
              <Heart className="w-16 h-16 text-gray-400" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Your wishlist is empty</h2>
            <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
              You haven't saved any motorcycles yet. Start exploring and save your favorites here!
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 animate-fade-in">
      <div className="container-custom">
        <div className="flex items-center justify-between mb-8 animate-slide-in-up">
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-800">My Wishlist</h1>
          <button
            onClick={clearWishlist}
            className="text-red-600 hover:text-red-700 font-semibold px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            Clear Wishlist
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((motorcycle, idx) => (
            <div key={motorcycle.id} className={`card overflow-hidden group hover:shadow-2xl transition-all duration-300 animate-slide-in-up delay-${(idx % 3) * 100 + 100}`}>
              <Link to={`/motorcycles/${motorcycle.id}`}>
                <div className="relative h-56 overflow-hidden bg-gray-100">
                  <img
                    src={getImageUrl(motorcycle.images?.[0])}
                    alt={`${motorcycle.brand} ${motorcycle.model}`}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    onError={(e) => {
                      e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      removeItem(motorcycle.id);
                    }}
                    className="absolute top-4 right-4 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:scale-110 transition-transform z-10"
                    title="Remove from wishlist"
                  >
                    <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                  </button>
                </div>
              </Link>

              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase text-red-600">
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

                <div className="flex items-center justify-between mt-4">
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
                  <Link 
                    to={`/motorcycles/${motorcycle.id}`}
                    className="text-sm font-semibold text-red-600 hover:text-red-700"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
