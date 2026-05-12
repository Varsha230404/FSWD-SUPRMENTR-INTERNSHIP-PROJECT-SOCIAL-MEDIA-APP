import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiOutlineSearch, HiOutlineHeart, HiOutlineChatAlt2 } from 'react-icons/hi';
import useDebounce from '../hooks/useDebounce';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import API from '../api/axios';

export default function Explore() {
  const [query, setQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activePost, setActivePost] = useState(null);
  const debounced = useDebounce(query);

  useEffect(() => {
    API.get('/posts?page=1&limit=30')
      .then((res) => setPosts(res.data.posts || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!debounced.trim()) {
      setUsers([]);
      return;
    }
    API.get(`/users/search?q=${encodeURIComponent(debounced)}`)
      .then((res) => setUsers(res.data))
      .catch(() => {});
  }, [debounced]);

  return (
    <div className="space-y-6">
      <div className="glass p-5">
        <div className="flex items-center bg-slate-100 rounded-lg px-4 py-3 border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all duration-200">
          <HiOutlineSearch className="text-slate-400 mr-3 shrink-0" size={20} />
          <input
            type="text"
            placeholder="Search people, topics..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="bg-transparent w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </div>
      </div>

      {users.length > 0 && (
        <div className="glass p-4 animate-fadeIn">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            People
          </h3>
          <div className="space-y-2">
            {users.map((u) => (
              <Link
                key={u._id}
                to={`/profile/${u._id}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white shrink-0 overflow-hidden">
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    u.name?.[0]
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{u.name}</p>
                  {u.username && (
                    <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-900">Explore</h2>
        <span className="text-xs text-slate-400">{posts.length} posts</span>
      </div>

      {loading ? (
        <Loader />
      ) : posts.length === 0 ? (
        <div className="glass p-14 text-center">
          <p className="text-3xl mb-3">🔍</p>
          <p className="text-slate-500 text-sm">No posts to explore yet</p>
        </div>
      ) : (
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
