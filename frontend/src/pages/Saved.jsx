import { useState, useEffect } from 'react';
import {
  HiOutlineBookmark,
  HiOutlineViewGrid,
  HiOutlineChatAlt2,
  HiOutlineHeart,
} from 'react-icons/hi';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import API from '../api/axios';

export default function Saved() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('grid');
  const [activePost, setActivePost] = useState(null);

  useEffect(() => {
    API.get('/users/saved-posts')
      .then((res) => setPosts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
            <HiOutlineBookmark size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Saved Posts</h1>
            <p className="text-xs text-slate-500">
              {posts.length} {posts.length === 1 ? 'post' : 'posts'} saved
            </p>
          </div>
        </div>
      </div>

      {posts.length > 0 && (
        <div className="glass p-1.5 flex gap-1.5">
          <button
            onClick={() => setView('grid')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              view === 'grid'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HiOutlineViewGrid size={18} /> Grid
          </button>
          <button
            onClick={() => setView('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
              view === 'list'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <HiOutlineChatAlt2 size={18} /> Feed
          </button>
        </div>
      )}

      {loading ? (
        <Loader />
      ) : posts.length === 0 ? (
        <div className="glass p-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
            <HiOutlineBookmark size={32} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Saved Posts</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Tap the bookmark icon on any post to save it here for later.
          </p>
        </div>
      ) : view === 'grid' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 sm:gap-2">
          {posts.map((post) => (
            <button
              key={post._id}
              onClick={() => setActivePost(post)}
              className="relative aspect-square overflow-hidden bg-slate-100 rounded-lg group"
            >
              {post.image ? (
                <img
                  src={post.image}
                  alt=""
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4 text-xs text-slate-600 text-center bg-gradient-to-br from-slate-50 to-slate-100">
                  <span className="line-clamp-6">{post.text}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/55 flex items-center justify-center gap-4 text-white opacity-0 group-hover:opacity-100 transition-all">
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <HiOutlineHeart size={18} /> {post.likes?.length || 0}
                </span>
                <span className="flex items-center gap-1 text-sm font-semibold">
                  <HiOutlineChatAlt2 size={18} /> {post.commentCount || 0}
                </span>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post._id} post={post} />
          ))}
        </div>
      )}

      {activePost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={() => setActivePost(null)}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <PostCard post={activePost} />
          </div>
        </div>
      )}
    </div>
  );
}
