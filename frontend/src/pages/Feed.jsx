import { useEffect, useCallback, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchFeed, clearPosts } from '../store/postSlice';
import PostCard from '../components/PostCard';
import Loader from '../components/Loader';
import API from '../api/axios';

function StoriesRail() {
  const { user } = useSelector((state) => state.auth);
  const [people, setPeople] = useState([]);

  useEffect(() => {
    API.get('/users/suggestions')
      .then((res) => setPeople(res.data))
      .catch(() => {});
  }, []);

  const all = [user, ...people].filter(Boolean);

  return (
    <div className="glass p-5 overflow-x-auto">
      <div className="flex gap-5 min-w-max">
        {all.map((u, i) => (
          <Link
            key={u._id}
            to={`/profile/${u._id}`}
            className="flex flex-col items-center gap-2 group shrink-0"
          >
            <div
              className="rounded-full ring-2 ring-blue-200 ring-offset-2 ring-offset-white group-hover:ring-blue-400 transition-all"
              style={{ width: '60px', height: '60px' }}
            >
              <div className="w-full h-full rounded-full bg-blue-100 flex items-center justify-center text-base font-semibold text-blue-600 overflow-hidden">
                {u.avatar ? (
                  <img src={u.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                ) : (
                  u.name?.[0]
                )}
              </div>
            </div>
            <span className="text-xs text-slate-500 truncate leading-none" style={{ maxWidth: '64px' }}>
              {i === 0 ? 'You' : u.name?.split(' ')[0]}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function Feed() {
  const dispatch = useDispatch();
  const { posts, loading, page, pages } = useSelector((state) => state.posts);
  const { user } = useSelector((state) => state.auth);
  const [filter, setFilter] = useState('all');
  const observerRef = useRef();
  const hasMore = page < pages;

  useEffect(() => {
    dispatch(clearPosts());
    dispatch(fetchFeed(1));
  }, [dispatch]);

  const lastPostRef = useCallback(
    (node) => {
      if (loading) return;
      if (observerRef.current) observerRef.current.disconnect();
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          dispatch(fetchFeed(page + 1));
        }
      });
      if (node) observerRef.current.observe(node);
    },
    [loading, hasMore, page, dispatch]
  );

  const followingIds = new Set(
    (user?.following || []).map((u) => (typeof u === 'string' ? u : u._id))
  );
  const visiblePosts =
    filter === 'following'
      ? posts.filter((p) => followingIds.has(p.user?._id) || p.user?._id === user?._id)
      : posts;

  return (
    <div className="space-y-5">
      <StoriesRail />

      <div className="glass p-1.5 flex gap-1">
        <button
          onClick={() => setFilter('all')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            filter === 'all'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          For You
        </button>
        <button
          onClick={() => setFilter('following')}
          className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
            filter === 'following'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          Following
        </button>
      </div>

      {visiblePosts.map((post, i) => (
        <div
          key={post._id}
          ref={i === visiblePosts.length - 1 ? lastPostRef : null}
        >
          <PostCard post={post} />
        </div>
      ))}

      {loading && <Loader />}

      {!loading && visiblePosts.length === 0 && (
        <div className="glass p-14 text-center">
          <p className="text-3xl mb-3">✨</p>
          <p className="text-slate-500 text-sm">
            {filter === 'following'
              ? 'Follow people to see their posts here'
              : 'No posts yet. Be the first to share something!'}
          </p>
        </div>
      )}

      {!hasMore && visiblePosts.length > 0 && (
        <p className="text-center text-xs text-slate-400 py-6">
          You've reached the end
        </p>
      )}
    </div>
  );
}
