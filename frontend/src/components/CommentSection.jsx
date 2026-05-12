import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { HiOutlineTrash } from 'react-icons/hi';
import API from '../api/axios';
import toast from 'react-hot-toast';
import { incrementCommentCount, decrementCommentCount } from '../store/postSlice';

export default function CommentSection({ postId }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    API.get(`/posts/${postId}/comments`)
      .then((res) => setComments(res.data))
      .catch(() => {});
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await API.post(`/posts/${postId}/comments`, { text });
      setComments([res.data, ...comments]);
      dispatch(incrementCommentCount(postId));
      setText('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/comments/${id}`);
      setComments(comments.filter((c) => c._id !== id));
      dispatch(decrementCommentCount(postId));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
  };

  return (
    <div className="mt-4 border-t border-neutral-200 pt-4">
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 bg-neutral-50 rounded-xl px-3 py-2 text-sm text-neutral-900 outline-none border border-neutral-200 focus:border-neutral-900 focus:shadow-[0_0_0_3px_rgba(23,23,23,0.08)] transition-all placeholder:text-neutral-400"
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.97] text-white text-sm rounded-xl font-semibold disabled:bg-neutral-200 disabled:text-neutral-400 disabled:cursor-not-allowed disabled:active:scale-100 transition-all"
        >
          Post
        </button>
      </form>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {comments.map((c) => (
          <div key={c._id} className="flex gap-2 items-start animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-500 flex items-center justify-center text-xs font-bold text-white shrink-0 overflow-hidden">
              {c.user?.avatar ? (
                <img src={c.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                c.user?.name?.[0]
              )}
            </div>
            <div className="flex-1 bg-neutral-100 rounded-xl px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-neutral-900 truncate">
                  {c.user?.username ? `@${c.user.username}` : c.user?.name}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-neutral-400">{timeAgo(c.createdAt)}</span>
                  {c.user?._id === user?._id && (
                    <button
                      onClick={() => handleDelete(c._id)}
                      className="text-neutral-400 hover:text-red-500 transition-colors"
                    >
                      <HiOutlineTrash size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-neutral-800 mt-0.5 break-words">{c.text}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && (
          <p className="text-xs text-neutral-400 text-center py-2">No comments yet</p>
        )}
      </div>
    </div>
  );
}
