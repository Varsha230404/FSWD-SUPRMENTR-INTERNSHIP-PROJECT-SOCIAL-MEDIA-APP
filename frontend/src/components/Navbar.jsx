import { Link, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useState, useEffect, useRef } from 'react';
import {
  HiOutlineHome,
  HiOutlineSearch,
  HiOutlinePlusCircle,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineBell,
  HiOutlineMail,
} from 'react-icons/hi';
import { logout } from '../store/authSlice';
import useDebounce from '../hooks/useDebounce';
import API from '../api/axios';
import { getSocket } from '../api/socket';

export default function Navbar({ onCreatePost }) {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatUnread, setChatUnread] = useState(0);
  const debounced = useDebounce(query);
  const searchRef = useRef(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setResults([]);
      return;
    }
    API.get(`/users/search?q=${encodeURIComponent(debounced)}`)
      .then((res) => {
        setResults(res.data);
        setShowResults(true);
      })
      .catch(() => {});
  }, [debounced]);

  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowResults(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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
      if (window.location.pathname.startsWith(`/chat/${msg.from}`)) return;
      setChatUnread((c) => c + 1);
    };
    socket.on('message:new', onNew);
    return () => socket.off('message:new', onNew);
  }, [user?._id]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const iconBtn =
    'p-2 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200';

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 h-16"
      style={{ height: 'var(--nav-h, 64px)' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 h-full flex items-center justify-between gap-2 sm:gap-4">
        <Link
          to="/"
          className="text-xl font-bold text-blue-600 shrink-0 hover:text-blue-700 transition-colors tracking-tight flex items-center gap-2"
        >
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
            V
          </div>
          <span className="hidden sm:inline">Vibe</span>
        </Link>

        <div ref={searchRef} className="relative flex-1 max-w-md hidden sm:block">
          <div className="flex items-center bg-slate-100 rounded-lg px-3 py-2 border border-transparent focus-within:bg-white focus-within:border-blue-500 focus-within:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all duration-200">
            <HiOutlineSearch className="text-slate-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search people..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="bg-transparent w-full text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>
          {showResults && results.length > 0 && (
            <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg animate-fadeIn">
              {results.map((u) => (
                <Link
                  key={u._id}
                  to={`/profile/${u._id}`}
                  onClick={() => {
                    setShowResults(false);
                    setQuery('');
                  }}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-semibold text-white overflow-hidden shrink-0">
                    {u.avatar ? (
                      <img src={u.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      u.name[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{u.name}</p>
                    {u.username && (
                      <p className="text-xs text-slate-500 truncate">@{u.username}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <Link to="/" className={iconBtn} title="Feed">
            <HiOutlineHome size={22} />
          </Link>
          <button onClick={onCreatePost} className={iconBtn} title="Create Post">
            <HiOutlinePlusCircle size={22} />
          </button>
          <Link to="/chat" className={`${iconBtn} relative`} title="Messages">
            <HiOutlineMail size={22} />
            {chatUnread > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-blue-600 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                {chatUnread > 99 ? '99+' : chatUnread}
              </span>
            )}
          </Link>
          <Link to="/notifications" className={`${iconBtn} relative`} title="Notifications">
            <HiOutlineBell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] flex items-center justify-center bg-blue-600 text-white text-[9px] font-bold rounded-full px-0.5 leading-none">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Link>
          <Link to={`/profile/${user?._id}`} className={iconBtn} title="Profile">
            <HiOutlineUser size={22} />
          </Link>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-50 transition-all duration-200"
            title="Logout"
          >
            <HiOutlineLogout size={22} />
          </button>
        </div>
      </div>
    </nav>
  );
}
