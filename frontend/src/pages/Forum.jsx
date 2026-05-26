import { useState, useEffect, useCallback } from 'react';
import { Search, Plus, MessageSquare, TrendingUp, User } from 'lucide-react';
import { forumService } from '../services/forum.service';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const Forum = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general' });
  const [postsPage, setPostsPage] = useState({ content: [], totalPages: 0, number: 0 });
  const [hotTopics, setHotTopics] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  // Categories (static definitions; counts loaded from backend)
  const categories = [
    { id: 'general', name: 'General Discussion', icon: '💬' },
    { id: 'newriders', name: 'New Riders', icon: '🏍️' },
    { id: 'sportbikes', name: 'Sport Bikes', icon: '🏁' },
    { id: 'cruisers', name: 'Cruisers', icon: '🛣️' },
    { id: 'adventure', name: 'Adventure Touring', icon: '🗺️' },
    { id: 'maintenance', name: 'Maintenance & Repair', icon: '🔧' },
    { id: 'gear', name: 'Gear & Equipment', icon: '🎽' },
    { id: 'trackdays', name: 'Track Days', icon: '🏆' }
  ];

  const loadPosts = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      const data = await forumService.getAllPosts(
        page,
        10,
        selectedCategory === 'all' ? null : selectedCategory,
        searchTerm || null,
        null
      );
      setPostsPage(prev =>
        page === 0
          ? data
          : {
              ...data,
              content: [...(prev?.content || []), ...(data?.content || [])],
            }
      );
    } catch {
      toast.error('Failed to load discussions');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchTerm]);

  const loadHotTopics = useCallback(async () => {
    try {
      const data = await forumService.getHotTopics();
      setHotTopics(data || []);
    } catch {
      setHotTopics([]);
    }
  }, []);

  useEffect(() => {
    loadPosts(0);
    loadHotTopics();
  }, [loadPosts, loadHotTopics]);

  useEffect(() => {
    const counts = {};
    (postsPage?.content || []).forEach((p) => {
      counts[p.category] = (counts[p.category] || 0) + 1;
    });
    setCategoryCounts(counts);
  }, [postsPage]);

  const discussions = postsPage?.content || [];

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user?.id) {
      toast.error('Please login to post');
      navigate('/login');
      return;
    }
    try {
      await forumService.createPost({
        userId: user.id,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category
      });
      toast.success('Discussion created successfully');
      setNewPost({ title: '', content: '', category: 'general' });
      setShowNewPost(false);
      loadPosts(0);
    } catch {
      toast.error('Failed to create post');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Community Forum</h1>
          <p className="text-xl text-gray-600 mb-6">
            Join thousands of motorcycle enthusiasts sharing knowledge and passion
          </p>
          <div className="flex justify-center gap-12">
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">25K+</p>
              <p className="text-gray-600">Active Members</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">150K+</p>
              <p className="text-gray-600">Forum Posts</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-blue-600">2K+</p>
              <p className="text-gray-600">Topics Daily</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Categories */}
            <div className="bg-white rounded-xl shadow-md p-6 sticky top-8">
              <h3 className="font-bold text-lg mb-4">Categories</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-red-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  All Categories
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`w-full text-left px-4 py-2 rounded-lg transition-colors flex items-center justify-between ${
                      selectedCategory === cat.id
                        ? 'bg-red-600 text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <span>
                      <span className="mr-2">{cat.icon}</span>
                      <span className="text-sm">{cat.name}</span>
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      selectedCategory === cat.id
                        ? 'bg-white text-red-600'
                        : 'bg-gray-200 text-gray-600'
                    }`}>
                      {categoryCounts[cat.id] || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hot Topics */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-lg">Hot Topics</h3>
              </div>
              <div className="space-y-3">
                {hotTopics.map((topic, i) => (
                  <div
                    key={topic.id || i}
                    className="flex items-start gap-2 cursor-pointer"
                    onClick={() => navigate(`/forum/${topic.id}`)}
                  >
                    <span className="text-red-600 font-bold text-sm">{i + 1}.</span>
                    <div className="flex-1">
                      <p className="text-sm font-medium hover:text-red-600 cursor-pointer">
                        {topic.title}
                      </p>
                      <p className="text-xs text-gray-500">{topic.commentsCount} replies</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search & New Post */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search discussions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
                <button
                  onClick={() => setShowNewPost(!showNewPost)}
                  className="btn btn-primary flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" />
                  New Post
                </button>
              </div>
            </div>

            {/* New Post Form */}
            {showNewPost && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">Create New Post</h3>
                <form onSubmit={handleSubmitPost} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title
                    </label>
                    <input
                      type="text"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      className="input w-full"
                      placeholder="What's your question or topic?"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="input w-full"
                    >
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Content
                    </label>
                    <textarea
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      className="input w-full"
                      rows="6"
                      placeholder="Share your thoughts, questions, or experiences..."
                      required
                    />
                  </div>
                  <div className="flex gap-3">
                    <button type="submit" className="btn btn-primary">
                      Post Discussion
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowNewPost(false)}
                      className="btn btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Discussions List */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">Loading discussions...</p>
                </div>
              ) : discussions.length === 0 ? (
                <div className="bg-white rounded-xl shadow-md p-12 text-center">
                  <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600">No discussions found</p>
                </div>
              ) : (
                discussions.map((discussion) => (
                  <div
                    key={discussion.id}
                    className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => navigate(`/forum/${discussion.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                        {(((discussion.user?.firstname || '') + ' ' + (discussion.user?.lastname || '')))
                          .split(' ')
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold hover:text-red-600 mb-1">
                              {discussion.title}
                              {discussion.isHot && (
                                <span className="ml-2 inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                  <TrendingUp className="w-3 h-3" />
                                  Hot
                                </span>
                              )}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <User className="w-4 h-4" />
                                {(`${discussion.user?.firstname || ''} ${discussion.user?.lastname || ''}`).trim() || 'Unknown'}
                              </span>
                              <span>•</span>
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {discussion.category}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-2 text-gray-600 mb-1">
                              <MessageSquare className="w-4 h-4" />
                              <span className="font-semibold">{discussion.commentsCount}</span>
                            </div>
                            <span className="text-xs text-gray-500">{new Date(discussion.createAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Load More */}
            {discussions.length > 0 && postsPage.number < postsPage.totalPages - 1 && (
              <div className="text-center mt-8">
                <button
                  className="btn btn-outline"
                  disabled={loading}
                  onClick={() => loadPosts(postsPage.number + 1)}
                >
                  {loading ? 'Loading...' : 'Load More Discussions'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forum;
