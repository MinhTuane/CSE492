import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motorcycleService } from '../../services/motorcycle.service';
import { formatCurrency, getImageUrl } from '../../utils/helpers';
import { Loader2 } from 'lucide-react';

const ChatbotProductPreview = ({ keyword }) => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await motorcycleService.searchPaged({ keyword }, 0, 1);
        if (res && res.content && res.content.length > 0) {
          setProduct(res.content[0]);
        }
      } catch (err) {
        console.error("Failed to fetch product preview", err);
      } finally {
        setLoading(false);
      }
    };
    if (keyword) {
      fetchProduct();
    } else {
      setLoading(false);
    }
  }, [keyword]);

  if (loading) {
    return (
      <div className="w-full bg-white border border-gray-200 rounded-xl p-3 my-2 shadow-sm flex items-center justify-center h-24">
        <Loader2 className="w-5 h-5 animate-spin text-red-500" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <Link to={`/motorcycles/${product.id}`} className="block w-full bg-white border border-gray-200 rounded-xl overflow-hidden my-2 shadow-sm hover:shadow-md hover:border-red-300 transition-all group">
      <div className="h-32 bg-gray-100 relative overflow-hidden">
        <img 
          src={getImageUrl(product.images?.[0])} 
          alt={product.model} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => { e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800'; e.target.onerror = null; }}
        />
        {product.discountPercentage > 0 && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">
            -{product.discountPercentage}%
          </span>
        )}
      </div>
      <div className="p-3">
        <div className="text-[10px] font-bold uppercase text-gray-500 mb-1">{product.brand}</div>
        <h4 className="font-semibold text-gray-800 text-sm mb-1 line-clamp-1 group-hover:text-red-600 transition-colors">{product.model}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-red-600 font-bold text-sm">
            {formatCurrency(product.price * (1 - (product.discountPercentage || 0) / 100))}
          </span>
          <span className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded font-medium group-hover:bg-red-600 group-hover:text-white transition-colors">
            Xem chi tiết
          </span>
        </div>
      </div>
    </Link>
  );
};

export default ChatbotProductPreview;
