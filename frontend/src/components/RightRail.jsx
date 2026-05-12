import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import API from '../api/axios';

export default function RightRail() {
  const { user } = useSelector((state) => state.auth);
  const [suggestions, setSuggestions] = useState([]);
  const [following, setFollowing] = useState({});

  useEffect(() => {
    API.get('/users/suggestions')
      .then((res) => setSuggestions(res.data))
      .catch(() => {});
  }, []);

  const handleFollow = async (id) => {
    setFollowing((f) => ({ ...f, [id]: true }));
    try {
      await API.put(`/users/${id}/follow`);
    } catch {
      setFollowing((f) => ({ ...f, [id]: false }));
    }
  };

  return (
    <aside className="hidden xl:block w-72 shrink-0">
      <div
        className="sticky top-24 space-y-6"
        style={{ top: 'var(--content-top, 96px)' }}
      >
        <Link
          to={`/profile/${user?._id}`}
          className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-base font-semibold text-white shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">
              {user?.username ? `@${user.username}` : user?.name}
            </p>
            <p className="text-xs text-slate-500 truncate">{user?.name}</p>
          </div>
        </Link>

        <div className="glass p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Suggested for you
            </h3>
          </div>
          <div className="space-y-3">
            {suggestions.length === 0 && (
              <p className="text-xs text-slate-400">No suggestions right now</p>
            )}
            {suggestions.map((u) => (
              <div key={u._id} className="flex items-center gap-3">
                <Link
                  to={`/profile/${u._id}`}
                  className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600 shrink-0 overflow-hidden"
                >
                  {u.avatar ? (
                    <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    u.name?.[0]
                  )}
                </Link>
                <Link to={`/profile/${u._id}`} className="min-w-0 flex-1 group">
                  <p className="text-sm font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                    {u.username ? `@${u.username}` : u.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {u.name}
                    {u.bio ? ` · ${u.bio}` : ''}
                  </p>
                </Link>
                <button
                  onClick={() => handleFollow(u._id)}
                  disabled={following[u._id]}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                    following[u._id]
                      ? 'border border-slate-200 text-slate-400 cursor-default'
                      : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.97]'
                  }`}
                >
                  {following[u._id] ? 'Following' : 'Follow'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="px-2 text-[11px] text-slate-400 leading-relaxed">
          <p>About · Help · Privacy · Terms</p>
          <p className="mt-2">© 2025 Vibe</p>
        </div>
      </div>
    </aside>
  );
}
