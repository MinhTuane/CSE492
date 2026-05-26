import { useState, useEffect, useCallback } from 'react';
import { Search, Flame, Eye, EyeOff, Trash2, MessageSquare } from 'lucide-react';
import adminService from '../../services/admin.service';
import toast from 'react-hot-toast';
import { formatDateTime } from '../../utils/helpers';

const AdminForum = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [hiddenFilter, setHiddenFilter] = useState('VISIBLE');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const categories = [
    'ALL',
    'general',
    'newriders',
    'sportbikes',
    'cruisers',
    'adventure',
    'maintenance',
    'gear',
    'trackdays',
  ];

  const loadPosts = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      const categoryParam = selectedCategory === 'ALL' ? null : selectedCategory;
      const hiddenParam =
        hiddenFilter === 'ALL' ? null : hiddenFilter === 'HIDDEN' ? true : false;
      const data = await adminService.getAllForumPosts(
        page,
        10,
        categoryParam,
        searchTerm || null,
        hiddenParam
      );
      setPosts(data?.content || []);
      setCurrentPage(data?.currentPage || 0);
      setTotalPages(data?.totalPages || 0);
    } catch {
      toast.error('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, hiddenFilter, searchTerm]);

  useEffect(() => {
    loadPosts(0);
  }, [loadPosts]);

  const toggleHot = async (post) => {
    try {
      await adminService.setForumPostHot(post.id, !post.isHot);
      toast.success(!post.isHot ? 'Marked as hot' : 'Removed hot');
      loadPosts(currentPage);
    } catch {
      toast.error('Failed to update hot status');
    }
  };

  const toggleHidden = async (post) => {
    try {
      await adminService.setForumPostHidden(post.id, !post.isHidden);
      toast.success(!post.isHidden ? 'Hidden' : 'Unhidden');
      loadPosts(currentPage);
    } catch {
      toast.error('Failed to update hidden status');
    }
  };

  const deletePost = async (post) => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await adminService.deleteForumPost(post.id);
      toast.success('Post deleted');
      const nextPage = posts.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
      loadPosts(nextPage);
    } catch {
      toast.error('Failed to delete post');
    }
  };

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Manage Forum</h1>
          <p className="text-gray-600">{posts.length} posts on this page</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10 w-full"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={hiddenFilter}
            onChange={(e) => setHiddenFilter(e.target.value)}
            className="input"
          >
            <option value="VISIBLE">Visible</option>
            <option value="HIDDEN">Hidden</option>
            <option value="ALL">All</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">Loading posts...</div>
        ) : posts.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">No posts found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comments</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Likes</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{post.title}</div>
                      <div className="text-xs text-gray-500">
                        {(post.user?.firstname || '')} {(post.user?.lastname || '')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{post.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{post.commentsCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{post.likesCount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(post.createAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => toggleHot(post)}
                          className={`btn btn-outline flex items-center gap-1 ${post.isHot ? 'text-red-600 border-red-600' : ''}`}
                        >
                          <Flame className="w-4 h-4" />
                          Hot
                        </button>
                        <button
                          onClick={() => toggleHidden(post)}
                          className="btn btn-outline flex items-center gap-1"
                        >
                          {post.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {post.isHidden ? 'Unhide' : 'Hide'}
                        </button>
                        <button
                          onClick={() => deletePost(post)}
                          className="btn btn-outline text-red-600 border-red-600 flex items-center gap-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {currentPage + 1} of {totalPages}
          </div>
          <div className="flex gap-2">
            <button
              className="btn btn-outline"
              disabled={currentPage === 0}
              onClick={() => loadPosts(currentPage - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn-outline"
              disabled={currentPage >= totalPages - 1}
              onClick={() => loadPosts(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminForum;
