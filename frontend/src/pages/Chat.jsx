import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  HiOutlinePaperAirplane,
  HiOutlineChatAlt2,
  HiOutlineArrowLeft,
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import API from '../api/axios';
import { useChatSocket } from '../hooks/useChat';
import Loader from '../components/Loader';

function Avatar({ user, online, size = 'md' }) {
  const sz = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
  return (
    <div className="relative shrink-0">
      <div
        className={`${sz} rounded-full bg-blue-600 flex items-center justify-center font-semibold text-white overflow-hidden`}
      >
        {user?.avatar ? (
          <img src={user.avatar} alt="" className="w-full h-full object-cover" />
        ) : (
          user?.name?.[0]?.toUpperCase() || '?'
        )}
      </div>
      {online && (
        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
      )}
    </div>
  );
}

function timeAgoShort(date) {
  if (!date) return '';
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(date).toLocaleDateString();
}

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function Chat() {
  const { user: me } = useSelector((s) => s.auth);
  const { userId: activeId } = useParams();
  const navigate = useNavigate();
  const { socket, connected, onlineUsers, sendMessage } = useChatSocket();

  const [contacts, setContacts] = useState([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [permissionError, setPermissionError] = useState(null);
  const [peerTyping, setPeerTyping] = useState(false);

  const scrollRef = useRef(null);
  const typingStopTimer = useRef(null);
  const typingActive = useRef(false);

  const loadContacts = useCallback(() => {
    API.get('/chat/contacts')
      .then((res) => setContacts(res.data))
      .catch(() => toast.error('Failed to load contacts'))
      .finally(() => setLoadingContacts(false));
  }, []);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!activeId) {
      setActiveUser(null);
      setMessages([]);
      setPermissionError(null);
      return;
    }
    setLoadingMessages(true);
    setPermissionError(null);

    API.get(`/chat/messages/${activeId}`)
      .then((res) => {
        setMessages(res.data);
        loadContacts();
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          setPermissionError(
            err.response.data?.message ||
              'You can only chat with people who follow you back.'
          );
        } else {
          toast.error('Failed to load messages');
        }
      })
      .finally(() => setLoadingMessages(false));

    const found = contacts.find((c) => c.user._id === activeId);
    if (found) setActiveUser(found.user);
    else {
      API.get(`/users/${activeId}`)
        .then((res) =>
          setActiveUser({
            _id: res.data._id,
            name: res.data.name,
            username: res.data.username,
            avatar: res.data.avatar,
          })
        )
        .catch(() => {});
    }
  }, [activeId, contacts.length]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!socket) return;
    const onNewMessage = (msg) => {
      const isInThisConvo =
        activeId &&
        ((msg.from === me?._id && msg.to === activeId) ||
          (msg.to === me?._id && msg.from === activeId));
      if (isInThisConvo) {
        setMessages((prev) =>
          prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]
        );
      }
      loadContacts();
    };
    const onTypingStart = ({ from }) => {
      if (from === activeId) setPeerTyping(true);
    };
    const onTypingStop = ({ from }) => {
      if (from === activeId) setPeerTyping(false);
    };
    socket.on('message:new', onNewMessage);
    socket.on('typing:start', onTypingStart);
    socket.on('typing:stop', onTypingStop);
    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:start', onTypingStart);
      socket.off('typing:stop', onTypingStop);
    };
  }, [socket, activeId, me?._id, loadContacts]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, peerTyping]);

  const onDraftChange = (e) => {
    setDraft(e.target.value);
    if (!socket || !activeId) return;
    if (!typingActive.current) {
      socket.emit('typing:start', { to: activeId });
      typingActive.current = true;
    }
    clearTimeout(typingStopTimer.current);
    typingStopTimer.current = setTimeout(() => {
      socket.emit('typing:stop', { to: activeId });
      typingActive.current = false;
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending || !activeId) return;
    setSending(true);
    try {
      if (socket && typingActive.current) {
        socket.emit('typing:stop', { to: activeId });
        typingActive.current = false;
      }
      if (connected) {
        await sendMessage(activeId, text);
      } else {
        const { data } = await API.post(`/chat/messages/${activeId}`, { text });
        setMessages((prev) =>
          prev.some((m) => m._id === data._id) ? prev : [...prev, data]
        );
      }
      setDraft('');
    } catch (err) {
      toast.error(err.message || 'Failed to send');
    } finally {
      setSending(false);
    }
  };

  const renderEmpty = () => (
    <div className="hidden md:flex flex-1 items-center justify-center text-center p-12">
      <div>
        <HiOutlineChatAlt2 className="mx-auto text-slate-300 w-16 h-16 mb-3" />
        <p className="text-slate-700 font-semibold mb-1">Your messages</p>
        <p className="text-sm text-slate-500 max-w-xs">
          Pick someone from the left to start chatting. You can only message
          people who follow you back.
        </p>
      </div>
    </div>
  );

  return (
    <div className="glass overflow-hidden flex h-[calc(100vh-7.5rem)] min-h-[480px]">
      <aside
        className={`w-full md:w-72 lg:w-80 border-r border-slate-200 flex flex-col bg-white ${
          activeId ? 'hidden md:flex' : 'flex'
        }`}
      >
        <div className="px-4 py-3 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Messages</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mutual follows only
            <span
              className={`inline-block w-1.5 h-1.5 rounded-full ml-2 align-middle ${
                connected ? 'bg-green-500' : 'bg-slate-300'
              }`}
              title={connected ? 'Connected' : 'Offline'}
            />
          </p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="p-6">
              <Loader />
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-500">
              No mutual follows yet.
              <br />
              <Link
                to="/explore"
                className="text-blue-600 font-medium hover:underline mt-2 inline-block"
              >
                Find people to follow
              </Link>
            </div>
          ) : (
            <ul>
              {contacts.map(({ user, lastMessage, unread }) => {
                const isActive = activeId === user._id;
                const isOnline = onlineUsers.has(user._id);
                return (
                  <li key={user._id}>
                    <button
                      onClick={() => navigate(`/chat/${user._id}`)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left border-l-2 transition-colors ${
                        isActive
                          ? 'bg-blue-50 border-blue-600'
                          : 'border-transparent hover:bg-slate-50'
                      }`}
                    >
                      <Avatar user={user} online={isOnline} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {user.name}
                          </p>
                          {lastMessage && (
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {timeAgoShort(lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className="text-xs text-slate-500 truncate">
                            {lastMessage
                              ? lastMessage.from === me?._id
                                ? `You: ${lastMessage.text}`
                                : lastMessage.text
                              : user.username
                              ? `@${user.username}`
                              : 'Say hello'}
                          </p>
                          {unread > 0 && (
                            <span className="bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] px-1 flex items-center justify-center">
                              {unread > 99 ? '99+' : unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {activeId ? (
        <section className="flex-1 flex flex-col min-w-0 bg-white">
          <header className="px-4 py-3 border-b border-slate-200 flex items-center gap-3">
            <button
              onClick={() => navigate('/chat')}
              className="md:hidden p-1 rounded-lg hover:bg-slate-100 text-slate-600"
              aria-label="Back to contacts"
            >
              <HiOutlineArrowLeft size={20} />
            </button>
            {activeUser && (
              <>
                <Avatar
                  user={activeUser}
                  online={onlineUsers.has(activeUser._id)}
                  size="sm"
                />
                <Link
                  to={`/profile/${activeUser._id}`}
                  className="min-w-0 hover:opacity-80 transition-opacity"
                >
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {activeUser.name}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {onlineUsers.has(activeUser._id)
                      ? 'Online'
                      : activeUser.username
                      ? `@${activeUser.username}`
                      : ''}
                  </p>
                </Link>
              </>
            )}
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-slate-50"
          >
            {permissionError ? (
              <div className="text-center text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg p-4">
                {permissionError}
              </div>
            ) : loadingMessages ? (
              <Loader />
            ) : messages.length === 0 ? (
              <div className="text-center text-sm text-slate-400 py-12">
                No messages yet — say hi
              </div>
            ) : (
              messages.map((m) => {
                const mine = m.from === me?._id;
                return (
                  <div
                    key={m._id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm shadow-sm ${
                        mine
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white text-slate-900 border border-slate-200 rounded-bl-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words leading-snug">
                        {m.text}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          mine ? 'text-blue-100' : 'text-slate-400'
                        }`}
                      >
                        {formatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            {peerTyping && !permissionError && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-sm px-3.5 py-2 text-sm">
                  <span className="inline-flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse" />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: '120ms' }}
                    />
                    <span
                      className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-pulse"
                      style={{ animationDelay: '240ms' }}
                    />
                  </span>
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={handleSend}
            className="px-3 py-3 border-t border-slate-200 flex items-center gap-2 bg-white"
          >
            <input
              type="text"
              value={draft}
              onChange={onDraftChange}
              placeholder={
                permissionError ? 'Messaging disabled' : 'Type a message...'
              }
              disabled={Boolean(permissionError) || sending}
              className="flex-1 bg-slate-100 rounded-lg px-3 py-2 text-sm text-slate-900 outline-none border border-transparent focus:bg-white focus:border-blue-500 focus:shadow-[0_0_0_3px_rgba(37,99,235,0.1)] transition-all placeholder:text-slate-400 disabled:opacity-60"
              maxLength={2000}
            />
            <button
              type="submit"
              disabled={
                !draft.trim() || sending || Boolean(permissionError)
              }
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Send"
            >
              <HiOutlinePaperAirplane size={20} className="rotate-90" />
            </button>
          </form>
        </section>
      ) : (
        renderEmpty()
      )}
    </div>
  );
}
