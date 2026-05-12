import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HiOutlineX } from 'react-icons/hi';
import API from '../api/axios';

export default function FollowersModal({ followers = [], following = [], initialTab = 'followers', onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user: me } = useSelector((state) => state.auth);
  const [followState, setFollowState] = useState({});

  const list = activeTab === 'followers' ? followers : following;

  const handleFollow = async (id) => {
    try {
      const res = await API.put(`/users/${id}/follow`);
      setFollowState((prev) => ({ ...prev, [id]: res.data.following }));
    } catch {
    }
  };

  const isFollowingUser = (userId) => {
    if (followState[userId] !== undefined) return followState[userId];
    const myFollowing = me?.following || [];
    return myFollowing.some((f) => (typeof f === 'string' ? f : f._id) === userId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md bg-white rounded-2xl overflow-hidden shadow-2xl animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <div className="flex gap-1 flex-1">
            <button
              onClick={() => setActiveTab('followers')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'followers'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Followers ({followers.length})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                activeTab === 'following'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:bg-neutral-100'
              }`}
            >
              Following ({following.length})
            </button>
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-2 rounded-lg hover:bg-neutral-100 text-neutral-500 transition-colors"
          >
            <HiOutlineX size={20} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {list.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-2xl mb-2">{activeTab === 'followers' ? '👥' : '🔗'}</p>
              <p className="text-sm text-neutral-500">
                {activeTab === 'followers'
                  ? 'No followers yet'
                  : 'Not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-50">
              {list.map((user) => (
                <div key={user._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-neutral-50/60 transition-colors">
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={onClose}
                    className="w-11 h-11 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden"
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      user.name?.[0]
                    )}
                  </Link>
                  <Link
                    to={`/profile/${user._id}`}
                    onClick={onClose}
                    className="min-w-0 flex-1 group"
                  >
                    <p className="text-sm font-semibold text-neutral-900 truncate group-hover:underline">
                      {user.username ? `@${user.username}` : user.name}
                    </p>
                    <p className="text-xs text-neutral-500 truncate">{user.name}</p>
                  </Link>
                  {user._id !== me?._id && (
                    <button
                      onClick={() => handleFollow(user._id)}
                      className={`text-xs font-semibold px-4 py-1.5 rounded-lg transition-all shrink-0 ${
                        isFollowingUser(user._id)
                          ? 'border border-neutral-200 text-neutral-600 hover:border-red-300 hover:text-red-500 hover:bg-red-50'
                          : 'bg-neutral-900 text-white hover:bg-neutral-800 active:scale-[0.97]'
                      }`}
                    >
                      {isFollowingUser(user._id) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
