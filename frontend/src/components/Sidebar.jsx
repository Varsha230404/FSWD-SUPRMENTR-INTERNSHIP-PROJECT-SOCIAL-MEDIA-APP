import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  HiOutlineHome,
  HiOutlineUser,
  HiOutlineLogout,
  HiOutlineBell,
  HiOutlineBookmark,
  HiOutlineSearch,
  HiOutlineMail,
} from 'react-icons/hi';
import { logout } from '../store/authSlice';
import API from '../api/axios';
import { getSocket } from '../api/socket';

export default function Sidebar() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = () => {
      API.get('/notifications/unread-count')
        .then((res) => setUnreadCount(res.data.count || 0))
        .catch(() => {});
      API.get('/chat/unread-count')
        .then((res) => setChatUnread(res.data.count || 0))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onNew = (msg) => {
      if (String(msg?.to) !== String(user?._id)) return;
      if (location.pathname.startsWith(`/chat/${msg.from}`)) return;
      setChatUnread((c) => c + 1);
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [user?._id, location.pathname]);

  useEffect(() => {
    if (location.pathname === '/notifications') setUnreadCount(0);
    if (location.pathname.startsWith('/chat')) setChatUnread(0);
  }, [location.pathname]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const links = [
    { to: '/', icon: HiOutlineHome, label: 'Home' },
    { to: '/explore', icon: HiOutlineSearch, label: 'Explore' },
    { to: '/chat', icon: HiOutlineMail, label: 'Messages', badge: chatUnread },
    { to: '/notifications', icon: HiOutlineBell, label: 'Notifications', badge: unreadCount },
    { to: '/saved', icon: HiOutlineBookmark, label: 'Saved' },
    { to: `/profile/${user?._id}`, icon: HiOutlineUser, label: 'Profile' },
  ];

  return (
    <aside className="hidden lg:block w-60 shrink-0">
      <div
        className="glass p-3 sticky top-24 space-y-1"
        style={{ top: 'var(--content-top, 96px)' }}
      >
        <Link
          to={`/profile/${user?._id}`}
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors mb-1"
        >
          <div className="w-11 h-11 rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white shrink-0 overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              user?.name?.[0]
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 truncate">{user?.name}</p>
            {user?.username ? (
              <p className="text-xs text-slate-500 truncate">@{user.username}</p>
            ) : (
              <p className="text-xs text-slate-500 truncate">{user?.bio || 'View profile'}</p>
            )}
          </div>
        </Link>

        <div className="h-px bg-slate-100 my-2" />

        <nav className="space-y-0.5">
          {links.map(({ to, icon: Icon, label, badge }) => {
            const active = isActive(to);
            return (
              <Link
                key={label}
                to={to}
                className={`flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 group ${
                  active
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="relative">
                  <Icon
                    size={22}
                    className={`transition-transform group-hover:scale-105 ${
                      active ? 'text-blue-600' : ''
                    }`}
                  />
                  {badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center bg-blue-600 text-white text-[10px] font-bold rounded-full px-1 leading-none">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="h-px bg-slate-100 my-2" />

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-3 py-2.5 rounded-lg text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
        >
          <HiOutlineLogout size={22} /> Log out
        </button>
      </div>
    </aside>
  );
}
