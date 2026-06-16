import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, MessageSquare, Heart,
  Tag, HelpCircle, Image as ImageIcon, X,
  Flame, Clock, ChevronDown, CheckCircle
} from 'lucide-react';
import { forumService } from '../services/forum.service';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const POST_TYPES = [
  { id: 'all',         label: 'All Posts',   icon: MessageSquare, color: 'text-gray-600',   bg: 'bg-gray-100',    active: 'bg-gray-900 text-white' },
  { id: 'hot',         label: 'Hot Topics',  icon: Flame,         color: 'text-orange-500', bg: 'bg-orange-50',   active: 'bg-orange-500 text-white' },
  { id: 'marketplace', label: 'Marketplace', icon: Tag,           color: 'text-emerald-600', bg: 'bg-emerald-50',  active: 'bg-emerald-600 text-white' },
  { id: 'question',    label: 'Q&A',         icon: HelpCircle,    color: 'text-blue-600',   bg: 'bg-blue-50',     active: 'bg-blue-600 text-white' },
  { id: 'showcase',    label: 'Bike Gallery',icon: ImageIcon,     color: 'text-violet-600', bg: 'bg-violet-50',   active: 'bg-violet-600 text-white' },
];

const CATEGORIES = [
  { id: 'general',     name: 'General Discussion', icon: '💬' },
  { id: 'newriders',   name: 'New Riders',         icon: '🏍️' },
  { id: 'sportbikes',  name: 'Sport Bikes',        icon: '🏁' },
  { id: 'cruisers',    name: 'Cruisers',           icon: '🛣️' },
  { id: 'adventure',   name: 'Adventure Touring',  icon: '🗺️' },
  { id: 'maintenance', name: 'Repairs & Service',  icon: '🔧' },
  { id: 'gear',        name: 'Gear & Tuning',      icon: '🎽' },
  { id: 'marketplace', name: 'Bike Sales',         icon: '🏷️' },
  { id: 'showcase',    name: 'Bike Gallery',       icon: '📸' },
  { id: 'question',    name: 'Q&A',                icon: '❓' },
  { id: 'trackdays',   name: 'Track Days',         icon: '🏆' },
];

const CATEGORY_COLORS = {
  general:     'bg-gray-100 text-gray-700',
  newriders:   'bg-sky-100 text-sky-700',
  sportbikes:  'bg-red-100 text-red-700',
  cruisers:    'bg-amber-100 text-amber-700',
  adventure:   'bg-lime-100 text-lime-700',
  maintenance: 'bg-orange-100 text-orange-700',
  gear:        'bg-purple-100 text-purple-700',
  marketplace: 'bg-emerald-100 text-emerald-700',
  showcase:    'bg-violet-100 text-violet-700',
  question:    'bg-blue-100 text-blue-700',
  trackdays:   'bg-yellow-100 text-yellow-700',
};

const formatPrice = (price) => {
  if (!price) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', minimumFractionDigits: 0 }).format(price);
};

const getInitials = (user) => {
  const name = `${user?.firstname || ''} ${user?.lastname || ''}`.trim();
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?';
};

const AVATAR_COLORS = ['bg-red-500','bg-violet-500','bg-blue-500','bg-emerald-500','bg-amber-500','bg-pink-500','bg-cyan-500'];
const getAvatarColor = (id) => AVATAR_COLORS[(id?.charCodeAt(0) || 0) % AVATAR_COLORS.length];

const Forum = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showNewPost, setShowNewPost] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'general', price: '' });
  const [postsPage, setPostsPage] = useState({ content: [], totalPages: 0, number: 0 });
  const [hotTopics, setHotTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const resolvedCategory = activeTab === 'all' ? (selectedCategory === 'all' ? null : selectedCategory)
    : activeTab === 'hot' ? null
    : activeTab;

  const loadPosts = useCallback(async (page = 0) => {
    try {
      setLoading(true);
      const data = await forumService.getAllPosts(
        page, 10,
        resolvedCategory,
        searchTerm || null,
        activeTab === 'hot' ? true : null
      );
      setPostsPage(prev =>
        page === 0 ? data : { ...data, content: [...(prev?.content || []), ...(data?.content || [])] }
      );
    } catch {
      toast.error('Failed to load forum posts');
    } finally {
      setLoading(false);
    }
  }, [resolvedCategory, searchTerm, activeTab]);

  const loadHotTopics = useCallback(async () => {
    try {
      const data = await forumService.getHotTopics();
      setHotTopics(data || []);
    } catch { setHotTopics([]); }
  }, []);

  useEffect(() => { loadPosts(0); loadHotTopics(); }, [loadPosts, loadHotTopics]);

  const discussions = postsPage?.content || [];

  const handleSubmitPost = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user?.id) {
      toast.error('Please login to create a post');
      navigate('/login');
      return;
    }
    setSubmitting(true);
    try {
      await forumService.createPost({
        userId: user.id,
        title: newPost.title,
        content: newPost.content,
        category: newPost.category,
        price: newPost.price ? parseFloat(newPost.price) : null,
      });
      toast.success('Post created successfully!');
      setNewPost({ title: '', content: '', category: 'general', price: '' });
      setShowNewPost(false);
      loadPosts(0);
    } catch {
      toast.error('Failed to create post, please try again later');
    } finally {
      setSubmitting(false);
    }
  };

  const isMarketplaceCategory = ['marketplace'].includes(newPost.category);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Banner */}
      <div className="bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 py-14">
        <div className="container-custom text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/20 text-red-300 text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
            <Flame className="w-4 h-4" /> Active Rider Community
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
            Motorcycle <span className="text-red-400">Forum</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Share experiences, buy and sell bikes, and ask questions in our rider community
          </p>
          <div className="max-w-lg mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posts, topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 backdrop-blur text-white placeholder-gray-400 rounded-2xl pl-12 pr-4 py-3.5 text-sm outline-none focus:ring-2 focus:ring-red-400 border border-white/10"
            />
          </div>
        </div>
      </div>

      <div className="container-custom py-8">
        {/* Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-hide">
          {POST_TYPES.map((type) => {
            const PostIcon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => { setActiveTab(type.id); setSelectedCategory('all'); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${
                  activeTab === type.id ? type.active : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <PostIcon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
          <button
            onClick={() => { if (!isAuthenticated) { toast.error('Please login first'); navigate('/login'); return; } setShowNewPost(true); }}
            className="ml-auto flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors"
          >
            <Plus className="w-4 h-4" /> Create New Post
          </button>
        </div>

        {/* New Post Form Modal */}
        {showNewPost && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-900">Create New Post</h3>
                <button onClick={() => setShowNewPost(false)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <form onSubmit={handleSubmitPost} className="p-6 space-y-5">
                {/* Post Type Selector */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">Post Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CATEGORIES.filter(c => ['general','marketplace','showcase','question'].includes(c.id)).map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setNewPost({ ...newPost, category: cat.id })}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-sm ${
                          newPost.category === cat.id
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-600'
                        }`}
                      >
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-medium text-xs text-center leading-tight">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category (for non-special types) */}
                {!['marketplace','showcase','question'].includes(newPost.category) && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
                    <select
                      value={newPost.category}
                      onChange={(e) => setNewPost({ ...newPost, category: e.target.value })}
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-red-300 outline-none"
                    >
                      {CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Title *</label>
                  <input
                    type="text"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-red-300 outline-none"
                    placeholder={newPost.category === 'marketplace' ? 'e.g., Used Honda CB500F 2022 for sale...' : 'Your post title'}
                    required
                  />
                </div>

                {/* Price field for marketplace */}
                {isMarketplaceCategory && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Price (VND)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₫</span>
                      <input
                        type="number"
                        value={newPost.price}
                        onChange={(e) => setNewPost({ ...newPost, price: e.target.value })}
                        className="w-full rounded-xl border border-gray-200 pl-8 pr-4 py-3 text-sm focus:ring-2 focus:ring-red-300 outline-none"
                        placeholder="e.g., 85000000"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Content *</label>
                  <textarea
                    value={newPost.content}
                    onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-red-300 outline-none resize-none"
                    rows={6}
                    placeholder={
                      newPost.category === 'marketplace' ? 'Describe the bike condition, mileage, reason for selling...' :
                      newPost.category === 'question' ? 'Describe your issue or question in detail...' :
                      'Share your story or experiences...'
                    }
                    required
                  />
                </div>

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {submitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    {submitting ? 'Posting...' : 'Create Post'}
                  </button>
                  <button type="button" onClick={() => setShowNewPost(false)} className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-5">
            {/* Category Filter */}
            {activeTab === 'all' && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${selectedCategory === 'all' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                  >
                    <span>🗂️ All Categories</span>
                  </button>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${selectedCategory === cat.id ? 'bg-red-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                      <span>{cat.icon}</span>
                      <span className="flex-1 truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hot Topics */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-500" />
                <h3 className="font-bold text-gray-900 text-sm uppercase tracking-wider">Trending</h3>
              </div>
              {hotTopics.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-3">No trending topics yet</p>
              ) : (
                <div className="space-y-3">
                  {hotTopics.slice(0, 5).map((topic, i) => (
                    <div key={topic.id || i} className="flex gap-3 cursor-pointer group" onClick={() => navigate(`/forum/${topic.id}`)}>
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        i === 0 ? 'bg-red-500 text-white' : i === 1 ? 'bg-orange-400 text-white' : i === 2 ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-red-600 line-clamp-2 transition-colors">{topic.title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{topic.commentsCount} comments</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Write Prompt */}
            <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-5 text-white">
              <h3 className="font-bold mb-2">Have something to share?</h3>
              <p className="text-red-100 text-sm mb-4">Create a post now and connect with other riders!</p>
              <button
                onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } setShowNewPost(true); }}
                className="w-full bg-white text-red-600 font-bold text-sm py-2.5 rounded-xl hover:bg-red-50 transition-colors"
              >
                ✍️ Write Post Now
              </button>
            </div>
          </div>

          {/* Main Posts Feed */}
          <div className="lg:col-span-3 space-y-4">
            {loading && discussions.length === 0 ? (
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                      <div className="flex-1 space-y-3">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                        <div className="h-3 bg-gray-100 rounded w-full" />
                        <div className="h-3 bg-gray-100 rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : discussions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-20 text-center">
                <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-500 font-semibold text-lg">No posts yet</p>
                <p className="text-gray-400 text-sm mt-1">Be the first to share your thoughts!</p>
                <button onClick={() => { if (!isAuthenticated) { navigate('/login'); return; } setShowNewPost(true); }} className="mt-5 bg-red-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition-colors">
                  Create First Post
                </button>
              </div>
            ) : (
              discussions.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-gray-200 transition-all cursor-pointer group"
                  onClick={() => navigate(`/forum/${post.id}`)}
                >
                  {/* Marketplace price banner */}
                  {post.price && (
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-2.5 rounded-t-2xl flex items-center justify-between">
                      <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" /> Resale Bike
                      </span>
                      <span className="text-white font-extrabold text-base">{formatPrice(post.price)}</span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="flex gap-4">
                      {/* Avatar */}
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${getAvatarColor(post.user?.id)}`}>
                        {getInitials(post.user)}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Author + Meta */}
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <span className="text-sm font-semibold text-gray-800">
                            {(`${post.user?.firstname || ''} ${post.user?.lastname || ''}`).trim() || 'Anonymous'}
                          </span>
                          <span className="text-gray-300">·</span>
                          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] || 'bg-gray-100 text-gray-600'}`}>
                            {CATEGORIES.find(c => c.id === post.category)?.icon} {post.category}
                          </span>
                          {post.isHot && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-600">
                              <Flame className="w-3 h-3" /> Trending
                            </span>
                          )}
                          {post.isVerifiedByShop && (
                            <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                              <CheckCircle className="w-3 h-3" /> Verified Shop
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3 className="text-base font-bold text-gray-900 group-hover:text-red-600 transition-colors line-clamp-2 mb-1.5">
                          {post.title}
                        </h3>

                        {/* Excerpt */}
                        <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                          {post.content}
                        </p>

                        {/* Footer stats */}
                        <div className="flex items-center gap-5 text-xs text-gray-400">
                          <span className="flex items-center gap-1.5 hover:text-red-500 transition-colors">
                            <Heart className="w-3.5 h-3.5" /> {post.likesCount || 0}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5" /> {post.commentsCount || 0} comments
                          </span>
                          <span className="flex items-center gap-1.5 ml-auto">
                            <Clock className="w-3.5 h-3.5" />
                            {new Date(post.createAt).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Load More */}
            {discussions.length > 0 && postsPage.number < postsPage.totalPages - 1 && (
              <div className="text-center pt-2">
                <button
                  onClick={() => loadPosts(postsPage.number + 1)}
                  disabled={loading}
                  className="flex items-center gap-2 mx-auto bg-white border border-gray-200 hover:border-gray-300 text-gray-600 font-semibold px-8 py-3 rounded-xl text-sm transition-all hover:shadow-sm disabled:opacity-50"
                >
                  {loading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : <ChevronDown className="w-4 h-4" />}
                  {loading ? 'Loading...' : 'Load More Posts'}
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
