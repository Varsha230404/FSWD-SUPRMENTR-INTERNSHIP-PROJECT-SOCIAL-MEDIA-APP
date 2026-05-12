import { useDispatch, useSelector } from 'react-redux';
import { toggleLike } from '../store/postSlice';
import { HiHeart, HiOutlineHeart } from 'react-icons/hi';

export default function LikeButton({ post }) {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const isLiked = post.likes?.some((id) => (typeof id === 'object' ? id._id === user?._id : id === user?._id));

  return (
    <button
      onClick={() => dispatch(toggleLike(post._id))}
      className="flex items-center gap-1.5 transition-all duration-200 group"
      aria-label={isLiked ? 'Unlike' : 'Like'}
    >
      {isLiked ? (
        <HiHeart size={22} className="text-pink-500 animate-[ping_0.3s_ease-out_1]" />
      ) : (
        <HiOutlineHeart size={22} className="text-text-muted group-hover:text-pink-400 group-hover:scale-110 transition-all" />
      )}
    </button>
  );
}
