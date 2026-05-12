import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineBell,
  HiOutlineHeart,
  HiOutlineUserAdd,
  HiOutlineChatAlt2,
  HiOutlineCheck,
} from 'react-icons/hi';
import Loader from '../components/Loader';
import API from '../api/axios';

const typeConfig = {
  follow: {
    icon: HiOutlineUserAdd,
    iconColor: 'text-blue-600',
    iconBg: 'bg-blue-50',
    getMessage: (n) => 'started following you',
  },
  like: {
    icon: HiOutlineHeart,
    iconColor: 'text-red-500',
    iconBg: 'bg-red-50',
    getMessage: (n) => 'liked your post',
  },
  comment: {
    icon: HiOutlineChatAlt2,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-50',
    getMessage: (n) => `commented: "${n.comment || '...'}"`,
  },
};

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = () => {
    API.get('/notifications?limit=50')
      .then((res) => {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {
    }
  };

  const markOneRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
              <HiOutlineBell size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
              <p className="text-xs text-slate-500">
                {unreadCount > 0 ? `${unreadCount} new` : 'All caught up'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <HiOutlineCheck size={16} /> Mark all read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loader />
      ) : notifications.length === 0 ? (
        <div className="glass p-14 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 mb-4">
            <HiOutlineBell size={32} className="text-blue-500" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">No Notifications</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            When someone follows you, likes, or comments on your posts,
            you'll see it here.
          </p>
        </div>
      ) : (
        <div className="glass overflow-hidden divide-y divide-slate-100">
          {notifications.map((n) => {
            const config = typeConfig[n.type] || typeConfig.follow;
            const Icon = config.icon;
            const sender = n.sender || {};

            return (
              <div
                key={n._id}
                className={`flex items-start gap-4 p-5 transition-colors cursor-pointer ${
                  n.read
                    ? 'hover:bg-slate-50/60'
                    : 'bg-blue-50/40 hover:bg-blue-50/70'
                }`}
                onClick={() => !n.read && markOneRead(n._id)}
              >
                <Link
                  to={`/profile/${sender._id}`}
                  className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white shrink-0 overflow-hidden"
                >
                  {sender.avatar ? (
                    <img src={sender.avatar} alt="" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    sender.name?.[0]
                  )}
                </Link>

                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-700">
                    <Link
                      to={`/profile/${sender._id}`}
                      className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
                    >
                      {sender.username ? `@${sender.username}` : sender.name}
                    </Link>{' '}
                    {config.getMessage(n)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                </div>

                <div className={`w-9 h-9 rounded-full ${config.iconBg} flex items-center justify-center shrink-0`}>
                  <Icon size={18} className={config.iconColor} />
                </div>

                {n.post?.image && (
                  <Link
                    to={`/post/${n.post._id}`}
                    className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 shrink-0"
                  >
                    <img src={n.post.image} alt="" className="w-full h-full object-cover" />
                  </Link>
                )}

                {!n.read && (
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
