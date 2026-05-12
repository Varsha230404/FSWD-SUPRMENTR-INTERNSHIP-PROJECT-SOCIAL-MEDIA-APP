import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { deletePost } from '../store/postSlice';
import {
  HiOutlineChatAlt2,
  HiOutlineTrash,
  HiOutlineDotsHorizontal,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlinePaperAirplane,
} from 'react-icons/hi';
import LikeButton from './LikeButton';
import CommentSection from './CommentSection';
import toast from 'react-hot-toast';
import API from '../api/axios';

export default function PostCard({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savingInProgress, setSavingInProgress] = useState(false);
  const isOwner = user?._id === post.user?._id;

  useEffect(() => {
    if (user?.savedPosts?.includes(post._id)) {
      setSaved(true);
    }
  }, [user, post._id]);

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return 'just now';
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  };

  const handleDelete = () => {
    dispatch(deletePost(post._id));
    toast.success('Post deleted');
    setShowMenu(false);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/post/${post._id}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleSave = async () => {
    if (savingInProgress) return;
    setSavingInProgress(true);
    const wasSaved = saved;
    setSaved(!saved);
    try {
      await API.put(`/posts/${post._id}/save`);
      toast.success(wasSaved ? 'Post unsaved' : 'Post saved');
    } catch {
      setSaved(wasSaved);
      toast.error('Failed to save post');
    } finally {
      setSavingInProgress(false);
    }
  };

  return (
    <article className="glass animate-fadeIn hover:shadow-[0_4px_24px_-6px_rgba(0,0,0,0.08)] transition-shadow duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4">
        <Link
          to={`/profile/${post.user?._id}`}
          className="flex items-center gap-3 group min-w-0"
        >
          <div className="w-10 h-10 rounded-full bg-blue-100 ring-2 ring-blue-200 flex items-center justify-center shrink-0 overflow-hidden">
            {post.user?.avatar ? (
              <img src={post.user.avatar} alt="" className="w-full h-full object-cover rounded-full" />
            ) : (
              <span className="text-sm font-semibold text-blue-600">
                {post.user?.name?.[0]}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-slate-900 group-hover:text-blue-600 truncate leading-tight transition-colors">
              {post.user?.username ? `@${post.user.username}` : post.user?.name}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">{timeAgo(post.createdAt)}</p>
          </div>
        </Link>
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-slate-50 text-slate-400 transition-colors"
            >
              <HiOutlineDotsHorizontal size={20} />
            </button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-lg min-w-[160px] z-20 animate-fadeIn">
                  <button
                    onClick={handleDelete}
                    className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <HiOutlineTrash size={16} /> Delete post
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {post.image && (
        <div className="bg-slate-50 border-y border-slate-100">
          <img
            src={post.image}
            alt="Post"
            className="w-full max-h-[600px] object-contain"
            loading="lazy"
          />
        </div>
      )}

      <div className="px-5 pt-4 flex items-center gap-5">
        <LikeButton post={post} />
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors group"
        >
          <HiOutlineChatAlt2
            size={22}
            className="group-hover:scale-110 transition-transform"
          />
          <span className="font-medium">{post.commentCount || 0}</span>
        </button>
        <button
          onClick={handleShare}
          className="text-slate-500 hover:text-blue-600 transition-colors group"
          title="Copy link"
        >
          <HiOutlinePaperAirplane
            size={22}
            className="rotate-90 group-hover:scale-110 transition-transform"
          />
        </button>
        <button
          onClick={handleSave}
          className="ml-auto text-slate-500 hover:text-blue-600 transition-colors group"
          title={saved ? 'Unsave' : 'Save'}
        >
          {saved ? (
            <HiBookmark size={22} className="text-blue-600 group-hover:scale-110 transition-transform" />
          ) : (
            <HiOutlineBookmark size={22} className="group-hover:scale-110 transition-transform" />
          )}
        </button>
      </div>

      {post.likes?.length > 0 && (
        <p className="px-5 pt-3 text-sm font-semibold text-slate-900">
          {post.likes.length} {post.likes.length === 1 ? 'like' : 'likes'}
        </p>
      )}

      {post.text && (
        <div className="px-5 pt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-700 break-words">
          <Link
            to={`/profile/${post.user?._id}`}
            className="font-semibold text-slate-900 mr-2 hover:text-blue-600 transition-colors"
          >
            {post.user?.username ? `@${post.user.username}` : post.user?.name}
          </Link>
          <span>{post.text}</span>
        </div>
      )}

      {!showComments && (post.commentCount || 0) > 0 && (
        <button
          onClick={() => setShowComments(true)}
          className="px-5 pt-2 text-xs text-slate-400 hover:text-blue-600 transition-colors block"
        >
          View all {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
        </button>
      )}

      <div className="pb-5" />

      {showComments && (
        <div className="px-5 pb-5 -mt-5">
          <CommentSection postId={post._id} />
        </div>
      )}
    </article>
  );
}
