import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Star, CheckCircle, Flag, Trash2 } from 'lucide-react';
import adminService from '../../services/admin.service';
import { formatDateTime, getImageUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const handleImageError = (e) => {
  e.target.src = 'https://images.pexels.com/photos/2116475/pexels-photo-2116475.jpeg?auto=compress&cs=tinysrgb&w=800';
  e.target.onerror = null;
};

const AdminReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);

  const loadReviews = useCallback(async () => {
    try {
      const approvedParam =
        filter === 'PENDING' ? false : filter === 'APPROVED' ? true : null;
      const data = await adminService.getAllReviewsAdmin(currentPage, 10, approvedParam);
      setReviews(data?.content || []);
      setTotalPages(data?.totalPages || 0);
      setTotalItems(data?.totalElements || 0);
    } catch {
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleApprove = async (id) => {
    try {
      await adminService.approveReview(id);
      toast.success('Review approved');
      loadReviews();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to approve reviews');
      } else {
        toast.error(error.response?.data?.message || 'Failed to approve review');
      }
    }
  };

  const handleFlag = async (id) => {
    try {
      await adminService.flagReview(id);
      toast.success('Review flagged');
      loadReviews();
    } catch (error) {
      if (error.response?.status === 403) {
        toast.error('You do not have permission to flag reviews');
      } else {
        toast.error(error.response?.data?.message || 'Failed to flag review');
      }
    }
  };

  const filteredReviews = reviews;

  if (loading) {
    return <div className="py-8 text-center">Loading reviews...</div>;
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Reviews</h1>
          <p className="text-gray-600">{totalItems} total reviews</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-xl shadow-md mb-6">
        <div className="flex border-b">
          <button
            onClick={() => { setFilter('ALL'); setCurrentPage(0); }}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              filter === 'ALL' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600'
            }`}
          >
            All
          </button>
          <button
            onClick={() => { setFilter('PENDING'); setCurrentPage(0); }}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              filter === 'PENDING' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => { setFilter('APPROVED'); setCurrentPage(0); }}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              filter === 'APPROVED' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-600'
            }`}
          >
            Approved
          </button>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <div key={review.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {review.user?.firstname?.[0]}{review.user?.lastname?.[0]}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{review.title}</h3>
                  <p className="text-sm text-gray-600">
                    {review.user?.firstname} {review.user?.lastname} • {formatDateTime(review.createAt)}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {review.isApproved && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                    Approved
                  </span>
                )}
                {review.isFlagged && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                    Flagged
                  </span>
                )}
              </div>
            </div>

            <div className="mb-4">
              <div className="flex items-center gap-4">
                <img
                  src={getImageUrl(review.motorcycle?.images?.[0])}
                  alt={`${review.motorcycle?.brand} ${review.motorcycle?.model}`}
                  className="w-16 h-16 object-cover rounded-lg"
                  onError={handleImageError}
                />
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Motorcycle:</p>
                  <Link
                    to={`/motorcycles/${review.motorcycle?.id}`}
                    className="text-gray-900 hover:text-red-600"
                  >
                    {review.motorcycle?.brand} {review.motorcycle?.model}
                  </Link>
                </div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{review.content}</p>

            {review.images && review.images.length > 0 && (
              <div className="flex gap-2 mb-4">
                {review.images.map((img, index) => (
                  <img
                    key={index}
                    src={getImageUrl(img)}
                    alt={`Review ${index + 1}`}
                    className="w-20 h-20 object-cover rounded-lg"
                    onError={handleImageError}
                  />
                ))}
              </div>
            )}

            <div className="flex gap-3">
              {!review.isApproved && (
                <button
                  onClick={() => handleApprove(review.id)}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Approve
                </button>
              )}
              {!review.isFlagged && (
                <button
                  onClick={() => handleFlag(review.id)}
                  className="btn btn-outline text-yellow-600 border-yellow-600 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Flag
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {currentPage * 10 + 1} to {Math.min((currentPage + 1) * 10, totalItems)} of {totalItems}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
              disabled={currentPage === 0}
              className="btn btn-outline disabled:opacity-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-2">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  className={`w-10 h-10 rounded-lg ${
                    currentPage === i
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={currentPage === totalPages - 1}
              className="btn btn-outline disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
