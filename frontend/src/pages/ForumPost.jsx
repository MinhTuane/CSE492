import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, ThumbsUp, Flag, User, Save, X, MoreHorizontal } from 'lucide-react';
import { forumService } from '../services/forum.service';
import useAuthStore from '../store/authStore';
import toast from 'react-hot-toast';

const ForumPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isAuthenticated } = useAuthStore();
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingText, setEditingText] = useState('');

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await forumService.getPost(id);
      setPost(data);
    } catch {
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || !user?.id) {
      toast.error('Please log in to comment');
      return;
    }
    if (!comment.trim()) return;
    try {
      await forumService.addComment(id, { userId: user.id, content: comment.trim() });
      setComment('');
      toast.success('Comment added');
      loadData();
    } catch {
      toast.error('Failed to add comment');
    }
  };

  const handleLike = async () => {
    try {
      const updated = await forumService.likePost(id);
      setPost((prev) => ({ ...prev, likesCount: updated.likesCount }));
    } catch {
      toast.error('Unable to like post');
    }
  };

  const handleReport = async () => {
    try {
      await forumService.reportPost(id);
      toast.success('Post reported');
    } catch {
      toast.error('Unable to report post');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Loading post...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container-custom">
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-600">Post not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container-custom">
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {(post.user?.firstname + ' ' + post.user?.lastname || '')
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold mb-2">{post.title}</h1>
              <div className="flex items-center gap-3 text-sm text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {post.user?.firstname} {post.user?.lastname}
                </span>
                <span>•</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                  {post.category}
                </span>
                <span>•</span>
                <span className="text-xs">{new Date(post.createAt).toLocaleString('en-US')}</span>
              </div>
              <div className="prose max-w-none mb-4 whitespace-pre-line">{post.content}</div>
              <div className="flex items-center gap-3">
                <button onClick={handleLike} className="btn btn-secondary flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4" />
                  {post.likesCount}
                </button>
                <button onClick={handleReport} className="btn btn-outline flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  Report
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="font-bold text-lg mb-4">Comments</h2>
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-4">
              {post.comments.map((c) => (
                <div key={c.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm text-gray-700 font-medium">
                      {c.user?.firstname} {c.user?.lastname}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs text-gray-500">
                        {new Date(c.createAt).toLocaleString('en-US')}
                      </div>
                      {isAuthenticated && user?.id === c.user?.id && (
                        <button
                          onClick={() => {
                            setEditingCommentId(c.id);
                            setEditingText(c.content || '');
                          }}
                          className="p-1 rounded hover:bg-gray-100"
                          title="Edit"
                        >
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      )}
                    </div>
                  </div>
                  {editingCommentId === c.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        className="input w-full"
                        rows="2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            if (!editingText.trim()) return;
                            try {
                              await forumService.updateComment(c.id, { userId: user.id, content: editingText.trim() });
                              toast.success('Comment updated');
                              setEditingCommentId(null);
                              setEditingText('');
                              loadData();
                            } catch {
                              toast.error('Failed to update comment');
                            }
                          }}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingCommentId(null);
                            setEditingText('');
                          }}
                          className="btn btn-secondary flex items-center gap-2"
                        >
                          <X className="w-4 h-4" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-800 whitespace-pre-line">{c.content}</div>
                  )}
                  
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">No comments yet</p>
          )}

          <form onSubmit={handleAddComment} className="mt-6 space-y-3">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="input w-full"
              rows="4"
              placeholder="Write your comment..."
            />
            <div>
              <button type="submit" className="btn btn-primary">
                Submit Comment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForumPost;
